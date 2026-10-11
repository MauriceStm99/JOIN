import {
  toggleUrgentButtonOnClick,
  toggleMediumButtonOnClick,
  toggleLowButtonOnClick,
  removeClickedFromPriorityButtons,
} from "./addTaskPriorityButtons.js";
import { initOutsideClickHandler } from "../core/utility.js";

const CONTENT_LIMITS = {
  taskTitle: 80,
  taskDescription: 500,
  subtasks: 120,
  selectedBox: 120,
};

const REQUIRED_FIELDS = [
  { inputId: "taskTitle", hintId: "taskTitleHint" },
  { inputId: "taskDate", hintId: "taskDateHint" },
  { inputId: "categorySelect", hintId: "categoryHint" },
];

const CLEARED_FIELD_IDS = ["taskTitle", "taskDescription", "taskDate", "subtasks", "categorySelect"];

/**
 * Shows or removes the red border of a field.
 * @param {string} fieldId - Id of the field.
 * @param {boolean} invalid - True shows the red border.
 */
export function setFieldInvalid(fieldId, invalid) {
  const field = document.getElementById(fieldId);
  if (field) field.style.borderColor = invalid ? "red" : "";
}

/**
 * Shows or hides the "This field is required" hint.
 * @param {string} hintId - Id of the hint.
 * @param {boolean} show - True shows the hint.
 */
export function toggleHint(hintId, show) {
  const hint = document.getElementById(hintId);
  if (hint) hint.classList.toggle("show", show);
}

/**
 * Marks a field and its hint as valid or invalid.
 * @param {string} inputId - Id of the field.
 * @param {string} hintId - Id of the hint.
 * @param {boolean} invalid - True marks the field as invalid.
 */
function markField(inputId, hintId, invalid) {
  setFieldInvalid(inputId, invalid);
  toggleHint(hintId, invalid);
}

/**
 * Sets the maximum length of several fields.
 * @param {Object<string, number>} limitsById - Maximum length per field id.
 */
export function applyMaxLengths(limitsById) {
  Object.entries(limitsById).forEach(([id, maxLength]) => {
    const input = document.getElementById(id);
    if (input) input.maxLength = maxLength;
  });
}

/**
 * Sets the maximum length of the text fields of the add task page.
 */
export function applyContentLimits() {
  applyMaxLengths(CONTENT_LIMITS);
}

/**
 * Validates title, due date and category when they lose focus.
 * @param {{getTitle: Function, getDueDate: Function, getCategory: Function}} getters - Read the field values.
 */
export function initBlurValidation({ getTitle, getDueDate, getCategory }) {
  document.getElementById("taskTitle")?.addEventListener("blur", () => {
    markField("taskTitle", "taskTitleHint", !getTitle().trim());
  });
  document.getElementById("taskDate")?.addEventListener("blur", () => {
    markField("taskDate", "taskDateHint", !getDueDate());
  });
  document.getElementById("categorySelect")?.addEventListener("blur", () => {
    markField("categorySelect", "categoryHint", !getCategory());
  });
}

/**
 * Validates all required fields and marks the invalid ones.
 * @param {{getTitle: Function, getDueDate: Function, getCategory: Function}} getters - Read the field values.
 * @returns {boolean} True if the form can be sent.
 */
export function validateTaskForm({ getTitle, getDueDate, getCategory }) {
  const titleInvalid = !getTitle().trim();
  const dateInvalid = !getDueDate();
  const categoryInvalid = !getCategory();
  markField("taskTitle", "taskTitleHint", titleInvalid);
  markField("taskDate", "taskDateHint", dateInvalid);
  markField("categorySelect", "categoryHint", categoryInvalid);
  return !(titleInvalid || dateInvalid || categoryInvalid);
}

/**
 * Empties all fields of the add task form and resets the priority to medium.
 * @param {{checkboxList: HTMLElement, selectBox: HTMLInputElement, resetPriority: Function}} options - Form parts to reset.
 */
export function resetAddTaskForm({ checkboxList, selectBox, resetPriority }) {
  clearFormFields(selectBox);
  checkboxList?.querySelectorAll(".assignedToCheckbox").forEach((checkbox) => {
    checkbox.checked = false;
  });
  resetPriorityButtons();
  resetPriority();
  REQUIRED_FIELDS.forEach(({ inputId, hintId }) => markField(inputId, hintId, false));
}

/**
 * Empties the text fields, the subtask list and the assigned avatars.
 * @param {HTMLInputElement|null} selectBox - Search field of the contact dropdown.
 */
function clearFormFields(selectBox) {
  CLEARED_FIELD_IDS.forEach((id) => {
    const input = document.getElementById(id);
    if (input) input.value = "";
  });
  const subtasksList = document.getElementById("subtasksList");
  if (subtasksList) subtasksList.innerHTML = "";
  if (selectBox) selectBox.value = "";
  const assignedIcons = document.getElementById("assignedIcons");
  if (assignedIcons) assignedIcons.innerHTML = "";
}

/**
 * Selects the medium priority button again.
 */
function resetPriorityButtons() {
  removeClickedFromPriorityButtons();
  const mediumBtn = document.getElementById("priorityMediumBtn");
  if (mediumBtn) {
    mediumBtn.classList.add("clicked");
    toggleMediumButtonOnClick(mediumBtn);
  }
}

/**
 * Connects the three priority buttons and selects medium.
 * @param {Object} options - Buttons, priority values and a setter for the selected priority.
 */
export function initPriorityButtons({ lowBtn, mediumBtn, urgentBtn, priorities, setPriority }) {
  const configs = [
    { button: lowBtn, value: priorities.low, toggle: toggleLowButtonOnClick },
    { button: mediumBtn, value: priorities.medium, toggle: toggleMediumButtonOnClick },
    { button: urgentBtn, value: priorities.urgent, toggle: toggleUrgentButtonOnClick },
  ];
  configs.forEach((config) => bindPriorityButton(config, setPriority));
  if (mediumBtn) {
    mediumBtn.classList.add("clicked");
    toggleMediumButtonOnClick(mediumBtn);
    setPriority(priorities.medium);
  }
}

/**
 * Selects a priority when its button is clicked.
 * @param {{button: HTMLButtonElement, value: string, toggle: Function}} config - Button and its priority.
 * @param {Function} setPriority - Stores the selected priority.
 */
function bindPriorityButton({ button, value, toggle }, setPriority) {
  button?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (button.classList.contains("clicked")) return;
    setPriority(value);
    removeClickedFromPriorityButtons();
    button.classList.add("clicked");
    toggle(button);
  });
}

/**
 * Opens or closes a dropdown list, an open list closes on the next outside click.
 * @param {HTMLElement} box - The field that opens the list.
 * @param {HTMLElement} list - The dropdown list.
 * @param {HTMLElement|null} arrow - The arrow next to the field.
 */
export function toggleDropdown(box, list, arrow) {
  const wasVisible = list.style.display === "flex";
  list.style.display = wasVisible ? "none" : "flex";
  box.closest(".multi-select")?.classList.toggle("open", !wasVisible);
  if (!wasVisible) {
    initOutsideClickHandler(box, () => closeDropdown(box, list), [list, arrow].filter(Boolean));
  }
}

/**
 * Closes a dropdown list.
 * @param {HTMLElement} box - The field that opens the list.
 * @param {HTMLElement} list - The dropdown list.
 */
export function closeDropdown(box, list) {
  list.style.display = "none";
  box.closest(".multi-select")?.classList.remove("open");
}
