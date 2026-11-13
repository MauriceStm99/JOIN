const PRIORITY_BUTTON_IDS = ["priorityLowBtn", "priorityMediumBtn", "priorityUrgentBtn"];

/**
 * Deselects all priority buttons.
 */
export function removeClickedFromPriorityButtons() {
  PRIORITY_BUTTON_IDS.forEach((id) => {
    const button = document.getElementById(id);
    if (button) button.classList.remove("clicked");
  });
}
