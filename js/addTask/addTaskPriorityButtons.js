const PRIORITY_BUTTON_IDS = ["priorityLowBtn", "priorityMediumBtn", "priorityUrgentBtn"];

/**
 * Hook that runs when the urgent button gets selected, the styling is done by CSS.
 */
export function toggleUrgentButtonOnClick() {}

/**
 * Hook that runs when the medium button gets selected, the styling is done by CSS.
 */
export function toggleMediumButtonOnClick() {}

/**
 * Hook that runs when the low button gets selected, the styling is done by CSS.
 */
export function toggleLowButtonOnClick() {}

/**
 * Deselects all priority buttons.
 */
export function removeClickedFromPriorityButtons() {
  PRIORITY_BUTTON_IDS.forEach((id) => {
    const button = document.getElementById(id);
    if (button) button.classList.remove("clicked");
  });
}
