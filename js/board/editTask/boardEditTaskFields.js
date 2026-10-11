import { getTask } from "../../firebase/firebaseTasks.js";
import { iconTemplate } from "../../../templates/profileTemplates.js";
import { assigneeAvatarTemplate } from "../../../templates/boardTasksTemplates.js";
import { editAssignOptionTemplate, editSubtaskTemplate } from "../../../templates/boardEditTemplates.js";
import { getInitials, getStoredCurrentUser, returnContactById, closeOnOutsideClick } from "../../core/utility.js";
import { showPopup } from "../../ui/feedback.js";
import { sortContactsForAssignment, getAssignDisplayName } from "../../addTask/addTaskContacts.js";
import { getBoardContacts, getAssignedIds } from "../boardRender.js";
import { wireBoardSubtask, removeLastSubtask } from "../boardSubtasks.js";

const overlay = document.getElementById("taskDetailOverlay");

/**
 * Renders the contact checkboxes of the edit form, assigned contacts are checked.
 * @param {HTMLElement} listEl - The checkbox list.
 * @param {Object} task - The edited task.
 */
function populateContactList(listEl, task) {
  const currentUser = getStoredCurrentUser();
  const assignedIds = getAssignedIds(task);
  listEl.innerHTML = "";
  sortContactsForAssignment([...getBoardContacts()], currentUser).forEach((contact) => {
    const avatarIcon = iconTemplate(getInitials(contact.name), contact.color);
    const displayName = getAssignDisplayName(contact, currentUser);
    const label = document.createElement("label");
    label.className = "checkbox-item";
    label.innerHTML = editAssignOptionTemplate(displayName, contact.id, avatarIcon, assignedIds.includes(contact.id));
    listEl.appendChild(label);
  });
}

/**
 * Returns the values of all checked checkboxes of a list.
 * @param {HTMLElement} listEl - The checkbox list.
 * @returns {string[]} The checked contact ids.
 */
function getCheckedValues(listEl) {
  return [...listEl.querySelectorAll(".assignedToCheckbox")]
    .filter((checkbox) => checkbox.checked)
    .map((checkbox) => checkbox.value);
}

/**
 * Clears the search field and shows the avatars of the checked contacts.
 * @param {HTMLElement} listEl - The checkbox list.
 * @param {HTMLInputElement|null} selectedBox - The search field.
 * @param {HTMLElement|null} iconsEl - The avatar container.
 */
function updateAssignedToSummary(listEl, selectedBox, iconsEl) {
  const checkedIds = getCheckedValues(listEl);
  if (selectedBox) selectedBox.value = "";
  if (!iconsEl) return;
  iconsEl.innerHTML = "";
  checkedIds.forEach((id) => {
    const contact = returnContactById(id, getBoardContacts());
    if (!contact) return;
    iconsEl.insertAdjacentHTML("beforeend", assigneeAvatarTemplate(getInitials(contact.name), contact.color));
  });
}

/**
 * Loads the task and renders its assigned contacts into the edit form.
 * @param {string} taskId - Task id.
 */
export function initEditAssignedTo(taskId) {
  const listEl = overlay.querySelector(`#editCheckboxList-${taskId}`);
  if (!listEl) return;
  getTask(taskId)
    .then((task) => renderEditAssignedList(listEl, task, taskId))
    .catch((error) => showPopup(error.message || "Assigned contacts could not be loaded.", "info"));
}

/**
 * Renders the contact list and keeps the avatars in sync with the checkboxes.
 * @param {HTMLElement} listEl - The checkbox list.
 * @param {Object} task - The edited task.
 * @param {string} taskId - Task id.
 */
function renderEditAssignedList(listEl, task, taskId) {
  const selectedBox = overlay.querySelector(`#editSelectedBox-${taskId}`);
  const iconsEl = overlay.querySelector(`#editAssignees-${taskId}`);
  populateContactList(listEl, task);
  updateAssignedToSummary(listEl, selectedBox, iconsEl);
  listEl.addEventListener("change", () => updateAssignedToSummary(listEl, selectedBox, iconsEl));
}

/**
 * Opens the contact list by click on the field or its arrow.
 * @param {string} taskId - Task id.
 */
export function initEditDropdown(taskId) {
  const selectedBox = overlay.querySelector(`#editSelectedBox-${taskId}`);
  const checkboxList = overlay.querySelector(`#editCheckboxList-${taskId}`);
  const selectArrow = overlay.querySelector(`#editSelectedBoxArrow-${taskId}`);
  selectedBox?.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleEditList(checkboxList, selectedBox, selectArrow);
  });
  selectArrow?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    toggleEditList(checkboxList, selectedBox, selectArrow);
  });
}

/**
 * Opens or closes the contact list, an open list closes on the next outside click.
 * @param {HTMLElement|null} checkboxList - The checkbox list.
 * @param {HTMLInputElement|null} selectedBox - The search field.
 * @param {HTMLElement|null} selectArrow - The arrow.
 */
function toggleEditList(checkboxList, selectedBox, selectArrow) {
  checkboxList?.classList.toggle("active");
  if (!checkboxList?.classList.contains("active")) return;
  closeOnOutsideClick([checkboxList, selectedBox, selectArrow], () => checkboxList.classList.remove("active"));
}

/**
 * Renders the existing subtasks of the task into the edit form.
 * @param {Object} task - The edited task.
 */
export function initEditModeSubtasks(task) {
  const subtasksList = overlay.querySelector(`#editSubtasksList-${task.id}`);
  if (!subtasksList) return;
  subtasksList.innerHTML = "";
  if (!Array.isArray(task.subtasks) || task.subtasks.length === 0) return;
  task.subtasks.forEach((subtask) => appendEditSubtask(subtasksList, subtask.text, subtask.completed));
}

/**
 * Adds a subtask to the list of the edit form.
 * @param {HTMLElement} list - The subtask list.
 * @param {string} text - Subtask text.
 * @param {boolean} [completed] - Whether the subtask is done.
 */
function appendEditSubtask(list, text, completed = false) {
  list.insertAdjacentHTML("beforeend", editSubtaskTemplate(text, completed));
  wireBoardSubtask(list.lastElementChild, { restoreEmptyText: true, stopDeletePropagation: false });
}

/**
 * Connects the add and remove buttons of the subtask field.
 * @param {string} taskId - Task id.
 */
export function initEditSubtaskButtons(taskId) {
  const input = overlay.querySelector(`#editSubtasks-${taskId}`);
  const list = overlay.querySelector(`#editSubtasksList-${taskId}`);
  overlay.querySelector(`#editAddSubtaskBtn-${taskId}`)?.addEventListener("click", (event) => {
    event.preventDefault();
    addEditSubtaskFromInput(input, list);
  });
  overlay.querySelector(`#editRemoveSubtaskBtn-${taskId}`)?.addEventListener("click", (event) => {
    removeLastSubtask(event, list);
  });
}

/**
 * Adds the text of the subtask field as a new subtask.
 * @param {HTMLInputElement|null} input - The subtask field.
 * @param {HTMLElement|null} list - The subtask list.
 */
function addEditSubtaskFromInput(input, list) {
  const text = input?.value.trim();
  if (!text || !list) return;
  appendEditSubtask(list, text);
  input.value = "";
}
