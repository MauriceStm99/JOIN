import {
  taskDetailTemplate,
  assigneeAvatarToDetail,
  addSubtaskToDetailTemplate,
} from "../../templates/boardTasksTemplates.js";
import { getTask, deleteTask, changeSubtaskCompletion } from "../firebase/firebaseTasks.js";
import { getInitials } from "../core/utility.js";
import { showPopup } from "../ui/feedback.js";
import { changeSubtaskProgressbar, getAssignedContacts } from "./boardRender.js";
import { checkColumnVisibility } from "./boardColumns.js";

const overlay = document.getElementById("taskDetailOverlay");

let lastFocusedCard = null;

/**
 * Opens the detail view of a clicked card, clicks on buttons and dragged cards are ignored.
 * @param {Event} event - The click or keydown event.
 * @param {HTMLElement} card - The task card.
 */
export async function handleTaskCardClick(event, card) {
  if (event.target.closest("button") || card.classList.contains("dragging")) return;
  const taskId = card.dataset.taskId || card.id.replace("task-card-", "");
  if (!taskId) return;
  lastFocusedCard = card;
  try {
    showTaskDetail(await getTask(taskId));
  } catch (error) {
    showPopup(error.message || "Could not load task details.");
  }
}

/**
 * Renders the detail view of a task and connects its buttons.
 * @param {Object} task - The task.
 */
export function showTaskDetail(task) {
  overlay.innerHTML = taskDetailTemplate(task);
  overlay.classList.add("active");
  addAssigneeAvatarToDetail(task);
  addSubtaskToDetail(task);
  addEventListenersToSubtaskButtons(task.id);
  document.getElementById(`deleteTaskBtn-${task.id}`)?.addEventListener("click", () => deleteTaskFromBoard(task.id));
  overlay.querySelector("#overlayCloseBtn")?.addEventListener("click", closeOverlayOnBtn);
  overlay.querySelector("#overlayCloseBtn")?.focus();
}

/**
 * Closes the detail view and focuses the card it was opened from.
 */
export function closeOverlayOnBtn() {
  overlay.classList.add("closing");
  setTimeout(() => {
    overlay.classList.remove("active", "closing");
    if (lastFocusedCard?.isConnected) lastFocusedCard.focus();
    lastFocusedCard = null;
  }, 200);
}

/**
 * Shows all assignees with avatar and name in the detail view.
 * @param {Object} task - The task.
 */
function addAssigneeAvatarToDetail(task) {
  const container = document.getElementById(`overlayDetailCard-${task.id}`)?.querySelector(".overlay-assignees");
  if (!container) return;
  getAssignedContacts(task).forEach((contact) => {
    const html = assigneeAvatarToDetail(getInitials(contact.name), contact.name, contact.color);
    container.insertAdjacentHTML("beforeend", html);
  });
}

/**
 * Shows all subtasks with checkboxes in the detail view.
 * @param {Object} task - The task.
 */
function addSubtaskToDetail(task) {
  const subtaskDetails = document.getElementById(`subtaskDetails-${task.id}`);
  if (!subtaskDetails) return;
  subtaskDetails.innerHTML = '<span class="overlay-label">Subtasks:</span>';
  task.subtasks?.forEach((subtask, index) => {
    subtaskDetails.insertAdjacentHTML("beforeend", addSubtaskToDetailTemplate(subtask.text, subtask.completed, index));
  });
  if (!task.subtasks || task.subtasks.length === 0) {
    subtaskDetails.insertAdjacentHTML("beforeend", '<p class="no-subtasks">No subtasks</p>');
  }
}

/**
 * Saves a subtask as done or not done when its checkbox changes.
 * @param {string} taskId - Task id.
 */
function addEventListenersToSubtaskButtons(taskId) {
  const subtaskDetails = document.getElementById(`subtaskDetails-${taskId}`);
  if (!subtaskDetails) return;
  subtaskDetails.querySelectorAll(".overlay-subtask-item").forEach((item, index) => {
    const checkbox = item.querySelector('input[type="checkbox"]');
    if (!checkbox) return;
    checkbox.addEventListener("change", () => handleSubtaskCheckboxChange(taskId, index, checkbox));
  });
}

/**
 * Saves the subtask state and updates card and counter, on error the checkbox is reset.
 * @param {string} taskId - Task id.
 * @param {number} index - Position of the subtask.
 * @param {HTMLInputElement} checkbox - The changed checkbox.
 */
async function handleSubtaskCheckboxChange(taskId, index, checkbox) {
  try {
    await changeSubtaskCompletion(taskId, index, checkbox.checked);
    const updatedTask = await getTask(taskId);
    changeSubtaskProgressbar(updatedTask);
    updateOverlaySubtaskInfo(updatedTask);
  } catch (error) {
    showPopup(error.message || "Failed to update subtask.");
    checkbox.checked = !checkbox.checked;
  }
}

/**
 * Updates the subtask counter of the detail view.
 * @param {Object} task - The saved task.
 */
function updateOverlaySubtaskInfo(task) {
  const total = task.subtasks?.length || 0;
  const completed = task.subtasks?.filter((subtask) => subtask.completed).length || 0;
  const infoElement = document.getElementById(`subtaskDetails-${task.id}`)?.querySelector(".overlay-subtask-info");
  if (infoElement) infoElement.textContent = `${completed}/${total} Subtasks`;
}

/**
 * Deletes a task and removes its card.
 * @param {string} taskId - Task id.
 */
function deleteTaskFromBoard(taskId) {
  deleteTask(taskId)
    .then(() => removeDeletedTask(taskId))
    .catch((error) => showPopup(error.message || "Error deleting task."));
}

/**
 * Confirms the deletion, closes the detail view and removes the card.
 * @param {string} taskId - Task id.
 */
function removeDeletedTask(taskId) {
  showPopup("Task deleted.", "success");
  closeOverlayOnBtn();
  document.getElementById(`task-card-${taskId}`)?.remove();
  checkColumnVisibility();
}
