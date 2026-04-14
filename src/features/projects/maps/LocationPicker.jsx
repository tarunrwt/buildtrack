import { useState, useEffect, useRef } from "react"
import { MapPin } from "lucide-react"
import { FONT, C } from "../../../constants/colors"
import { loadLeaflet } from "../../../utils/mapLoader"

export const LocationPicker = ({ lat, lng, onChange }) => {
  const containerRef = useRef(null)
  const mapRef       = useRef(null)
  const markerRef    = useRef(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [searching,   setSearching]   = useState(false)
  const [searchError, setSearchError] = useState("")

  useEffect(() => {
    loadLeaflet().then(L => {
      if (!containerRef.current || mapRef.current) return
      const hasCoords = lat && lng && !isNaN(parseFloat(lat)) && !isNaN(parseFloat(lng))
      const center    = hasCoords ? [parseFloat(lat), parseFloat(lng)] : [20.5937, 78.9629]
      const zoom      = hasCoords ? 15 : 5
      const map       = L.map(containerRef.current).setView(center, zoom)
      mapRef.current  = map
      L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
        attribution: "© Esri", maxZoom: 19
      }).addTo(map)
      const icon = L.divIcon({
        html: `<div style="width:18px;height:18px;background:#F97316;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.4)"></div>`,
        iconSize: [18, 18], iconAnchor: [9, 9], className: ""
      })
      const placeMarker = (lt, lg) => {
        if (markerRef.current) { markerRef.current.setLatLng([lt, lg]) }
        else {
          markerRef.current = L.marker([lt, lg], { icon, draggable: true }).addTo(map)
          markerRef.current.on("dragend", e => {
            const p = e.target.getLatLng()
            onChange(p.lat.toFixed(6), p.lng.toFixed(6))
          })
        }
        onChange(lt.toFixed(6), lg.toFixed(6))
      }
      if (hasCoords) placeMarker(parseFloat(lat), parseFloat(lng))
      map.on("click", e => placeMarker(e.latlng.lat, e.latlng.lng))
    })
    return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; markerRef.current = null } }
  }, [])

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    setSearching(true); setSearchError("")
    try {
      const res  = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=1`,
        { headers: { "Accept-Language": "en", "User-Agent": "BuildTrack/1.0" } }
      )
      const data = await res.json()
      if (!data.length) { setSearchError("Location not found. Try a more specific name."); setSearching(false); return }
      const { lat: lt, lon: lg } = data[0]
      if (mapRef.current) {
        mapRef.current.setView([parseFloat(lt), parseFloat(lg)], 16)
        const L    = window.L
        const icon = L.divIcon({
          html: `<div style="width:18px;height:18px;background:#F97316;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.4)"></div>`,
          iconSize: [18, 18], iconAnchor: [9, 9], className: ""
        })
        if (markerRef.current) {
          markerRef.current.setLatLng([parseFloat(lt), parseFloat(lg)])
        } else {
          markerRef.current = L.marker([parseFloat(lt), parseFloat(lg)], { icon, draggable: true }).addTo(mapRef.current)
          markerRef.current.on("dragend", e => {
            const p = e.target.getLatLng()
            onChange(p.lat.toFixed(6), p.lng.toFixed(6))
          })
        }
        onChange(parseFloat(lt).toFixed(6), parseFloat(lg).toFixed(6))
      }
    } catch { setSearchError("Search failed. Check your connection and try again.") }
    setSearching(false)
  }

  return (
    <div>
      <label style={{ fontFamily: FONT, fontSize: 12, fontWeight: 600, color: C.charcoal, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 8 }}>
        Site Location
      </label>
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <input type="text" value={searchQuery}
          onChange={e => { setSearchQuery(e.target.value); setSearchError("") }}
          onKeyDown={e => e.key === "Enter" && handleSearch()}
          placeholder="Search location e.g. Srinagar Garhwal, Uttarakhand"
          style={{ flex: 1, fontFamily: FONT, fontSize: 13, color: C.text, background: "#F8FAFC", border: `1px solid ${C.border}`, borderRadius: 8, padding: "9px 12px", outline: "none" }}
        />
        <button onClick={handleSearch} disabled={searching} style={{
          background: C.accent, color: "#fff", border: "none", borderRadius: 8,
          padding: "9px 16px", fontFamily: FONT, fontSize: 13, fontWeight: 600,
          cursor: "pointer", whiteSpace: "nowrap", opacity: searching ? 0.7 : 1
        }}>
          {searching ? "Searching..." : "Search"}
        </button>
      </div>
      {searchError && <p style={{ fontFamily: FONT, fontSize: 12, color: C.danger, margin: "0 0 6px" }}>{searchError}</p>}
      <p style={{ fontFamily: FONT, fontSize: 11, color: C.textMuted, margin: "0 0 6px" }}>Or click directly on the map to drop a pin</p>
      <div ref={containerRef} style={{ width: "100%", height: 260, borderRadius: 10, overflow: "hidden", border: `1px solid ${C.border}` }} />
      {lat && lng && !isNaN(parseFloat(lat)) && (
        <p style={{ fontFamily: FONT, fontSize: 11, color: C.textMuted, margin: "5px 0 0", display: "flex", alignItems: "center", gap: 4 }}>
          <MapPin size={11} /> {parseFloat(lat).toFixed(5)}, {parseFloat(lng).toFixed(5)}
        </p>
      )}
    </div>
  )
}
