import { getContactsGroupTemplate, getContactDetailsTemplate } from "../../templates/contactTemplates.js";
import { getContacts, deleteContact } from "../firebase/firebaseContacts.js";
import { showPopup } from "../ui/feedback.js";

const MOBILE_MAX_WIDTH = 768;

let contacts = [];
let currentShownContact = null;

/**
 * Returns all loaded contacts.
 * @returns {Object[]} The contacts.
 */
export function getContactsArray() {
  return contacts;
}

/**
 * Returns the contact whose details are shown.
 * @returns {Object|null} The contact or null.
 */
export function getCurrentShownContact() {
  return currentShownContact;
}

/**
 * Builds up to two initials from the words of a name.
 * @param {string} name - Contact name.
 * @returns {string} The initials.
 */
export function getContactInitials(name) {
  return name
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase())
    .join("")
    .substring(0, 2);
}

/**
 * Returns the letter under which a contact is listed, names without a letter go to "#".
 * @param {string} name - Contact name.
 * @returns {string} The group letter.
 */
function getGroupLetter(name) {
  const firstChar = (name || "").trim().charAt(0).toUpperCase();
  return firstChar >= "A" && firstChar <= "Z" ? firstChar : "#";
}

/**
 * Sorts contacts by name without changing the original list.
 * @param {Object[]} contactList - The contacts.
 * @returns {Object[]} A sorted copy.
 */
function sortContactsByName(contactList) {
  return [...contactList].sort((a, b) => {
    return (a.name || "").localeCompare(b.name || "", undefined, { sensitivity: "base" });
  });
}

/**
 * Groups the contacts by the first letter of their name and stores their index and initials.
 * @param {Object[]} contactList - The contacts.
 * @returns {Object<string, Object[]>} Contacts per letter.
 */
function groupContacts(contactList) {
  const grouped = {};
  sortContactsByName(contactList).forEach((contact) => {
    contact._index = contactList.indexOf(contact);
    contact.initials = getContactInitials(contact.name || "");
    const letter = getGroupLetter(contact.name);
    if (!grouped[letter]) grouped[letter] = [];
    grouped[letter].push(contact);
  });
  return grouped;
}

/**
 * Renders the contact list grouped by letter.
 */
export function renderContacts() {
  const container = document.getElementById("contactsList");
  if (!container) return;
  const groupedContacts = groupContacts(contacts);
  const sortedLetters = Object.keys(groupedContacts).sort((a, b) => a.localeCompare(b));
  container.innerHTML = sortedLetters
    .map((letter) => getContactsGroupTemplate(letter, groupedContacts[letter]))
    .join("");
}

/**
 * Loads all contacts and renders the list.
 */
export async function loadContactsData() {
  try {
    contacts = await getContacts();
  } catch {
    contacts = [];
    showPopup("Contacts could not be loaded.");
  }
  renderContacts();
}

/**
 * Checks whether an email in the list is cut off or already expanded.
 * @param {HTMLElement} emailElement - The email element.
 * @returns {boolean} True if a click should toggle the full email.
 */
function isEmailTruncated(emailElement) {
  return emailElement.classList.contains("expanded") || emailElement.scrollWidth > emailElement.clientWidth;
}

/**
 * Finds a contact by its position in the list.
 * @param {number} index - The stored index.
 * @returns {Object|undefined} The contact.
 */
function findContactByIndex(index) {
  return contacts.find((entry) => entry._index === index) || contacts[index];
}

/**
 * Shows the details of a clicked contact, a click on a cut off email shows the full email.
 * @param {MouseEvent} event - The click event.
 */
export function contactListClickHandler(event) {
  const item = event.target.closest(".contact-item");
  if (!item) return;
  const emailElement = event.target.closest(".contact-email");
  if (emailElement && isEmailTruncated(emailElement)) {
    emailElement.classList.toggle("expanded");
    return;
  }
  const contact = findContactByIndex(Number(item.dataset.contactId));
  if (contact) contactShowDetails(contact, contact._index);
}

/**
 * Removes the highlight from the contact that is shown at the moment.
 */
function unmarkShownContact() {
  if (currentShownContact == null) return;
  const contactButton = document.querySelector(`[data-contact-id="${currentShownContact._index}"]`);
  if (contactButton) contactButton.classList.remove("active-contact");
}

/**
 * Highlights a contact in the list and shows its details.
 * @param {Object} contact - The contact.
 * @param {number} index - Its index in the list.
 */
export function contactShowDetails(contact, index) {
  unmarkShownContact();
  const contactButton = document.querySelector(`[data-contact-id="${index}"]`);
  if (!contactButton) return;
  contactButton.classList.add("active-contact");
  currentShownContact = contact;
  document.getElementById("contactDetailsOverlay").innerHTML = getContactDetailsTemplate(contact, contact.color);
  contactDetailsAddEventListeners();
  if (window.innerWidth <= MOBILE_MAX_WIDTH) {
    showMobileDetailView();
  }
}

/**
 * Shows the details instead of the list on small screens and adds a back button.
 */
function showMobileDetailView() {
  const left = document.querySelector(".contacts-left");
  const right = document.querySelector(".contacts-right");
  if (!left || !right) return;
  left.classList.add("mobile-hidden");
  right.classList.remove("mobile-hidden");
  right.classList.add("mobile-detail-visible");
  if (!document.getElementById("mobileBackBtn")) {
    right.prepend(createMobileBackButton());
  }
}

/**
 * Creates the back button of the mobile detail view.
 * @returns {HTMLButtonElement} The button.
 */
function createMobileBackButton() {
  const backBtn = document.createElement("button");
  backBtn.id = "mobileBackBtn";
  backBtn.className = "mobile-back-btn";
  backBtn.setAttribute("aria-label", "Back");
  backBtn.innerHTML = `<img src="../../assets/utilitys/arrowBack.svg" alt="">`;
  backBtn.addEventListener("click", hideMobileDetailView);
  return backBtn;
}

/**
 * Returns from the mobile detail view to the list.
 */
function hideMobileDetailView() {
  document.querySelector(".contacts-left")?.classList.remove("mobile-hidden");
  const right = document.querySelector(".contacts-right");
  if (right) {
    right.classList.add("mobile-hidden");
    right.classList.remove("mobile-detail-visible");
  }
  document.getElementById("mobileBackBtn")?.remove();
  unmarkShownContact();
  currentShownContact = null;
}

/**
 * Connects the delete button of the detail view.
 */
function contactDetailsAddEventListeners() {
  const contact = currentShownContact;
  document.getElementById("deleteContactDetailsBtn")?.addEventListener("click", () => deleteShownContact(contact));
}

/**
 * Deletes the shown contact and clears the detail view.
 * @param {Object} contact - The contact.
 */
async function deleteShownContact(contact) {
  try {
    await deleteContact(contact.id);
    removeContactFromList(contact.id);
    const contactDetailsOverlay = document.getElementById("contactDetailsOverlay");
    if (contactDetailsOverlay) contactDetailsOverlay.innerHTML = "";
    currentShownContact = null;
    showPopup("Contact deleted.", "success");
  } catch (error) {
    showPopup(error.message || "There was an error deleting the contact.");
  }
}

/**
 * Adds a new contact to the list.
 * @param {Object} contactData - The new contact.
 */
export function addContactToList(contactData) {
  contacts.push(contactData);
  contacts[contacts.length - 1]._index = contacts.length - 1;
  renderContacts();
}

/**
 * Applies edited values to a contact, renders the list and shows the contact again.
 * @param {string} contactId - Contact id.
 * @param {Object} values - Name, email, phone number and vacation days.
 */
export function updateContactInList(contactId, values) {
  const contact = contacts.find((entry) => entry.id === contactId);
  if (contact) {
    Object.assign(contact, values, { initials: getContactInitials(values.name) });
  }
  renderContacts();
  if (contact) contactShowDetails(contact, contact._index);
}

/**
 * Removes a contact from the list.
 * @param {string} contactId - Contact id.
 */
export function removeContactFromList(contactId) {
  const index = contacts.findIndex((entry) => entry.id === contactId);
  if (index !== -1) contacts.splice(index, 1);
  renderContacts();
}
