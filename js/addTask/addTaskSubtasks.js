import { addSubTask } from "../../templates/addTaskTemplates.js";
import { selectElementText } from "../core/utility.js";

/**
 * Makes the text of a subtask editable and selects it.
 * @param {HTMLElement} subtaskElement - The subtask.
 */
function enableEditableSubtask(subtaskElement) {
  const textSpan = subtaskElement.querySelector("span");
  const pointDiv = subtaskElement.querySelector(".point");
  if (pointDiv) pointDiv.style.display = "none";
  if (textSpan) {
    textSpan.contentEditable = true;
    textSpan.focus();
  }
  subtaskElement.classList.add("subtask-label-active");
  if (textSpan) selectElementText(textSpan);
}

/**
 * Ends the editing of a subtask.
 * @param {HTMLElement} subtaskElement - The subtask.
 */
function disableEditableSubtask(subtaskElement) {
  const textSpan = subtaskElement.querySelector("span");
  const pointDiv = subtaskElement.querySelector(".point");
  if (pointDiv) pointDiv.style.display = "block";
  if (textSpan) textSpan.contentEditable = false;
  subtaskElement.classList.remove("subtask-label-active");
}

/**
 * Starts editing a subtask and remembers its text for the cancel button.
 * @param {HTMLElement} subtaskNode - The subtask.
 */
function startEditingSubtask(subtaskNode) {
  const textSpan = subtaskNode.querySelector("span");
  if (!textSpan) return;
  subtaskNode.dataset.originalText = textSpan.textContent.trim();
  enableEditableSubtask(subtaskNode);
  watchSubtaskEditEnd(subtaskNode, textSpan);
}

/**
 * Ends the editing on a click outside of the subtask or on Enter.
 * @param {HTMLElement} subtaskNode - The subtask.
 * @param {HTMLElement} textSpan - Its editable text.
 */
function watchSubtaskEditEnd(subtaskNode, textSpan) {
  const listening = new AbortController();
  const { signal } = listening;
  setTimeout(() => {
    document.addEventListener("click", (event) => closeEditOnOutsideClick(event, subtaskNode, listening), { signal });
  }, 0);
  textSpan.addEventListener("keydown", (event) => closeEditOnEnter(event, subtaskNode, listening), { signal });
}

/**
 * Ends the editing and removes the click and key listeners of this editing.
 * @param {HTMLElement} subtaskNode - The subtask.
 * @param {AbortController} listening - Removes the listeners.
 */
function closeSubtaskEdit(subtaskNode, listening) {
  disableEditableSubtask(subtaskNode);
  listening.abort();
}

/**
 * Ends the editing when the click was outside of this subtask.
 * @param {MouseEvent} event - The click event.
 * @param {HTMLElement} subtaskNode - The subtask.
 * @param {AbortController} listening - Removes the listeners.
 */
function closeEditOnOutsideClick(event, subtaskNode, listening) {
  if (event.target.closest(".subtask-label") !== subtaskNode) closeSubtaskEdit(subtaskNode, listening);
}

/**
 * Ends the editing when Enter was pressed.
 * @param {KeyboardEvent} event - The keydown event.
 * @param {HTMLElement} subtaskNode - The subtask.
 * @param {AbortController} listening - Removes the listeners.
 */
function closeEditOnEnter(event, subtaskNode, listening) {
  if (event.key !== "Enter") return;
  event.preventDefault();
  closeSubtaskEdit(subtaskNode, listening);
}

/**
 * Connects a button inside a subtask, the click does not reach the form.
 * @param {HTMLElement} subtaskNode - The subtask.
 * @param {string} selector - Selector of the button.
 * @param {Function} handler - Runs on click.
 */
export function onSubtaskButton(subtaskNode, selector, handler) {
  subtaskNode.querySelector(selector)?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    handler();
  });
}

/**
 * Restores the text from before the editing and ends it.
 * @param {HTMLElement} subtaskNode - The subtask.
 */
function cancelSubtaskEdit(subtaskNode) {
  const textSpan = subtaskNode.querySelector("span");
  if (textSpan && subtaskNode.dataset.originalText) {
    textSpan.textContent = subtaskNode.dataset.originalText;
  }
  disableEditableSubtask(subtaskNode);
}

/**
 * Connects the edit, delete, cancel and confirm buttons of a subtask.
 * @param {HTMLElement} subtaskNode - The subtask.
 */
function wireInlineEditButtons(subtaskNode) {
  onSubtaskButton(subtaskNode, ".edit-subtask-button-size", () => startEditingSubtask(subtaskNode));
  onSubtaskButton(subtaskNode, ".delete-subtask-button-size", () => subtaskNode.remove());
  onSubtaskButton(subtaskNode, ".cancel-subtask-button-size", () => cancelSubtaskEdit(subtaskNode));
  onSubtaskButton(subtaskNode, ".confirm-subtask-button-size", () => disableEditableSubtask(subtaskNode));
}

/**
 * Connects the buttons of a subtask and starts editing on double click.
 * @param {HTMLElement} subtaskElement - The subtask.
 */
function addSubtaskEventListeners(subtaskElement) {
  wireInlineEditButtons(subtaskElement);
  subtaskElement.addEventListener("dblclick", (event) => {
    event.preventDefault();
    startEditingSubtask(subtaskElement);
  });
}

/**
 * Adds the text of the subtask field as a new subtask.
 */
function addSubtaskFromInput() {
  const subtaskInput = document.getElementById("subtasks");
  const subtasksList = document.getElementById("subtasksList");
  const subtaskText = subtaskInput.value.trim();
  if (!subtaskText) return;
  subtasksList.insertAdjacentHTML("beforeend", addSubTask(subtaskText));
  addSubtaskEventListeners(subtasksList.lastElementChild);
  subtaskInput.value = "";
}

/**
 * Adds the subtask when Enter is pressed in the subtask field.
 * @param {KeyboardEvent} event - The keydown event.
 */
function addSubtaskOnEnter(event) {
  if (event.key !== "Enter") return;
  event.preventDefault();
  addSubtaskFromInput();
}

/**
 * Connects the add and remove buttons and the Enter key of the subtask field.
 */
export function initSubtaskEventListeners() {
  document.getElementById("addSubtaskBtn").addEventListener("click", (event) => {
    event.preventDefault();
    addSubtaskFromInput();
  });
  document.getElementById("subtasks").addEventListener("keydown", addSubtaskOnEnter);
  document.getElementById("removeSubtaskBtn").addEventListener("click", (event) => {
    event.preventDefault();
    document.getElementById("subtasksList").lastElementChild?.remove();
  });
}

/**
 * Turns a subtask element into the object that is stored.
 * @param {HTMLElement} span - Text element of the subtask.
 * @returns {{text: string, completed: boolean}} The subtask.
 */
function toSubtask(span) {
  const checkbox = span.querySelector('input[type="checkbox"]');
  return { text: span.textContent.trim(), completed: checkbox ? checkbox.checked : false };
}

/**
 * Reads all subtasks of the form.
 * @returns {{text: string, completed: boolean}[]} The subtasks.
 */
export function getSubtasksList() {
  return [...document.querySelectorAll("#subtasksList span")].map(toSubtask);
}
