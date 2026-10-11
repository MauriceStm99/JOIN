import { addSubTask } from "../../../templates/addTaskTemplates.js";
import { closeOnOutsideClick, returnContactById } from "../../core/utility.js";
import { applyMaxLengths, setFieldInvalid, toggleHint } from "../../addTask/addTaskFormHelpers.js";
import { renderAssignOptions, renderAssignedIcons } from "../../addTask/addTaskContacts.js";
import { getBoardContacts } from "../boardRender.js";
import { wireBoardSubtask, removeLastSubtask } from "../boardSubtasks.js";

const CATEGORY_PLACEHOLDER = "Select task category";
const ASSIGN_PLACEHOLDER = "Select contacts to assign";

const PRIORITY_ACTIVE_CLASSES = [
  "priority-button-urgent-active",
  "priority-button-medium-active",
  "priority-button-low-active",
];

const OVERLAY_CONTENT_LIMITS = {
  overlayTaskTitle: 80,
  overlayTaskDescription: 500,
  overlaySubtask: 120,
};

/**
 * Marks a field of the overlay and its hint as valid or invalid.
 * @param {string} fieldId - Id of the field.
 * @param {string} hintId - Id of the hint.
 * @param {boolean} invalid - True marks the field as invalid.
 */
export function markOverlayField(fieldId, hintId, invalid) {
  setFieldInvalid(fieldId, invalid);
  toggleHint(hintId, invalid);
}

/**
 * Checks whether no real category is selected.
 * @param {string} category - Value of the category select.
 * @returns {boolean} True if the category is missing.
 */
export function isCategoryMissing(category) {
  return !category || category === CATEGORY_PLACEHOLDER;
}

/**
 * Sets the maximum length of the text fields of the overlay.
 */
export function applyOverlayContentLimits() {
  applyMaxLengths(OVERLAY_CONTENT_LIMITS);
}

/**
 * Validates title, due date and category when they lose focus.
 */
export function initOverlayBlurValidation() {
  const titleInput = document.getElementById("overlayTaskTitle");
  const dateInput = document.getElementById("overlayTaskDate");
  const categoryInput = document.getElementById("overlayCategory");
  titleInput?.addEventListener("blur", () => {
    markOverlayField("overlayTaskTitle", "overlayTaskTitleHint", !titleInput.value.trim());
  });
  dateInput?.addEventListener("blur", () => {
    markOverlayField("overlayTaskDate", "overlayTaskDateHint", !dateInput.value);
  });
  categoryInput?.addEventListener("blur", () => {
    markOverlayField("overlayCategory", "overlayCategoryHint", isCategoryMissing(categoryInput.value));
  });
}

/**
 * Renders the contacts into the "Assigned to" list of the overlay.
 */
export function populateOverlayContacts() {
  const checkboxList = document.getElementById("overlayCheckboxList");
  if (!checkboxList) return;
  checkboxList.innerHTML = "";
  renderAssignOptions(checkboxList, [...getBoardContacts()]);
  attachCheckboxChangeListeners();
}

/**
 * Updates names and avatars whenever a contact checkbox changes.
 */
function attachCheckboxChangeListeners() {
  const checkboxes = document.querySelectorAll("#overlayCheckboxList .assignedToCheckbox");
  checkboxes.forEach((checkbox) => {
    checkbox.addEventListener("change", () => updateOverlayAssignedSummary(checkboxes));
  });
}

/**
 * Writes the selected names into the field and shows their avatars.
 * @param {NodeListOf<HTMLInputElement>} checkboxes - All contact checkboxes.
 */
function updateOverlayAssignedSummary(checkboxes) {
  const contacts = getBoardContacts();
  const checkedIds = Array.from(checkboxes)
    .filter((checkbox) => checkbox.checked)
    .map((checkbox) => checkbox.value);
  const names = checkedIds.map((id) => returnContactById(id, contacts)?.name).filter(Boolean);
  document.getElementById("overlaySelectedBox").innerText = names.length ? names.join(", ") : ASSIGN_PLACEHOLDER;
  renderAssignedIcons(document.getElementById("overlayAssignedIcons"), checkedIds, contacts);
}

/**
 * Removes the contact selection of the overlay.
 */
export function resetOverlayAssignedTo() {
  document.getElementById("overlaySelectedBox").innerText = ASSIGN_PLACEHOLDER;
  document.querySelectorAll("#overlayCheckboxList .assignedToCheckbox").forEach((checkbox) => {
    checkbox.checked = false;
  });
  document.getElementById("overlayCheckboxList").style.display = "none";
  const iconsContainer = document.getElementById("overlayAssignedIcons");
  if (iconsContainer) iconsContainer.innerHTML = "";
}

/**
 * Selects medium and connects the three priority buttons.
 */
export function initOverlayPriorityButtons() {
  const priorityBtns = document.querySelectorAll(".priority-button-group .priority-button");
  priorityBtns.forEach((button) => {
    if (button.textContent.includes("Medium")) button.classList.add("priority-button-medium-active");
    button.addEventListener("click", (event) => {
      event.preventDefault();
      priorityBtns.forEach((priorityButton) => priorityButton.classList.remove(...PRIORITY_ACTIVE_CLASSES));
      button.classList.add(getPriorityActiveClass(button.textContent));
    });
  });
}

/**
 * Returns the active class of a priority button by its label.
 * @param {string} text - Label of the button.
 * @returns {string} The CSS class.
 */
function getPriorityActiveClass(text) {
  if (text.includes("Urgent")) return "priority-button-urgent-active";
  if (text.includes("Medium")) return "priority-button-medium-active";
  return "priority-button-low-active";
}

/**
 * Selects medium again.
 */
export function resetOverlayPriorityButtons() {
  document.querySelectorAll(".priority-button").forEach((button) => {
    button.classList.remove(...PRIORITY_ACTIVE_CLASSES);
    if (button.textContent.includes("Medium")) {
      button.classList.add("priority-button-medium-active");
    }
  });
}

/**
 * Returns the parts of the "Assigned to" dropdown.
 * @returns {Object} selectBox, checkboxList, selectArrow and multiSelect.
 */
function getOverlayAssignedElements() {
  const selectBox = document.getElementById("overlaySelectedBox");
  return {
    selectBox,
    checkboxList: document.getElementById("overlayCheckboxList"),
    selectArrow: document.getElementById("overlaySelectedBoxArrow"),
    multiSelect: selectBox?.closest(".multi-select-overlay"),
  };
}

/**
 * Opens the "Assigned to" dropdown by click, Enter, Space or its arrow.
 */
export function initOverlayAssignedTo() {
  const elements = getOverlayAssignedElements();
  if (!elements.selectBox || !elements.checkboxList) return;
  elements.selectBox.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleOverlayList(elements);
  });
  elements.selectBox.addEventListener("keydown", (event) => handleSelectBoxKeydown(event, elements));
  elements.selectArrow?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    toggleOverlayList(elements);
  });
}

/**
 * Opens or closes the dropdown with Enter or Space.
 * @param {KeyboardEvent} event - The keydown event.
 * @param {Object} elements - Parts of the dropdown.
 */
function handleSelectBoxKeydown(event, elements) {
  if (event.key !== "Enter" && event.key !== " ") return;
  event.preventDefault();
  event.stopPropagation();
  toggleOverlayList(elements);
}

/**
 * Opens or closes the contact list, an open list closes on the next outside click.
 * @param {Object} elements - Parts of the dropdown.
 */
function toggleOverlayList({ selectBox, checkboxList, selectArrow, multiSelect }) {
  const isVisible = checkboxList.style.display === "flex";
  checkboxList.style.display = isVisible ? "none" : "flex";
  multiSelect?.classList.toggle("open", !isVisible);
  if (isVisible) return;
  closeOnOutsideClick([checkboxList, selectBox, selectArrow], () => {
    checkboxList.style.display = "none";
    multiSelect?.classList.remove("open");
  });
}

/**
 * Connects the add and remove buttons of the subtask field.
 */
export function initOverlaySubtasks() {
  const addBtn = document.getElementById("addSubtaskBtnOverlay");
  const removeBtn = document.getElementById("removeSubtaskBtnOverlay");
  const input = document.getElementById("overlaySubtask");
  const list = document.getElementById("subtasksListOverlay");
  if (!addBtn || !removeBtn || !input || !list) return;
  addBtn.addEventListener("click", (event) => {
    event.preventDefault();
    addOverlaySubtaskFromInput(input, list);
  });
  removeBtn.addEventListener("click", (event) => removeLastSubtask(event, list));
}

/**
 * Adds the text of the subtask field as a new subtask.
 * @param {HTMLInputElement} input - The subtask field.
 * @param {HTMLElement} list - The subtask list.
 */
function addOverlaySubtaskFromInput(input, list) {
  const text = input.value.trim();
  if (!text) return;
  list.insertAdjacentHTML("beforeend", addSubTask(text));
  wireBoardSubtask(list.lastElementChild, { restoreEmptyText: false, stopDeletePropagation: true });
  input.value = "";
  input.focus();
}
