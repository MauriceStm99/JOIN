import { escapeHtml } from "../js/utility.js";

export function addAssignedToBarTask(name,uid,iconTemplate) {  
    const safeName = escapeHtml(name);
    const safeUid = escapeHtml(uid);
    const assignedToSelect = '<label class="checkbox-item"> <div class="assignedToCheckboxNameIcon">  ' + iconTemplate + ' '
     + safeName + '</div> <input type="checkbox" class="assignedToCheckbox" name="assignedTo" value="' + safeUid  + '"> </label>';
          return assignedToSelect;
}

export function addSubTask(subtaskString){
   const safeSubtaskText = escapeHtml(subtaskString);
   const addSubTask=`<div class="subtask-label">

   <div class="subtask-label-left">
   <div class="point"></div>
   <span class="subtask-text">${safeSubtaskText}</span>
   </div>
   <div class="edit-delete-subtask-buttons">
   <button type="button" class="edit-subtask-button-size subtask-btn" aria-label="Edit subtask">
   <img src="./assets/contacts/editButton.svg" alt="">
   </button>
   <div class="dividing-line"></div>
   <button type="button" class="delete-subtask-button-size subtask-btn" aria-label="Delete subtask">
   <img src="./assets/contacts/deleteButton.svg" alt="">
   </button>
   </div>
   <div class="edit-mode-buttons">
   <button type="button" class="cancel-subtask-button-size subtask-btn" aria-label="Cancel edit">
   <img src="./assets/utilitys/close.svg" alt="Cancel">
   </button>
   <div class="dividing-line"></div>
   <button type="button" class="confirm-subtask-button-size subtask-btn" aria-label="Confirm edit">
   <img src="./assets/utilitys/check.svg" alt="Confirm">
   </button>
   </div>
   </div>`;

   return addSubTask;   


}
