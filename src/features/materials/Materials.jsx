import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar } from "recharts"
import { useState, useEffect } from "react"
import { supabase } from "../../lib/supabase"
import { FONT, FONT_HEADING, C } from "../../constants/colors"
import { Input, Select, Btn, Modal, Empty, StatusBadge, TabBar, KPICard, Spinner, Badge } from "../../components"
import { TopBar } from "../../layout/TopBar"
import { fmt } from "../../utils/formatters"
import { Plus, Trash2, ShoppingCart, AlertTriangle, Package, DollarSign, Search } from "lucide-react"

export const Materials = ({ user, projects, notifications, onMarkAllRead }) => {
  const [tab,       setTab]       = useState("Materials")
  const [materials, setMaterials] = useState([])
  const [usage,     setUsage]     = useState([])
  const [purchases, setPurchases] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving,    setSaving]    = useState(false)
  const [search,    setSearch]    = useState("")

  const [matForm,      setMatForm]      = useState({ name: "", category: "", unit: "", cost_per_unit: "", current_stock: "", min_stock_level: "", supplier_name: "", supplier_contact: "" })
  const [usageForm,    setUsageForm]    = useState({ material_id: "", quantity_used: "", project_id: "", usage_date: new Date().toISOString().split("T")[0], notes: "" })
  const [purchaseForm, setPurchaseForm] = useState({ material_id: "", quantity_purchased: "", cost_per_unit: "", supplier_name: "", purchase_date: new Date().toISOString().split("T")[0], invoice_number: "" })

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const [{ data: m }, { data: u }, { data: p }] = await Promise.all([
        supabase.from("materials").select("*").order("created_at", { ascending: false }),
        supabase.from("material_usage").select("*, materials(name), projects(name)").order("usage_date", { ascending: false }),
        supabase.from("material_purchases").select("*, materials(name)").order("purchase_date", { ascending: false }),
      ])
      setMaterials(m || []); setUsage(u || []); setPurchases(p || [])
      setLoading(false)
    }
    load()
  }, [])

  const handleAddMaterial = async () => {
    if (!matForm.name || !matForm.category || !matForm.unit) return
    setSaving(true)
    const { data } = await supabase.from("materials").insert({ ...matForm, user_id: user.id, cost_per_unit: parseFloat(matForm.cost_per_unit) || 0, current_stock: parseFloat(matForm.current_stock) || 0, min_stock_level: parseFloat(matForm.min_stock_level) || 0 }).select().single()
    if (data) setMaterials(ms => [data, ...ms])
    setSaving(false); setShowModal(false)
    setMatForm({ name: "", category: "", unit: "", cost_per_unit: "", current_stock: "", min_stock_level: "", supplier_name: "", supplier_contact: "" })
  }

  const handleAddUsage = async () => {
    if (!usageForm.material_id || !usageForm.quantity_used || !usageForm.usage_date) return
    setSaving(true)
    const { data } = await supabase.from("material_usage").insert({ material_id: usageForm.material_id, project_id: usageForm.project_id || null, user_id: user.id, quantity_used: parseFloat(usageForm.quantity_used), usage_date: usageForm.usage_date, notes: usageForm.notes || null }).select("*, materials(name), projects(name)").single()
    if (data) {
      setUsage(us => [data, ...us])
      const { data: updatedMat } = await supabase.from("materials").select("*").eq("id", usageForm.material_id).single()
      if (updatedMat) setMaterials(ms => ms.map(m => m.id === updatedMat.id ? updatedMat : m))
    }
    setSaving(false); setShowModal(false)
    setUsageForm({ material_id: "", quantity_used: "", project_id: "", usage_date: new Date().toISOString().split("T")[0], notes: "" })
  }

  const handleAddPurchase = async () => {
    if (!purchaseForm.material_id || !purchaseForm.quantity_purchased || !purchaseForm.purchase_date) return
    setSaving(true)
    const qty = parseFloat(purchaseForm.quantity_purchased)
    const cpu = parseFloat(purchaseForm.cost_per_unit) || 0
    const { data } = await supabase.from("material_purchases").insert({ material_id: purchaseForm.material_id, user_id: user.id, quantity_purchased: qty, cost_per_unit: cpu, total_cost: qty * cpu, purchase_date: purchaseForm.purchase_date, supplier_name: purchaseForm.supplier_name || null, invoice_number: purchaseForm.invoice_number || null }).select("*, materials(name)").single()
    if (data) {
      setPurchases(ps => [data, ...ps])
      const { data: updatedMat } = await supabase.from("materials").select("*").eq("id", purchaseForm.material_id).single()
      if (updatedMat) setMaterials(ms => ms.map(m => m.id === updatedMat.id ? updatedMat : m))
    }
    setSaving(false); setShowModal(false)
    setPurchaseForm({ material_id: "", quantity_purchased: "", cost_per_unit: "", supplier_name: "", purchase_date: new Date().toISOString().split("T")[0], invoice_number: "" })
  }

  const handleDeleteMaterial = async (id) => {
    if (!confirm("Delete this material? This cannot be undone.")) return
    const { error } = await supabase.from("materials").delete().eq("id", id)
    if (!error) setMaterials(ms => ms.filter(m => m.id !== id))
  }

  const ctxButton = { "Materials": { label: "Add Material", action: () => setShowModal(true) }, "Usage Log": { label: "Add Usage", action: () => setShowModal(true) }, "Purchases": { label: "Add Purchase", action: () => setShowModal(true) }, "Analytics": null }[tab]
  const filtered   = materials.filter(m => m.name.toLowerCase().includes(search.toLowerCase()) || m.category.toLowerCase().includes(search.toLowerCase()))
  const totalValue = materials.reduce((s, m) => s + ((m.current_stock || 0) * (m.cost_per_unit || 0)), 0)
  const lowStock   = materials.filter(m => (m.current_stock || 0) < (m.min_stock_level || 0)).length

  const materialOptions = [{ value: "", label: "Select Material" }, ...materials.map(m => ({ value: m.id, label: `${m.name} (${m.unit})` }))]
  const projectOptions  = [{ value: "", label: "No Project" }, ...(projects || []).map(p => ({ value: p.id, label: p.name }))]

  return (
    <div style={{ padding: 28 }}>
      <TopBar title="Materials & Inventory" subtitle={`${materials.length} item${materials.length !== 1 ? "s" : ""} in inventory`} notifications={notifications} onMarkAllRead={onMarkAllRead}
        actions={ctxButton ? <Btn onClick={ctxButton.action} icon={Plus}>{ctxButton.label}</Btn> : null} />

      {/* Guard: No projects */}
      {(projects || []).length === 0 && (
        <div style={{ marginTop: 32, background: "#FFFBEB", border: "1px solid #FCD34D", borderRadius: 12, padding: 24, display: "flex", alignItems: "center", gap: 16 }}>
          <AlertTriangle size={22} color={C.warning} style={{ flexShrink: 0 }} />
          <div>
            <p style={{ fontFamily: FONT_HEADING, fontSize: 15, fontWeight: 700, color: C.text, margin: 0 }}>No active projects</p>
            <p style={{ fontFamily: FONT, fontSize: 13, color: C.textMuted, margin: "4px 0 0" }}>Material usage tracking requires at least one project. Your inventory catalog is shown below but usage cannot be logged until a project is created.</p>
          </div>
        </div>
      )}
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", margin: "24px 0" }}>
        <KPICard label="Total Items"      value={materials.length} sub="in inventory"    icon={Package}       accent={C.info}   />
        <KPICard label="Inventory Value"  value={fmt(totalValue)}  sub="current stock"   icon={DollarSign}    accent={C.success}/>
        <KPICard label="Low Stock"        value={lowStock}         sub="need reorder"    icon={AlertTriangle} accent={lowStock > 0 ? C.danger : C.success} />
      </div>
      <div style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, overflow: "hidden" }}>
        <TabBar tabs={["Materials","Usage Log","Purchases","Analytics"]} active={tab} onChange={t => { setTab(t); setShowModal(false) }} />
        <div style={{ padding: 24 }}>
          {loading ? <Spinner /> : (
            <>
              {tab === "Materials" && (
                <div>
                  <div style={{ marginBottom: 16 }}><Input placeholder="Search materials..." value={search} onChange={e => setSearch(e.target.value)} icon={Search} /></div>
                  {filtered.length === 0 ? <Empty message="No materials found" sub="Add your first material using the button above" /> : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
                      {filtered.map(m => {
                        const isLow = (m.current_stock || 0) < (m.min_stock_level || 0)
                        return (
                          <div key={m.id} style={{ background: "#F8FAFC", borderRadius: 12, padding: "16px 18px", border: `1px solid ${isLow ? C.danger + "40" : C.border}` }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                              <div><p style={{ fontFamily: FONT, fontSize: 14, fontWeight: 700, color: C.text, margin: "0 0 4px" }}>{m.name}</p><StatusBadge status={m.category} /></div>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                {isLow && <Badge label="Low Stock" color={C.danger} bg="#FEE2E2" />}
                                <button onClick={() => handleDeleteMaterial(m.id)} title="Delete material"
                                  style={{ background: "none", border: "none", cursor: "pointer", padding: 4, borderRadius: 6, color: C.danger, display: "flex", alignItems: "center" }}
                                  onMouseEnter={e => e.currentTarget.style.background = "#FEE2E2"}
                                  onMouseLeave={e => e.currentTarget.style.background = "none"}>
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 12 }}>
                              <div><p style={{ fontFamily: FONT, fontSize: 11, color: C.textMuted, margin: 0 }}>Current Stock</p><p style={{ fontFamily: FONT_HEADING, fontSize: 18, fontWeight: 700, color: isLow ? C.danger : C.text, margin: 0 }}>{(m.current_stock || 0).toLocaleString()} {m.unit}</p></div>
                              <div><p style={{ fontFamily: FONT, fontSize: 11, color: C.textMuted, margin: 0 }}>Unit Cost</p><p style={{ fontFamily: FONT_HEADING, fontSize: 18, fontWeight: 700, color: C.text, margin: 0 }}>₹{m.cost_per_unit}</p></div>
                              <div><p style={{ fontFamily: FONT, fontSize: 11, color: C.textMuted, margin: 0 }}>Min Level</p><p style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: C.charcoal, margin: 0 }}>{(m.min_stock_level || 0).toLocaleString()} {m.unit}</p></div>
                              <div><p style={{ fontFamily: FONT, fontSize: 11, color: C.textMuted, margin: 0 }}>Total Value</p><p style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: C.success, margin: 0 }}>{fmt((m.current_stock || 0) * (m.cost_per_unit || 0))}</p></div>
                            </div>
                            {m.supplier_name && <p style={{ fontFamily: FONT, fontSize: 12, color: C.textMuted, margin: "10px 0 0" }}>Supplier: {m.supplier_name}</p>}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
              {tab === "Usage Log" && (
                usage.length === 0 ? <Empty message="No usage records yet" sub="Click Add Usage to log material consumption" /> : (
                  <table className="responsive-table" style={{ width: "100%", borderCollapse: "collapse", fontFamily: FONT, fontSize: 13 }}>
                    <thead><tr style={{ background: "#F8FAFC" }}>{["Date","Material","Project","Quantity","Notes"].map(h => <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 700, color: C.charcoal, borderBottom: `2px solid ${C.border}` }}>{h}</th>)}</tr></thead>
                    <tbody>{usage.map(u => <tr key={u.id} style={{ borderBottom: `1px solid ${C.border}` }}><td data-label="Date" style={{ padding: "10px 14px" }}>{u.usage_date}</td><td data-label="Material" style={{ padding: "10px 14px", fontWeight: 600 }}>{u.materials?.name}</td><td data-label="Project" style={{ padding: "10px 14px" }}>{u.projects?.name || "—"}</td><td data-label="Quantity" style={{ padding: "10px 14px" }}>{u.quantity_used}</td><td data-label="Notes" style={{ padding: "10px 14px", color: C.textMuted }}>{u.notes || "—"}</td></tr>)}</tbody>
                  </table>
                )
              )}
              {tab === "Purchases" && (
                purchases.length === 0 ? <Empty message="No purchases recorded yet" sub="Click Add Purchase to record a procurement" /> : (
                  <table className="responsive-table" style={{ width: "100%", borderCollapse: "collapse", fontFamily: FONT, fontSize: 13 }}>
                    <thead><tr style={{ background: "#F8FAFC" }}>{["Date","Material","Qty","Unit Cost","Total","Supplier","Invoice"].map(h => <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 700, color: C.charcoal, borderBottom: `2px solid ${C.border}` }}>{h}</th>)}</tr></thead>
                    <tbody>{purchases.map(p => <tr key={p.id} style={{ borderBottom: `1px solid ${C.border}` }}><td data-label="Date" style={{ padding: "10px 14px" }}>{p.purchase_date}</td><td data-label="Material" style={{ padding: "10px 14px", fontWeight: 600 }}>{p.materials?.name}</td><td data-label="Qty" style={{ padding: "10px 14px" }}>{p.quantity_purchased}</td><td data-label="Unit Cost" style={{ padding: "10px 14px" }}>₹{p.cost_per_unit}</td><td data-label="Total" style={{ padding: "10px 14px", fontWeight: 700, color: C.success }}>{fmt(p.total_cost)}</td><td data-label="Supplier" style={{ padding: "10px 14px", color: C.textMuted }}>{p.supplier_name || "—"}</td><td data-label="Invoice" style={{ padding: "10px 14px", color: C.textMuted }}>{p.invoice_number || "—"}</td></tr>)}</tbody>
                  </table>
                )
              )}
              {tab === "Analytics" && (
                materials.length === 0 ? <Empty message="Add materials to see analytics" /> : (
                  <div>
                    <h3 style={{ fontFamily: FONT_HEADING, fontSize: 15, fontWeight: 700, color: C.charcoal, margin: "0 0 16px", textTransform: "uppercase" }}>Inventory Value by Category</h3>
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={Object.entries(materials.reduce((acc, m) => { acc[m.category] = (acc[m.category] || 0) + (m.current_stock || 0) * (m.cost_per_unit || 0); return acc }, {})).map(([k, v]) => ({ category: k, value: v }))}>
                        <CartesianGrid strokeDasharray="3 3" stroke={C.border} /><XAxis dataKey="category" tick={{ fontFamily: FONT, fontSize: 11 }} /><YAxis tickFormatter={v => fmt(v)} tick={{ fontFamily: FONT, fontSize: 11 }} /><Tooltip formatter={v => fmt(v)} /><Bar dataKey="value" fill={C.accent} radius={[4, 4, 0, 0]} name="Value" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )
              )}
            </>
          )}
        </div>
      </div>
      {showModal && tab === "Materials" && (
        <Modal title="Add Material" onClose={() => setShowModal(false)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Input label="Material Name" value={matForm.name} onChange={e => setMatForm(f => ({ ...f, name: e.target.value }))} required placeholder="e.g. Portland Cement OPC 53" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Input label="Category"       value={matForm.category}      onChange={e => setMatForm(f => ({ ...f, category: e.target.value }))}      required placeholder="e.g. Cement & Concrete" />
              <Input label="Unit"           value={matForm.unit}           onChange={e => setMatForm(f => ({ ...f, unit: e.target.value }))}           required placeholder="e.g. bag, kg, cft" />
              <Input label="Cost per Unit (₹)" type="number" value={matForm.cost_per_unit}   onChange={e => setMatForm(f => ({ ...f, cost_per_unit: e.target.value }))}   placeholder="0" />
              <Input label="Opening Stock"     type="number" value={matForm.current_stock}   onChange={e => setMatForm(f => ({ ...f, current_stock: e.target.value }))}   placeholder="0" />
              <Input label="Min Stock Level"   type="number" value={matForm.min_stock_level} onChange={e => setMatForm(f => ({ ...f, min_stock_level: e.target.value }))} placeholder="0" />
              <Input label="Supplier Name"  value={matForm.supplier_name}  onChange={e => setMatForm(f => ({ ...f, supplier_name: e.target.value }))}  placeholder="Optional" />
            </div>
            <Input label="Supplier Contact" value={matForm.supplier_contact} onChange={e => setMatForm(f => ({ ...f, supplier_contact: e.target.value }))} placeholder="Phone or email" />
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
              <Btn variant="secondary" onClick={() => setShowModal(false)}>Cancel</Btn>
              <Btn onClick={handleAddMaterial} disabled={saving}>{saving ? "Saving..." : "Add Material"}</Btn>
            </div>
          </div>
        </Modal>
      )}
      {showModal && tab === "Usage Log" && (
        <Modal title="Add Usage" onClose={() => setShowModal(false)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Select label="Material" value={usageForm.material_id} onChange={e => setUsageForm(f => ({ ...f, material_id: e.target.value }))} required options={materialOptions} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Input label="Quantity Used" type="number" value={usageForm.quantity_used} onChange={e => setUsageForm(f => ({ ...f, quantity_used: e.target.value }))} required placeholder="0" />
              <Input label="Date" type="date" value={usageForm.usage_date} onChange={e => setUsageForm(f => ({ ...f, usage_date: e.target.value }))} required />
            </div>
            <Select label="Project" value={usageForm.project_id} onChange={e => setUsageForm(f => ({ ...f, project_id: e.target.value }))} options={projectOptions} />
            <Input label="Remarks" value={usageForm.notes} onChange={e => setUsageForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional notes" />
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
              <Btn variant="secondary" onClick={() => setShowModal(false)}>Cancel</Btn>
              <Btn onClick={handleAddUsage} disabled={saving}>{saving ? "Saving..." : "Log Usage"}</Btn>
            </div>
          </div>
        </Modal>
      )}
      {showModal && tab === "Purchases" && (
        <Modal title="Add Purchase" onClose={() => setShowModal(false)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Select label="Material" value={purchaseForm.material_id} onChange={e => setPurchaseForm(f => ({ ...f, material_id: e.target.value }))} required options={materialOptions} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Input label="Quantity Purchased" type="number" value={purchaseForm.quantity_purchased} onChange={e => setPurchaseForm(f => ({ ...f, quantity_purchased: e.target.value }))} required placeholder="0" />
              <Input label="Cost per Unit (₹)"  type="number" value={purchaseForm.cost_per_unit}      onChange={e => setPurchaseForm(f => ({ ...f, cost_per_unit: e.target.value }))}      placeholder="0" />
              <Input label="Supplier"            value={purchaseForm.supplier_name}   onChange={e => setPurchaseForm(f => ({ ...f, supplier_name: e.target.value }))}   placeholder="Supplier name" />
              <Input label="Invoice No."         value={purchaseForm.invoice_number}  onChange={e => setPurchaseForm(f => ({ ...f, invoice_number: e.target.value }))}  placeholder="Optional" />
              <Input label="Purchase Date" type="date" value={purchaseForm.purchase_date} onChange={e => setPurchaseForm(f => ({ ...f, purchase_date: e.target.value }))} required />
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
              <Btn variant="secondary" onClick={() => setShowModal(false)}>Cancel</Btn>
              <Btn onClick={handleAddPurchase} disabled={saving}>{saving ? "Saving..." : "Record Purchase"}</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE — Financial Dashboard
// ─────────────────────────────────────────────────────────────────────────────
