import { changeTaskProgress } from "../firebase/firebaseTasks.js";
import { showPopup } from "../ui/feedback.js";

const COLUMNS = [
  { id: "todoColumn", progress: "toDo", noTaskClass: ".todo-Column-no-task" },
  { id: "progressColumn", progress: "inProgress", noTaskClass: ".inProgress-Column-no-task" },
  { id: "awaitFeedbackColumn", progress: "awaitFeedback", noTaskClass: ".awaitFeedback-Column-no-task" },
  { id: "doneColumn", progress: "done", noTaskClass: ".done-Column-no-task" },
];

/**
 * Returns the task container of a progress state.
 * @param {string} progress - toDo, inProgress, awaitFeedback or done.
 * @returns {HTMLElement|null} The container or null for an unknown state.
 */
export function getColumnForProgress(progress) {
  const column = COLUMNS.find((entry) => entry.progress === progress);
  return column ? document.getElementById(column.id) : null;
}

/**
 * Returns the id of the task container of a progress state, unknown states go to "To do".
 * @param {string} progress - The progress state.
 * @returns {string} The container id.
 */
export function getTasksContainerId(progress) {
  return COLUMNS.find((column) => column.progress === progress)?.id || "todoColumn";
}

/**
 * Returns the progress state that belongs to a task container.
 * @param {HTMLElement} dropZone - The task container.
 * @returns {string|undefined} The progress state.
 */
export function getNewProgressFromDropZone(dropZone) {
  return COLUMNS.find((column) => column.id === dropZone.id)?.progress;
}

/**
 * Reads the task id of a card.
 * @param {HTMLElement} card - The task card.
 * @returns {string} The task id.
 */
export function getTaskIdFromCard(card) {
  return (card.dataset.taskId || card.id).replace("task-card-", "");
}

/**
 * Saves the new column of a task.
 * @param {string} taskId - Task id.
 * @param {string} newProgress - The new progress state.
 */
export function updateTaskProgressInFirebase(taskId, newProgress) {
  changeTaskProgress(taskId, newProgress).catch((error) => {
    showPopup(error.message || "Task progress could not be updated.");
  });
}

/**
 * Moves a card into a task container and saves the new column.
 * @param {HTMLElement} card - The task card.
 * @param {HTMLElement} container - The target container.
 */
export function moveCardToContainer(card, container) {
  container.appendChild(card);
  updateTaskProgressInFirebase(getTaskIdFromCard(card), getNewProgressFromDropZone(container));
}

/**
 * Removes the drop highlight from all columns.
 */
export function clearDropHighlights() {
  document.querySelectorAll(".tasks-container").forEach((container) => {
    container.classList.remove("dragover-highlight");
  });
}

/**
 * Shows the "No tasks" note in every column without visible cards.
 */
export function checkColumnVisibility() {
  COLUMNS.forEach(updateColumnPlaceholder);
}

/**
 * Shows or hides the "No tasks" note of one column.
 * @param {{id: string, noTaskClass: string}} column - The column.
 */
function updateColumnPlaceholder({ id, noTaskClass }) {
  const column = document.getElementById(id);
  const visibleTasks = column?.querySelectorAll('.task-card:not([style*="display: none"])').length || 0;
  const noTaskDiv = column?.querySelector(noTaskClass);
  if (noTaskDiv) noTaskDiv.style.display = visibleTasks === 0 ? "" : "none";
}
