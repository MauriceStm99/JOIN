import { getContacts } from "../firebase/firebaseContacts.js";
import { addAssignedToBarTask } from "../../templates/addTaskTemplates.js";
import { iconTemplate } from "../../templates/profileTemplates.js";
import { getInitials, getStoredCurrentUser, returnContactById } from "../core/utility.js";
import { showPopup } from "../ui/feedback.js";
import { toggleDropdown } from "./addTaskFormHelpers.js";

const MAX_VISIBLE_ASSIGNEES = 3;
const selectedContactIds = new Set();

let contactsList = [];

/**
 * Compares two contacts, the logged-in user comes first, then alphabetical order.
 * @param {Object} a - First contact.
 * @param {Object} b - Second contact.
 * @param {Object|null} currentUser - The stored user.
 * @returns {number} Sort order.
 */
function compareContactsForAssignment(a, b, currentUser) {
  if (currentUser && a.id === currentUser.uid) return -1;
  if (currentUser && b.id === currentUser.uid) return 1;
  return (a.name || "").localeCompare(b.name || "");
}

/**
 * Sorts contacts for the "Assigned to" list, the logged-in user comes first.
 * @param {Object[]} contacts - Contacts, sorted in place.
 * @param {Object|null} currentUser - The stored user.
 * @returns {Object[]} The sorted contacts.
 */
export function sortContactsForAssignment(contacts, currentUser) {
  return contacts.sort((a, b) => compareContactsForAssignment(a, b, currentUser));
}

/**
 * Returns the name for the "Assigned to" list, the logged-in user gets "(You)".
 * @param {Object} contact - The contact.
 * @param {Object|null} currentUser - The stored user.
 * @returns {string} The name to show.
 */
export function getAssignDisplayName(contact, currentUser) {
  const isCurrentUser = currentUser && contact.id === currentUser.uid;
  return isCurrentUser ? `${contact.name} (You)` : contact.name;
}

/**
 * Renders one checkbox per contact into the "Assigned to" list.
 * @param {HTMLElement} container - The list.
 * @param {Object[]} contacts - Contacts to show, sorted in place.
 */
export function renderAssignOptions(container, contacts) {
  const currentUser = getStoredCurrentUser();
  sortContactsForAssignment(contacts, currentUser).forEach((contact) => {
    if (!contact?.id || !contact?.name) return;
    const icon = iconTemplate(getInitials(contact.name), contact.color, "assignedToCheckboxIcon");
    const option = addAssignedToBarTask(getAssignDisplayName(contact, currentUser), contact.id, icon);
    container.insertAdjacentHTML("beforeend", option);
  });
}

/**
 * Shows the avatars of the assigned contacts, after three avatars a "+n" badge shows all.
 * @param {HTMLElement|null} container - Avatar container.
 * @param {string[]} contactIds - Ids of the assigned contacts.
 * @param {Object[]} contacts - All contacts.
 */
export function renderAssignedIcons(container, contactIds, contacts) {
  if (!container) return;
  container.innerHTML = "";
  contactIds.slice(0, MAX_VISIBLE_ASSIGNEES).forEach((id) => appendAssignedIcon(container, id, contacts));
  const remaining = contactIds.length - MAX_VISIBLE_ASSIGNEES;
  if (remaining > 0) {
    container.appendChild(createMoreBadge(container, contactIds, contacts, remaining));
  }
}

/**
 * Adds the avatar of one contact.
 * @param {HTMLElement} container - Avatar container.
 * @param {string} id - Contact id.
 * @param {Object[]} contacts - All contacts.
 */
function appendAssignedIcon(container, id, contacts) {
  const contact = returnContactById(id, contacts);
  if (!contact) return;
  container.insertAdjacentHTML(
    "beforeend",
    iconTemplate(getInitials(contact.name), contact.color, "assignedToContainerChecked"),
  );
}

/**
 * Creates the "+n" badge that shows all avatars on click.
 * @param {HTMLElement} container - Avatar container.
 * @param {string[]} contactIds - Ids of the assigned contacts.
 * @param {Object[]} contacts - All contacts.
 * @param {number} remaining - Number of hidden avatars.
 * @returns {HTMLButtonElement} The badge.
 */
function createMoreBadge(container, contactIds, contacts, remaining) {
  const badge = document.createElement("button");
  badge.type = "button";
  badge.className = "profileIconContainer assignedToContainerChecked assigned-more-badge";
  badge.textContent = `+${remaining}`;
  badge.setAttribute("aria-label", `Show all ${contactIds.length} assigned contacts`);
  badge.addEventListener("click", () => {
    container.innerHTML = "";
    contactIds.forEach((id) => appendAssignedIcon(container, id, contacts));
  });
  return badge;
}

/**
 * Loads the contacts for the add task page and renders the "Assigned to" list.
 */
export async function loadAddTaskContacts() {
  try {
    contactsList = await getContacts();
  } catch {
    contactsList = [];
    showPopup("Contacts could not be loaded right now.", "info");
  }
  renderAssignableContacts();
}

/**
 * Renders the "Assigned to" list and connects its checkboxes.
 * @param {string} [filterString] - Search text from the dropdown field.
 */
function renderAssignableContacts(filterString = "") {
  addContactsToAssignTask(contactsList, filterString);
  checkCheckboxChanges();
}

/**
 * Renders the contacts that match the search text.
 * @param {Object[]} contacts - All contacts.
 * @param {string} [filterString] - Search text.
 */
function addContactsToAssignTask(contacts, filterString = "") {
  const assignedSelect = document.getElementById("chooseContactsCheckboxList");
  if (!assignedSelect) return;
  assignedSelect.innerHTML = "";
  const filteredContacts = filterContactsByName(contacts, filterString);
  renderAssignOptions(assignedSelect, filteredContacts);
  syncAssignedCheckboxes(assignedSelect);
  if (filteredContacts.length === 0) {
    assignedSelect.innerHTML = '<div class="no-results">No contacts found</div>';
  }
}

/**
 * Keeps the contacts whose name contains the search text.
 * @param {Object[]} contacts - All contacts.
 * @param {string} filterString - Search text.
 * @returns {Object[]} The matching contacts.
 */
function filterContactsByName(contacts, filterString) {
  if (!filterString.trim()) return contacts;
  const searchTerm = filterString.toLowerCase();
  return contacts.filter((contact) => contact?.name?.toLowerCase().includes(searchTerm));
}

/**
 * Checks the checkboxes of the contacts that are already selected.
 * @param {HTMLElement} container - The list.
 */
function syncAssignedCheckboxes(container) {
  container.querySelectorAll(".assignedToCheckbox").forEach((checkbox) => {
    checkbox.checked = selectedContactIds.has(checkbox.value);
  });
}

/**
 * Updates the selection whenever a checkbox of the list changes.
 */
function checkCheckboxChanges() {
  const checkboxList = document.getElementById("chooseContactsCheckboxList");
  if (!checkboxList || !document.getElementById("selectedBox")) return;
  checkboxList.querySelectorAll(".assignedToCheckbox").forEach((checkbox) => {
    checkbox.addEventListener("change", () => handleAssignCheckboxChange(checkbox));
  });
}

/**
 * Adds or removes a contact from the selection and updates the avatars.
 * @param {HTMLInputElement} checkbox - The changed checkbox.
 */
function handleAssignCheckboxChange(checkbox) {
  if (checkbox.checked) {
    selectedContactIds.add(checkbox.value);
  } else {
    selectedContactIds.delete(checkbox.value);
  }
  renderAssignedIcons(document.getElementById("assignedIcons"), [...selectedContactIds], contactsList);
}

/**
 * Connects the "Assigned to" field, its arrow and the search.
 */
export function initAssignedDropdown() {
  const selectBox = document.getElementById("selectedBox");
  const checkboxList = document.getElementById("chooseContactsCheckboxList");
  if (!selectBox || !checkboxList) return;
  const selectArrow = selectBox.closest(".multi-select")?.querySelector(".select-arrow");
  selectBox.addEventListener("click", () => toggleDropdown(selectBox, checkboxList, selectArrow));
  selectArrow?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    toggleDropdown(selectBox, checkboxList, selectArrow);
  });
  selectBox.addEventListener("input", () => renderAssignableContacts(selectBox.value));
}

/**
 * Returns the ids of the selected contacts.
 * @returns {string[]} The selected ids.
 */
export function getSelectedAssignedTo() {
  return [...selectedContactIds];
}

/**
 * Removes the whole selection and renders the full list again.
 */
export function resetAssignedContacts() {
  selectedContactIds.clear();
  renderAssignableContacts();
}
