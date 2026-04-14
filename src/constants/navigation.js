/**
 * Navigation configuration.
 * Add new top-level pages here. The Sidebar and PAGES router both consume NAV.
 */

import {
  LayoutDashboard, FolderOpen, FileText, Package,
  BarChart2, Users, DollarSign, AlertTriangle, Wrench, Bot
} from "lucide-react"

export const ALL_ROLES   = ["admin","project_manager","accountant","site_engineer","viewer"]
export const FIELD_ROLES = ["admin","project_manager","site_engineer"]
export const MGMT_ROLES  = ["admin","project_manager","accountant"]

export const NAV = [
  { key: "dashboard",    label: "Dashboard",        icon: LayoutDashboard, roles: ALL_ROLES },
  { key: "projects",     label: "Projects",          icon: FolderOpen,      roles: ALL_ROLES },
  { key: "submit-dpr",   label: "Submit DPR",        icon: FileText,        roles: FIELD_ROLES },
  { key: "site-issues",  label: "Site Issues",       icon: AlertTriangle,   roles: FIELD_ROLES },
  { key: "labour",       label: "Labour Register",   icon: Wrench,          roles: ["admin","project_manager","accountant","site_engineer"] },
  { key: "reports",      label: "Reports",           icon: BarChart2,       roles: ALL_ROLES },
  { key: "materials",    label: "Materials",         icon: Package,         roles: ["admin","project_manager","accountant","site_engineer"] },
  { key: "financials",   label: "Financials",        icon: DollarSign,      roles: MGMT_ROLES },
  { key: "ai-assistant", label: "AI Assistant",      icon: Bot,             roles: ["admin","project_manager","accountant","site_engineer"] },
  { key: "users",        label: "User Management",   icon: Users,           roles: ["admin"] },
]
