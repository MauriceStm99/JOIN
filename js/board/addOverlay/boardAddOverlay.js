import { createTask } from "../../firebase/firebaseTasks.js";
import { showBoardToast, showPopup } from "../../ui/feedback.js";
import { appendNewTaskToBoard } from "../boardRender.js";
import {
  markOverlayField,
  isCategoryMissing,
  applyOverlayContentLimits,
  initOverlayBlurValidation,
  populateOverlayContacts,
  initOverlayPriorityButtons,
  initOverlayAssignedTo,
  initOverlaySubtasks,
  resetOverlayAssignedTo,
  resetOverlayPriorityButtons,
} from "./boardAddOverlayFields.js";


const REQUIRED_OVERLAY_FIELDS = [
  { fieldId: "overlayTaskTitle", hintId: "overlayTaskTitleHint" },
  { fieldId: "overlayTaskDate", hintId: "overlayTaskDateHint" },
  { fieldId: "overlayCategory", hintId: "overlayCategoryHint" },
];

const CLEARED_OVERLAY_FIELD_IDS = ["overlayTaskTitle", "overlayTaskDescription", "overlayTaskDate"];

let currentStatus = "toDo";

export { populateOverlayContacts };

/**
 * Sets up the add task overlay of the board.
 */
export function initAddTaskOverlay() {
  prepareOverlayForm();
  applyOverlayContentLimits();
  initOverlayBlurValidation();
  populateOverlayContacts();
  initOverlayPriorityButtons();
  initOverlayAssignedTo();
  initOverlayCategoryArrow();
  initOverlaySubtasks();
  initOverlayFormSubmit();
  bindOverlayCloseHandlers();
}

/**
 * Turns off the browser validation and prevents due dates in the past.
 */
function prepareOverlayForm() {
  const form = document.getElementById("addTaskFormOverlay");
  if (form) form.noValidate = true;
  const dateInput = document.getElementById("overlayTaskDate");
  if (dateInput) dateInput.min = new Date().toISOString().split("T")[0];
}

/**
 * Opens the native picker of the category select when its arrow is clicked.
 */
function initOverlayCategoryArrow() {
  const categorySelect = document.getElementById("overlayCategory");
  document.getElementById("overlayCategoryArrow")?.addEventListener("click", () => {
    if (typeof categorySelect?.showPicker === "function") {
      categorySelect.showPicker();
    } else {
      categorySelect?.focus();
    }
  });
}

/**
 * Connects the close and cancel buttons and the click on the dark background.
 */
function bindOverlayCloseHandlers() {
  document.getElementById("addTaskCloseBtn")?.addEventListener("click", closeAddTaskOverlay);
  document.getElementById("addTaskCancelBtn")?.addEventListener("click", (event) => {
    event.preventDefault();
    resetOverlayForm();
  });
  document.getElementById("addTaskOverlay")?.addEventListener("click", (event) => {
    if (event.target !== document.getElementById("addTaskOverlay")) return;
    closeAddTaskOverlay();
  });
}

/**
 * Opens the overlay for a column.
 * @param {string} [status] - Column of the new task.
 */
export function openAddTaskOverlay(status) {
  currentStatus = status || "toDo";
  document.getElementById("addTaskOverlay")?.classList.add("active");
}

/**
 * Closes the overlay with an animation and empties the form.
 */
export function closeAddTaskOverlay() {
  const overlay = document.getElementById("addTaskOverlay");
  overlay?.classList.add("closing");
  setTimeout(() => {
    overlay?.classList.remove("active", "closing");
    resetOverlayForm();
  }, 200);
}

/**
 * Saves the task when the form is sent.
 */
function initOverlayFormSubmit() {
  document.getElementById("addTaskFormOverlay")?.addEventListener("submit", handleOverlaySubmit);
}

/**
 * Validates the form, saves the task and adds it to the board.
 * @param {SubmitEvent} event - The submit event.
 */
async function handleOverlaySubmit(event) {
  event.preventDefault();
  const taskData = collectOverlayFormData();
  if (!validateOverlayForm(taskData)) return;
  const newTask = { ...taskData, progress: currentStatus };
  try {
    newTask.id = await createTask(newTask);
    finishOverlayTask(newTask);
  } catch (error) {
    showPopup(error.message || "Task could not be created.");
  }
}

/**
 * Shows the new task on the board, closes the overlay and confirms it.
 * @param {Object} newTask - The saved task.
 */
function finishOverlayTask(newTask) {
  appendNewTaskToBoard(newTask);
  resetOverlayForm();
  closeAddTaskOverlay();
  showBoardToast("Task added to board");
}

/**
 * Reads the value of a field of the overlay.
 * @param {string} id - Id of the field.
 * @returns {string} The value or an empty string.
 */
function getOverlayValue(id) {
  return document.getElementById(id)?.value || "";
}

/**
 * Collects all values of the overlay form.
 * @returns {Object} The new task.
 */
function collectOverlayFormData() {
  return {
    title: getOverlayValue("overlayTaskTitle"),
    description: getOverlayValue("overlayTaskDescription"),
    dueDate: getOverlayValue("overlayTaskDate"),
    priority: getOverlayPriority(),
    assignedTo: getOverlayAssignedTo(),
    category: getOverlayValue("overlayCategory"),
    subtasks: getOverlaySubtasks(),
  };
}

/**
 * Returns the selected priority.
 * @returns {string} Urgent, Medium or Low.
 */
function getOverlayPriority() {
  const activeBtn = document.querySelector(
    ".priority-button-urgent-active, .priority-button-medium-active, .priority-button-low-active",
  );
  if (!activeBtn) return "Medium";
  if (activeBtn.classList.contains("priority-button-urgent-active")) return "Urgent";
  if (activeBtn.classList.contains("priority-button-low-active")) return "Low";
  return "Medium";
}

/**
 * Returns the ids of the selected contacts.
 * @returns {string[]} The contact ids.
 */
function getOverlayAssignedTo() {
  return Array.from(document.querySelectorAll("#overlayCheckboxList .assignedToCheckbox:checked"))
    .map((checkbox) => checkbox.value);
}

/**
 * Reads all subtasks of the overlay.
 * @returns {{text: string, completed: boolean}[]} The subtasks.
 */
function getOverlaySubtasks() {
  return Array.from(document.querySelectorAll("#subtasksListOverlay .subtask-label .subtask-text"))
    .map((span) => ({ text: span.textContent.trim(), completed: false }))
    .filter((subtask) => subtask.text);
}

/**
 * Validates the required fields and marks the invalid ones.
 * @param {Object} taskData - Values of the form.
 * @returns {boolean} True if the task can be saved.
 */
function validateOverlayForm(taskData) {
  const titleInvalid = !taskData.title.trim();
  const dateInvalid = !taskData.dueDate;
  const categoryInvalid = isCategoryMissing(taskData.category);
  markOverlayField("overlayTaskTitle", "overlayTaskTitleHint", titleInvalid);
  markOverlayField("overlayTaskDate", "overlayTaskDateHint", dateInvalid);
  markOverlayField("overlayCategory", "overlayCategoryHint", categoryInvalid);
  return !(titleInvalid || dateInvalid || categoryInvalid);
}

/**
 * Empties the whole overlay form and selects medium again.
 */
function resetOverlayForm() {
  CLEARED_OVERLAY_FIELD_IDS.forEach((id) => {
    document.getElementById(id).value = "";
  });
  document.getElementById("overlayCategory").selectedIndex = 0;
  resetOverlayAssignedTo();
  document.getElementById("subtasksListOverlay").innerHTML = "";
  REQUIRED_OVERLAY_FIELDS.forEach(({ fieldId, hintId }) => markOverlayField(fieldId, hintId, false));
  resetOverlayPriorityButtons();
}
