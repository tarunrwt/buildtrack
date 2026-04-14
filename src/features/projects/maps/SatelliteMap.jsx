import { useEffect, useRef } from "react"
import { MapPin } from "lucide-react"
import { FONT, C } from "../../../constants/colors"
import { loadLeaflet } from "../../../utils/mapLoader"

export const SatelliteMap = ({ lat, lng, projectName, height = 340 }) => {
  const containerRef = useRef(null)
  const mapRef       = useRef(null)

  useEffect(() => {
    if (!lat || !lng) return
    loadLeaflet().then(L => {
      if (!containerRef.current || mapRef.current) return
      const map = L.map(containerRef.current).setView([parseFloat(lat), parseFloat(lng)], 17)
      mapRef.current = map
      L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
        attribution: "Tiles © Esri", maxZoom: 19
      }).addTo(map)
      const icon = L.divIcon({
        html: `<div style="width:20px;height:20px;background:#F97316;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.35)"></div>`,
        iconSize: [20, 20], iconAnchor: [10, 20], className: ""
      })
      L.marker([parseFloat(lat), parseFloat(lng)], { icon }).addTo(map)
        .bindPopup(`<b style="font-family:Arial">${projectName}</b><br><span style="font-size:11px;color:#64748B">${parseFloat(lat).toFixed(5)}, ${parseFloat(lng).toFixed(5)}</span>`)
        .openPopup()
    })
    return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null } }
  }, [lat, lng, projectName])

  if (!lat || !lng) return (
    <div style={{ height, background: "#F1F5F9", borderRadius: 12, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, border: `1px dashed ${C.border}` }}>
      <MapPin size={30} color={C.textLight} />
      <p style={{ fontFamily: FONT, fontSize: 13, color: C.textMuted, margin: 0 }}>No location saved for this project</p>
      <p style={{ fontFamily: FONT, fontSize: 11, color: C.textLight, margin: 0 }}>Edit the project and click on the map to set a location</p>
    </div>
  )

  return <div ref={containerRef} style={{ width: "100%", height, borderRadius: 12, overflow: "hidden", border: `1px solid ${C.border}` }} />
}
