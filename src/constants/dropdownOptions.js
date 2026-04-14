/**
 * Dropdown option constants for DPR forms.
 */

/** Weather options for the DPR submission form. */
export const WEATHER_OPTIONS = ["", "Sunny", "Cloudy", "Rainy", "Windy", "Foggy"]

/** Floor options for the DPR cascading dropdown. */
export const FLOORS = ["", "Layout / Drawings", "Ground Floor", "First Floor", "Other Floors"]

/** Stage options keyed by selected floor value. */
export const STAGES_BY_FLOOR = {
  "Layout / Drawings": [
    "Site Plan", "Footing Layout", "Column Layout",
    "Floor Plan (Ground)", "Floor Plan (First)", "Floor Plan (Other)",
    "Brick Work Layout", "Door & Window Layout", "Electrical Layout", "Plumbing Layout",
  ],
  "Ground Floor": [
    "Site Preparation", "Excavation", "Foundation Work", "Plinth Work",
    "Superstructure Work", "Roof Work", "Flooring Work", "Plastering",
    "Door & Window Work", "Electrical & Plumbing Work", "Painting & Finishing Work",
  ],
  "First Floor": [
    "Plinth Work", "Superstructure Work", "Roof Work", "Flooring Work",
    "Plastering", "Door & Window Work", "Electrical & Plumbing Work", "Painting & Finishing Work",
  ],
  "Other Floors": [
    "Plinth Work", "Superstructure Work", "Roof Work", "Flooring Work",
    "Plastering", "Door & Window Work", "Electrical & Plumbing Work", "Painting & Finishing Work",
  ],
}
