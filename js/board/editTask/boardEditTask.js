import { getTask, updateTask } from "../../firebase/firebaseTasks.js";
import { editTaskFormTemplate } from "../../../templates/boardEditTemplates.js";
import { showPopup } from "../../ui/feedback.js";
import { updateTaskCard } from "../boardRender.js";
import { showTaskDetail } from "../boardDetail.js";
import {
  initEditAssignedTo,
  initEditDropdown,
  initEditModeSubtasks,
  initEditSubtaskButtons,
} from "./boardEditTaskFields.js";

const overlay = document.getElementById("taskDetailOverlay");

const EDIT_PRIORITY_CLASSES = [
  "edit-priority-urgent-active",
  "edit-priority-medium-active",
  "edit-priority-low-active",
];

/**
 * Loads a task and shows its edit form inside the detail view.
 * @param {string} taskId - Task id.
 */
export async function openEditTaskOverlay(taskId) {
  try {
    const task = await getTask(taskId);
    const detailCard = overlay.querySelector(`#overlayDetailCard-${taskId}`);
    if (!detailCard) return;
    detailCard.classList.add("editing");
    detailCard.insertAdjacentHTML("beforeend", editTaskFormTemplate(task));
    initEditModeSubtasks(task);
    attachEditFormEventListeners(taskId);
  } catch (error) {
    showPopup(error.message || "Could not open the edit form.");
  }
}

/**
 * Connects all parts of the edit form.
 * @param {string} taskId - Task id.
 */
function attachEditFormEventListeners(taskId) {
  overlay.querySelector("#editOverlayCloseBtn")?.addEventListener("click", closeEditOverlay);
  initEditPriorityButtons(taskId);
  initEditDropdown(taskId);
  initEditAssignedTo(taskId);
  initEditSubtaskButtons(taskId);
  initEditBlurValidation(taskId);
  applyEditContentLimits(taskId);
  initEditFormSubmit(taskId);
}

/**
 * Selects the current priority of the task and connects the priority buttons.
 * @param {string} taskId - Task id.
 */
function initEditPriorityButtons(taskId) {
  const priorityButtons = overlay.querySelectorAll(`#editTaskForm-${taskId} .edit-priority-btn`);
  getTask(taskId).then((task) => markInitialPriority(priorityButtons, task?.priority || "Medium"));
  priorityButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      priorityButtons.forEach((priorityButton) => priorityButton.classList.remove(...EDIT_PRIORITY_CLASSES));
      button.classList.add(`edit-priority-${button.dataset.priority.toLowerCase()}-active`);
    });
  });
}

/**
 * Marks the button of the current priority as active.
 * @param {NodeListOf<HTMLButtonElement>} priorityButtons - The priority buttons.
 * @param {string} initialPriority - Urgent, Medium or Low.
 */
function markInitialPriority(priorityButtons, initialPriority) {
  priorityButtons.forEach((button) => {
    if (button.dataset.priority !== initialPriority) return;
    button.classList.add(`edit-priority-${initialPriority.toLowerCase()}-active`);
  });
}

/**
 * Sets the maximum length of the text fields of the edit form.
 * @param {string} taskId - Task id.
 */
function applyEditContentLimits(taskId) {
  const titleInput = overlay.querySelector(`#editTaskTitle-${taskId}`);
  const descriptionInput = overlay.querySelector(`#editTaskDescription-${taskId}`);
  const subtaskInput = overlay.querySelector(`#editSubtasks-${taskId}`);
  if (titleInput) titleInput.maxLength = 80;
  if (descriptionInput) descriptionInput.maxLength = 500;
  if (subtaskInput) subtaskInput.maxLength = 120;
}

/**
 * Validates title and due date when they lose focus.
 * @param {string} taskId - Task id.
 */
function initEditBlurValidation(taskId) {
  const titleInput = overlay.querySelector(`#editTaskTitle-${taskId}`);
  const dateInput = overlay.querySelector(`#editTaskDate-${taskId}`);
  titleInput?.addEventListener("blur", () => {
    validateEditField(titleInput, titleInput.value.trim(), "Please enter a task title.");
  });
  dateInput?.addEventListener("blur", () => {
    validateEditField(dateInput, dateInput.value, "Please select a due date.");
  });
}

/**
 * Marks an empty field red and shows a message.
 * @param {HTMLInputElement} input - The field.
 * @param {string} value - Its value.
 * @param {string} message - Message for an empty field.
 */
function validateEditField(input, value, message) {
  if (value) {
    input.style.borderColor = "";
    return;
  }
  input.style.borderColor = "red";
  showPopup(message, "info");
}

/**
 * Saves the task when the edit form is sent.
 * @param {string} taskId - Task id.
 */
function initEditFormSubmit(taskId) {
  overlay.querySelector(`#editTaskForm-${taskId}`)?.addEventListener("submit", (event) => {
    handleEditSubmit(event, taskId);
  });
}

/**
 * Validates and saves the edit form.
 * @param {SubmitEvent} event - The submit event.
 * @param {string} taskId - Task id.
 */
async function handleEditSubmit(event, taskId) {
  event.preventDefault();
  if (!isEditFormValid(taskId)) return;
  try {
    await saveEditedTask(taskId);
  } catch (error) {
    showPopup(error.message || "Task could not be updated.");
  }
}

/**
 * Checks that there is a title and that the due date is not before the minimum date.
 * @param {string} taskId - Task id.
 * @returns {boolean} True if the task can be saved.
 */
function isEditFormValid(taskId) {
  const title = overlay.querySelector(`#editTaskTitle-${taskId}`)?.value;
  if (!title?.trim()) {
    showPopup("Please enter a task title.", "info");
    return false;
  }
  const dateInput = overlay.querySelector(`#editTaskDate-${taskId}`);
  if (dateInput?.value && dateInput.min && dateInput.value < dateInput.min) {
    showPopup("The due date cannot be in the past.", "info");
    return false;
  }
  return true;
}

/**
 * Saves the task, updates its card and shows the detail view again.
 * @param {string} taskId - Task id.
 */
async function saveEditedTask(taskId) {
  await updateTask(taskId, collectEditFormData(taskId));
  const updatedTask = await getTask(taskId);
  await updateTaskCard(taskId, updatedTask);
  closeEditOverlay();
  showTaskDetail(updatedTask);
  overlay.querySelector(".overlay-detail-card")?.classList.add("no-animation");
}

/**
 * Collects all values of the edit form.
 * @param {string} taskId - Task id.
 * @returns {Object} The data to save.
 */
function collectEditFormData(taskId) {
  return {
    title: overlay.querySelector(`#editTaskTitle-${taskId}`)?.value.trim(),
    description: overlay.querySelector(`#editTaskDescription-${taskId}`)?.value || "",
    dueDate: overlay.querySelector(`#editTaskDate-${taskId}`)?.value || "",
    priority: getEditPriority(taskId),
    category: overlay.querySelector(`#editTaskCategory-${taskId}`)?.value || "No Category",
    assignedTo: getEditAssignedTo(taskId),
    subtasks: getEditSubtasks(taskId),
  };
}

/**
 * Returns the selected priority of the edit form.
 * @param {string} taskId - Task id.
 * @returns {string} Urgent, Medium or Low.
 */
function getEditPriority(taskId) {
  const activePriorityBtn = overlay.querySelector(`#editTaskForm-${taskId} .edit-priority-btn[class*="-active"]`);
  return activePriorityBtn?.dataset.priority || "Medium";
}

/**
 * Returns the ids of the checked contacts.
 * @param {string} taskId - Task id.
 * @returns {string[]} The contact ids.
 */
function getEditAssignedTo(taskId) {
  return [...overlay.querySelectorAll(`#editCheckboxList-${taskId} .assignedToCheckbox:checked`)]
    .map((checkbox) => checkbox.value);
}

/**
 * Reads all subtasks of the edit form.
 * @param {string} taskId - Task id.
 * @returns {{text: string, completed: boolean}[]} The subtasks.
 */
function getEditSubtasks(taskId) {
  return [...overlay.querySelectorAll(`#editSubtasksList-${taskId} .subtask-label`)]
    .map(toEditSubtask)
    .filter((subtask) => subtask.text);
}

/**
 * Turns a subtask element of the edit form into the object that is stored.
 * @param {HTMLElement} label - The subtask element.
 * @returns {{text: string, completed: boolean}} The subtask.
 */
function toEditSubtask(label) {
  return {
    text: label.querySelector("span")?.textContent.trim() || "",
    completed: label.dataset.completed === "true",
  };
}

/**
 * Closes the edit form and shows the detail view again.
 */
export function closeEditOverlay() {
  overlay.querySelector(".edit-overlay-card")?.remove();
  overlay.querySelector(".overlay-detail-card")?.classList.remove("editing");
}
