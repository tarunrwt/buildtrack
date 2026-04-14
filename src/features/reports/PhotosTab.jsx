import { useState, useEffect } from "react"
import { supabase } from "../../lib/supabase"
import { FONT, FONT_HEADING, C } from "../../constants/colors"
import { Empty, Spinner, Btn, Modal, Select, Input } from "../../components"
import { Image, X, Download, Eye, Camera, Upload, Plus } from "lucide-react"

// COMPONENT — Photos Tab (used inside Reports page)
// Renders DPR-linked photos and the standalone project gallery.
// Only site engineers see the standalone upload button.
// ─────────────────────────────────────────────────────────────────────────────

export const PhotosTab = ({ user, userRole, projects, projFilter }) => {
  const [dprPhotos,     setDprPhotos]     = useState([])
  const [galleryPhotos, setGalleryPhotos] = useState([])
  const [loading,       setLoading]       = useState(true)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [galleryFiles,  setGalleryFiles]  = useState([])
  const [galleryProject,setGalleryProject]= useState("")
  const [galleryCaption,setGalleryCaption]= useState("")
  const [uploading,     setUploading]     = useState(false)
  const [lightbox,      setLightbox]      = useState(null)

  const isSiteEngineer = userRole === "site_engineer"

  /** Refreshes signed URLs for all photo records in a given storage bucket. */
  const signUrls = async (bucket, rows) =>
    Promise.all(rows.map(async row => {
      if (!row.file_path) return row
      const { data } = await supabase.storage.from(bucket).createSignedUrl(row.file_path, 3600)
      return { ...row, signed_url: data?.signedUrl || null }
    }))

  const load = async () => {
    setLoading(true)
    const projectIds = projFilter === "All Projects" ? projects.map(p => p.id) : [projFilter]
    if (projectIds.length === 0) { setLoading(false); return }
    const [{ data: dp }, { data: gp }] = await Promise.all([
      supabase.from("dpr_photos").select("*, daily_reports(report_date)").in("project_id", projectIds).order("created_at", { ascending: false }),
      supabase.from("project_photos").select("*, profiles(full_name)").in("project_id", projectIds).order("created_at", { ascending: false }),
    ])
    const [signedDpr, signedGallery] = await Promise.all([signUrls("dpr-photos", dp || []), signUrls("project-gallery", gp || [])])
    setDprPhotos(signedDpr); setGalleryPhotos(signedGallery)
    setLoading(false)
  }

  useEffect(() => { load() }, [projFilter])

  const handleGalleryUpload = async () => {
    if (!galleryProject || galleryFiles.length === 0) return
    setUploading(true)
    for (const file of galleryFiles) {
      const ext        = file.name.split(".").pop()
      const uniqueName = `${Math.random().toString(36).slice(2)}-${Date.now()}.${ext}`
      const filePath   = `${galleryProject}/${uniqueName}`
      const { error: upErr } = await supabase.storage.from("project-gallery").upload(filePath, file)
      if (!upErr) {
        const { data: urlData } = await supabase.storage.from("project-gallery").createSignedUrl(filePath, 3600)
        await supabase.from("project_photos").insert({ project_id: galleryProject, user_id: user.id, file_name: file.name, file_path: filePath, public_url: urlData?.signedUrl || null, caption: galleryCaption || null, file_size: file.size, mime_type: file.type })
      }
    }
    setUploading(false); setShowUploadModal(false)
    setGalleryFiles([]); setGalleryProject(""); setGalleryCaption("")
    load()
  }

  const PhotoGrid = ({ photos, emptyMsg }) => {
    if (photos.length === 0) return <Empty message={emptyMsg} />
    return (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
        {photos.map(ph => (
          <div key={ph.id} onClick={() => setLightbox({ url: ph.signed_url, caption: ph.caption || ph.file_name })}
            style={{ borderRadius: 10, overflow: "hidden", border: `1px solid ${C.border}`, cursor: "pointer", background: "#F8FAFC" }}>
            {ph.signed_url
              ? <img src={ph.signed_url} alt={ph.file_name} style={{ width: "100%", height: 130, objectFit: "cover", display: "block" }} />
              : <div style={{ width: "100%", height: 130, display: "flex", alignItems: "center", justifyContent: "center" }}><Camera size={24} color={C.textLight} /></div>}
            <div style={{ padding: "8px 10px" }}>
              <p style={{ fontFamily: FONT, fontSize: 11, color: C.textMuted, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {ph.caption || ph.daily_reports?.report_date || ph.file_name}
              </p>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (loading) return <Spinner />

  return (
    <div>
      <div style={{ marginBottom: 36 }}>
        <h3 style={{ fontFamily: FONT_HEADING, fontSize: 15, fontWeight: 700, color: C.charcoal, margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.06em" }}>DPR Photos</h3>
        <p style={{ fontFamily: FONT, fontSize: 12, color: C.textMuted, margin: "0 0 16px" }}>Photos attached to Daily Progress Reports</p>
        <PhotoGrid photos={dprPhotos} emptyMsg="No DPR photos yet" />
      </div>
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div>
            <h3 style={{ fontFamily: FONT_HEADING, fontSize: 15, fontWeight: 700, color: C.charcoal, margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Project Gallery</h3>
            <p style={{ fontFamily: FONT, fontSize: 12, color: C.textMuted, margin: 0 }}>Standalone site photos not tied to a specific DPR</p>
          </div>
          {isSiteEngineer && <Btn icon={Camera} size="sm" onClick={() => setShowUploadModal(true)}>Upload Photos</Btn>}
        </div>
        <PhotoGrid photos={galleryPhotos} emptyMsg="No gallery photos yet" />
      </div>

      {/* Full-screen lightbox */}
      {lightbox && (
        <div onClick={() => setLightbox(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ position: "relative", maxWidth: 860, width: "100%" }}>
            <img src={lightbox.url} alt={lightbox.caption} style={{ width: "100%", maxHeight: "80vh", objectFit: "contain", borderRadius: 12 }} />
            {lightbox.caption && <p style={{ fontFamily: FONT, fontSize: 13, color: "#E2E8F0", textAlign: "center", marginTop: 12 }}>{lightbox.caption}</p>}
            <button onClick={() => setLightbox(null)} style={{ position: "absolute", top: -12, right: -12, background: "#fff", border: "none", borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.3)" }}>
              <X size={16} color={C.text} />
            </button>
          </div>
        </div>
      )}

      {/* Gallery upload modal */}
      {showUploadModal && (
        <Modal title="Upload Site Photos" onClose={() => { setShowUploadModal(false); setGalleryFiles([]) }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Select label="Project" required value={galleryProject} onChange={e => setGalleryProject(e.target.value)}
              options={[{ value: "", label: "Select Project" }, ...projects.map(p => ({ value: p.id, label: p.name }))]} />
            <div>
              <label style={{ fontFamily: FONT, fontSize: 12, fontWeight: 600, color: C.charcoal, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 8 }}>
                Photos <span style={{ color: C.danger }}>*</span>
              </label>
              {galleryFiles.length === 0 ? (
                <label style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, border: `2px dashed ${C.border}`, borderRadius: 10, padding: "24px 20px", cursor: "pointer", background: "#F8FAFC" }}>
                  <Upload size={24} color={C.textLight} />
                  <span style={{ fontFamily: FONT, fontSize: 13, color: C.textMuted }}>Click to select up to 5 photos</span>
                  <input type="file" accept="image/jpeg,image/png,image/webp,image/heic" multiple style={{ display: "none" }}
                    onChange={e => setGalleryFiles(Array.from(e.target.files).slice(0, 5))} />
                </label>
              ) : (
                <div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                    {galleryFiles.map((f, i) => (
                      <div key={i} style={{ position: "relative", width: 72, height: 72, borderRadius: 8, overflow: "hidden", border: `1px solid ${C.border}` }}>
                        <img src={URL.createObjectURL(f)} alt={f.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        <button onClick={() => setGalleryFiles(prev => prev.filter((_, idx) => idx !== i))}
                          style={{ position: "absolute", top: 2, right: 2, background: "rgba(0,0,0,0.65)", border: "none", borderRadius: "50%", width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                          <X size={10} color="#fff" />
                        </button>
                      </div>
                    ))}
                    {galleryFiles.length < 5 && (
                      <label style={{ width: 72, height: 72, display: "flex", alignItems: "center", justifyContent: "center", border: `2px dashed ${C.border}`, borderRadius: 8, cursor: "pointer", background: "#F8FAFC" }}>
                        <Plus size={18} color={C.textLight} />
                        <input type="file" accept="image/jpeg,image/png,image/webp,image/heic" multiple style={{ display: "none" }}
                          onChange={e => setGalleryFiles(prev => [...prev, ...Array.from(e.target.files)].slice(0, 5))} />
                      </label>
                    )}
                  </div>
                  <span style={{ fontFamily: FONT, fontSize: 12, color: C.textMuted }}>{galleryFiles.length} photo{galleryFiles.length !== 1 ? "s" : ""} selected</span>
                </div>
              )}
            </div>
            <Input label="Caption (optional)" value={galleryCaption} onChange={e => setGalleryCaption(e.target.value)} placeholder="e.g. Foundation work completed" />
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
              <Btn variant="secondary" onClick={() => { setShowUploadModal(false); setGalleryFiles([]) }}>Cancel</Btn>
              <Btn icon={Upload} disabled={uploading || !galleryProject || galleryFiles.length === 0} onClick={handleGalleryUpload}>{uploading ? "Uploading..." : "Upload"}</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE — Reports
// ─────────────────────────────────────────────────────────────────────────────
