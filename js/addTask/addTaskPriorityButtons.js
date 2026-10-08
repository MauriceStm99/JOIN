export function toggleUrgentButtonOnClick() {}
export function toggleMediumButtonOnClick() {}
export function toggleLowButtonOnClick() {}

export function removeClickedFromPriorityButtons() {
  ["priorityLowBtn", "priorityMediumBtn", "priorityUrgentBtn"].forEach((id) => {
    const button = document.getElementById(id);
    if (button) button.classList.remove("clicked");
  });
}
