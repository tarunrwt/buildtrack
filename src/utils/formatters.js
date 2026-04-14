/**
 * Formatters — currency display and role labels.
 */

/**
 * Formats a rupee amount into a human-readable string.
 * Values >= 1 Cr are shown in Cr; values >= 1 L are shown in L; otherwise full.
 */
export const fmt = n =>
  n >= 10000000 ? `₹${(n / 10000000).toFixed(1)}Cr`
  : n >= 100000 ? `₹${(n / 100000).toFixed(1)}L`
  : `₹${(n || 0).toLocaleString("en-IN")}`

/** Maps a database role key to a human-readable label. */
export const formatRole = role => ({
  admin:           "Admin",
  project_manager: "Project Manager",
  site_engineer:   "Site Engineer",
  accountant:      "Accountant",
  viewer:          "Viewer",
}[role] || "Viewer")
