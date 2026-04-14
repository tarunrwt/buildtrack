import { CloudRain, Cloud, Sun } from "lucide-react"
import { C } from "../constants/colors"

/** Renders a contextually appropriate weather icon. */
export const WeatherIcon = ({ w }) => {
  if (w?.toLowerCase().includes("rain"))  return <CloudRain size={14} color={C.info} />
  if (w?.toLowerCase().includes("cloud")) return <Cloud     size={14} color={C.textMuted} />
  return <Sun size={14} color={C.warning} />
}
