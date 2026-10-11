import {
  taskCardTemplate,
  assigneeAvatarTemplate,
  assigneeMoreBadgeTemplate,
} from "../../templates/boardTasksTemplates.js";
import { getSubtasksCompletionState } from "../firebase/firebaseTasks.js";
import { getInitials, returnContactById } from "../core/utility.js";
import { showPopup } from "../ui/feedback.js";
import { attachDragHandlers } from "./dragDrop/boardDragDrop.js";
import { getColumnForProgress, getTasksContainerId, checkColumnVisibility } from "./boardColumns.js";

const MAX_VISIBLE_AVATARS = 3;

let contactsList = [];

/**
 * Returns the contacts of the board.
 * @returns {Object[]} The contacts.
 */
export function getBoardContacts() {
  return contactsList;
}

/**
 * Stores the contacts of the board.
 * @param {Object[]} contacts - The loaded contacts.
 */
export function setBoardContacts(contacts) {
  contactsList = Array.isArray(contacts) ? contacts : [];
}

/**
 * Returns the ids of the contacts assigned to a task.
 * @param {Object} task - The task.
 * @returns {string[]} The contact ids.
 */
export function getAssignedIds(task) {
  return Array.isArray(task.assignedTo) ? task.assignedTo : [];
}

/**
 * Returns the assigned contacts of a task that still exist.
 * @param {Object} task - The task.
 * @returns {Object[]} The contacts.
 */
export function getAssignedContacts(task) {
  return getAssignedIds(task)
    .map((uid) => returnContactById(uid, contactsList))
    .filter(Boolean);
}

/**
 * Renders all tasks into their columns.
 * @param {Object[]} tasks - The tasks.
 */
export function renderTasks(tasks) {
  (Array.isArray(tasks) ? tasks : []).forEach((task) => renderTaskCard(task));
}

/**
 * Renders one task card into its column.
 * @param {Object} task - The task.
 */
function renderTaskCard(task) {
  const column = getColumnForProgress(task.progress);
  if (!column) return;
  try {
    column.insertAdjacentHTML("beforeend", taskCardTemplate(task));
    changeSubtaskProgressbar(task);
    addAssigneeAvatar(task);
  } catch (error) {
    showPopup("A task could not be rendered completely.", "info");
  }
}

/**
 * Loads the subtask progress of a task and updates its card.
 * @param {Object} task - The task.
 */
export function changeSubtaskProgressbar(task) {
  getSubtasksCompletionState(task.id)
    .then((state) => updateProgressBar(task.id, state))
    .catch((error) => showPopup(error.message || "Subtask progress could not be loaded."));
}

/**
 * Writes the subtask counter and the bar width of a card.
 * @param {string} taskId - Task id.
 * @param {{totalSubtasks: number, completedSubtasks: number}} state - The subtask counts.
 */
function updateProgressBar(taskId, { totalSubtasks, completedSubtasks }) {
  const info = document.getElementById(`subtask-info-${taskId}`);
  if (info) info.textContent = `${completedSubtasks}/${totalSubtasks} Subtasks`;
  const progressBar = document.getElementById(`progress-bar-${taskId}`);
  if (!progressBar) return;
  const percentage = (completedSubtasks / totalSubtasks) * 100 || 0;
  progressBar.style.width = `${percentage}%`;
}

/**
 * Shows up to three assignee avatars on a card and a "+n" badge for the rest.
 * @param {Object} task - The task.
 */
export function addAssigneeAvatar(task) {
  const container = document.getElementById(`task-card-${task.id}`)?.querySelector(".task-assignees");
  if (!container) return;
  const assigned = getAssignedContacts(task);
  assigned.slice(0, MAX_VISIBLE_AVATARS).forEach((contact) => {
    container.insertAdjacentHTML("beforeend", assigneeAvatarTemplate(getInitials(contact.name), contact.color));
  });
  const remaining = assigned.length - MAX_VISIBLE_AVATARS;
  if (remaining > 0) {
    container.insertAdjacentHTML("beforeend", assigneeMoreBadgeTemplate(remaining));
  }
}

/**
 * Replaces a card with a newly rendered one after the task was edited.
 * @param {string} taskId - Task id.
 * @param {Object} updatedTask - The saved task.
 */
export async function updateTaskCard(taskId, updatedTask) {
  const taskCard = document.getElementById(`task-card-${taskId}`);
  if (!taskCard || !updatedTask) return;
  taskCard.outerHTML = taskCardTemplate(updatedTask);
  const newCard = document.getElementById(`task-card-${taskId}`);
  if (!newCard) return;
  newCard.querySelector(".task-assignees").innerHTML = "";
  addAssigneeAvatar(updatedTask);
  attachDragHandlers(newCard);
}

/**
 * Adds a newly created task to its column.
 * @param {Object} task - The new task including its id.
 */
export function appendNewTaskToBoard(task) {
  const column = document.getElementById(getTasksContainerId(task.progress));
  if (!column) return;
  column.insertAdjacentHTML("beforeend", taskCardTemplate(task));
  changeSubtaskProgressbar(task);
  addAssigneeAvatar(task);
  const newCard = document.getElementById(`task-card-${task.id}`);
  if (newCard) attachDragHandlers(newCard);
  checkColumnVisibility();
}
