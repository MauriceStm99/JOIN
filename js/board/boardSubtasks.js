import { selectElementText } from "../core/utility.js";
import { onSubtaskButton } from "../addTask/addTaskSubtasks.js";

/**
 * Makes the text of a subtask editable and remembers it for the cancel button.
 * @param {HTMLElement} subtaskElement - The subtask.
 */
function startBoardSubtaskEdit(subtaskElement) {
  const textSpan = subtaskElement.querySelector("span");
  if (!textSpan) return;
  subtaskElement.dataset.originalText = textSpan.textContent.trim();
  textSpan.contentEditable = true;
  textSpan.focus();
  subtaskElement.classList.add("subtask-label-active");
  selectElementText(textSpan);
}

/**
 * Ends the editing of a subtask.
 * @param {HTMLElement} subtaskElement - The subtask.
 */
function stopBoardSubtaskEdit(subtaskElement) {
  const textSpan = subtaskElement.querySelector("span");
  if (textSpan) textSpan.contentEditable = false;
  subtaskElement.classList.remove("subtask-label-active");
}

/**
 * Restores the text from before the editing and ends it.
 * @param {HTMLElement} subtaskElement - The subtask.
 * @param {boolean} restoreEmptyText - True also restores an empty text.
 */
function cancelBoardSubtaskEdit(subtaskElement, restoreEmptyText) {
  const textSpan = subtaskElement.querySelector("span");
  const originalText = subtaskElement.dataset.originalText ?? "";
  if (textSpan && (originalText || restoreEmptyText)) {
    textSpan.textContent = originalText;
  }
  stopBoardSubtaskEdit(subtaskElement);
}

/**
 * Ends the editing when Enter is pressed.
 * @param {KeyboardEvent} event - The keydown event.
 * @param {HTMLElement} subtaskElement - The subtask.
 */
function stopEditOnEnter(event, subtaskElement) {
  if (event.key !== "Enter") return;
  event.preventDefault();
  stopBoardSubtaskEdit(subtaskElement);
}

/**
 * Connects the delete button of a subtask.
 * @param {HTMLElement} subtaskElement - The subtask.
 * @param {boolean} stopPropagation - True keeps the click from reaching the form.
 */
function wireDeleteButton(subtaskElement, stopPropagation) {
  subtaskElement.querySelector(".delete-subtask-button-size")?.addEventListener("click", (event) => {
    event.preventDefault();
    if (stopPropagation) event.stopPropagation();
    subtaskElement.remove();
  });
}

/**
 * Connects all buttons of a subtask in the board overlays and allows editing by double click.
 * @param {HTMLElement|null} subtaskElement - The subtask.
 * @param {{restoreEmptyText: boolean, stopDeletePropagation: boolean}} options - Differences between the overlays.
 */
export function wireBoardSubtask(subtaskElement, { restoreEmptyText, stopDeletePropagation }) {
  if (!subtaskElement) return;
  onSubtaskButton(subtaskElement, ".edit-subtask-button-size", () => startBoardSubtaskEdit(subtaskElement));
  wireDeleteButton(subtaskElement, stopDeletePropagation);
  onSubtaskButton(subtaskElement, ".cancel-subtask-button-size", () => {
    cancelBoardSubtaskEdit(subtaskElement, restoreEmptyText);
  });
  onSubtaskButton(subtaskElement, ".confirm-subtask-button-size", () => stopBoardSubtaskEdit(subtaskElement));
  subtaskElement.addEventListener("dblclick", (event) => {
    event.preventDefault();
    startBoardSubtaskEdit(subtaskElement);
  });
  subtaskElement.querySelector("span")?.addEventListener("keydown", (event) => stopEditOnEnter(event, subtaskElement));
}

/**
 * Removes the last subtask of a list.
 * @param {MouseEvent} event - The click event.
 * @param {HTMLElement|null} list - The subtask list.
 */
export function removeLastSubtask(event, list) {
  event.preventDefault();
  list?.lastElementChild?.remove();
}
