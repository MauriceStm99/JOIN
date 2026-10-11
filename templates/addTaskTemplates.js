import { escapeHtml } from "../js/core/utility.js";

/**
 * Renders a contact checkbox for the "Assigned to" dropdown.
 * @param {string} name - Name shown next to the avatar.
 * @param {string} uid - Contact id, used as checkbox value.
 * @param {string} iconTemplate - Avatar HTML.
 * @returns {string} The checkbox HTML.
 */
export function addAssignedToBarTask(name, uid, iconTemplate) {
  const safeName = escapeHtml(name);
  const safeUid = escapeHtml(uid);
  return `<label class="checkbox-item"> <div class="assignedToCheckboxNameIcon">  ${iconTemplate} ${safeName}</div> <input type="checkbox" class="assignedToCheckbox" name="assignedTo" value="${safeUid}"> </label>`;
}

/**
 * Renders a subtask with its edit and delete buttons.
 * @param {string} subtaskString - Text of the subtask.
 * @returns {string} The subtask HTML.
 */
export function addSubTask(subtaskString) {
  const safeSubtaskText = escapeHtml(subtaskString);
  return `<div class="subtask-label">
   <div class="subtask-label-left">
   <div class="point"></div>
   <span class="subtask-text">${safeSubtaskText}</span>
   </div>
   ${subtaskViewButtonsTemplate()}
   ${subtaskEditButtonsTemplate()}
   </div>`;
}

/**
 * Renders the edit and delete buttons that are shown while a subtask is not edited.
 * @param {string} [buttonClass] - Additional class for both buttons.
 * @returns {string} The buttons HTML.
 */
export function subtaskViewButtonsTemplate(buttonClass = "subtask-btn") {
  return `<div class="edit-delete-subtask-buttons">
   <button type="button" class="edit-subtask-button-size ${buttonClass}" aria-label="Edit subtask">
   <img src="../../assets/contacts/editButton.svg" alt="">
   </button>
   <div class="dividing-line"></div>
   <button type="button" class="delete-subtask-button-size ${buttonClass}" aria-label="Delete subtask">
   <img src="../../assets/contacts/deleteButton.svg" alt="">
   </button>
   </div>`;
}

/**
 * Renders the cancel and confirm buttons that are shown while a subtask is edited.
 * @param {string} [buttonClass] - Additional class for both buttons.
 * @returns {string} The buttons HTML.
 */
export function subtaskEditButtonsTemplate(buttonClass = "subtask-btn") {
  return `<div class="edit-mode-buttons">
   <button type="button" class="cancel-subtask-button-size ${buttonClass}" aria-label="Cancel edit">
   <img src="../../assets/utilitys/close.svg" alt="Cancel">
   </button>
   <div class="dividing-line"></div>
   <button type="button" class="confirm-subtask-button-size ${buttonClass}" aria-label="Confirm edit">
   <img src="../../assets/utilitys/check.svg" alt="Confirm">
   </button>
   </div>`;
}
