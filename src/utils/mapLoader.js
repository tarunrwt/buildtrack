/**
 * Lazily loads the Leaflet mapping library from CDN.
 * Resolves with the global L instance once the script is ready.
 * Safe to call multiple times — returns immediately if already loaded.
 */
export const loadLeaflet = () => new Promise(resolve => {
  if (window.L) { resolve(window.L); return }
  if (!document.getElementById("leaflet-css")) {
    const link = document.createElement("link")
    link.id = "leaflet-css"; link.rel = "stylesheet"
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
    document.head.appendChild(link)
  }
  const script = document.createElement("script")
  script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
  script.onload = () => resolve(window.L)
  document.head.appendChild(script)
})
