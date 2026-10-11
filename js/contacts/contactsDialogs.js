import { addContactTemplate, editContactTemplate } from "../../templates/contactTemplates.js";
import { initOutsideClickHandler, getRandomColor } from "../core/utility.js";
import { editOrAddContact, deleteContact } from "../firebase/firebaseContacts.js";
import { showPopup } from "../ui/feedback.js";
import {
  configureContactFormValidation,
  getAddContactFormValues,
  isValidEmail,
  readVacationDaysInput,
} from "./contactsFormHelpers.js";
import {
  addContactToList,
  updateContactInList,
  removeContactFromList,
  getContactInitials,
} from "./contactsList.js";

/**
 * Opens the add contact dialog unless it is already open.
 */
export function openAddContactOverlay() {
  if (document.querySelector(".add-contact-overlay")) return;
  document.getElementById("addContact").insertAdjacentHTML("beforeend", addContactTemplate);
  addEventListenerToAddContactForm();
}

/**
 * Connects the buttons and fields of the add contact dialog.
 */
function addEventListenerToAddContactForm() {
  const closeAddBtn = document.getElementById("closeAddContactBtn");
  const cancelAddBtn = document.getElementById("cancelAddContactBtn");
  closeAddBtn?.addEventListener("click", closeAddContactOverlay);
  cancelAddBtn?.addEventListener("click", closeAddContactOverlay);
  const container = document.querySelector(".add-contact-container");
  initOutsideClickHandler(container, closeAddContactOverlay, [closeAddBtn, cancelAddBtn]);
  configureContactFormValidation(
    document.getElementById("AddContactNameInput"),
    document.getElementById("AddContactEmailInput"),
    document.getElementById("AddContactPhoneNumberInput"),
  );
  document.getElementById("saveContactBtn")?.addEventListener("click", handleSaveNewContact);
}

/**
 * Saves the new contact and closes the dialog on success.
 * @param {MouseEvent} event - The click event.
 */
async function handleSaveNewContact(event) {
  event.preventDefault();
  const success = await addContact();
  if (success) closeAddContactOverlay();
}

/**
 * Closes the add contact dialog.
 */
export function closeAddContactOverlay() {
  document.querySelector(".add-contact-overlay")?.remove();
}

/**
 * Returns the first problem of the entered contact values.
 * @param {Object} values - Name, email and vacation days.
 * @returns {string} The error message or an empty string.
 */
function validateContactValues({ name, email, vacationDaysTaken, vacationDaysTotal }) {
  if (name.length < 2) return "Please provide a valid contact name.";
  if (!isValidEmail(email)) return "Please provide a valid contact email.";
  if (vacationDaysTotal > 0 && vacationDaysTaken > vacationDaysTotal) {
    return "Taken vacation days cannot exceed the total.";
  }
  return "";
}

/**
 * Validates the entered values and shows the first problem.
 * @param {Object} values - Name, email and vacation days.
 * @returns {boolean} True if the contact can be saved.
 */
function isContactInputValid(values) {
  const error = validateContactValues(values);
  if (error) showPopup(error);
  return !error;
}

/**
 * Validates and saves the contact from the add dialog.
 * @returns {Promise<boolean>} True if the contact was saved.
 */
async function addContact() {
  const values = getAddContactFormValues();
  if (!isContactInputValid(values)) return false;
  try {
    await saveNewContact(values);
    showPopup("Contact saved.", "success");
    return true;
  } catch (error) {
    showPopup(error.message || "There was an error saving the contact.");
    return false;
  }
}

/**
 * Stores a new contact with a random color and adds it to the list.
 * @param {Object} values - The entered values.
 */
async function saveNewContact({ name, email, phoneNumber, vacationDaysTaken, vacationDaysTotal }) {
  const id = crypto.randomUUID();
  const color = getRandomColor();
  const vacationDays = { taken: vacationDaysTaken, total: vacationDaysTotal };
  const returnedId = await editOrAddContact(id, name, email, phoneNumber, color, vacationDays);
  addContactToList({
    id: returnedId || id,
    name, email, phoneNumber, vacationDaysTaken, vacationDaysTotal,
    initials: getContactInitials(name),
    color,
  });
}

/**
 * Opens the edit dialog for a contact.
 * @param {Object} contact - The contact.
 */
export function openEditContactDialog(contact) {
  const { name, email, phoneNumber, id, color, initials } = contact;
  const template = editContactTemplate(name, email, phoneNumber, id, color, initials);
  document.getElementById("addContact").insertAdjacentHTML("beforeend", template);
  const inputs = getEditFormInputs();
  fillEditForm(inputs, contact);
  configureContactFormValidation(inputs.nameInput, inputs.emailInput, inputs.phoneInput);
  addEventListenerToEditContactForm(contact);
}

/**
 * Returns the text fields of the open contact dialog.
 * @returns {{nameInput: HTMLInputElement, emailInput: HTMLInputElement, phoneInput: HTMLInputElement}} The fields.
 */
function getEditFormInputs() {
  return {
    nameInput: document.getElementById("EditContactNameInput") || document.getElementById("AddContactNameInput"),
    emailInput: document.getElementById("EditContactEmailInput") || document.getElementById("AddContactEmailInput"),
    phoneInput:
      document.getElementById("EditContactPhoneNumberInput") || document.getElementById("AddContactPhoneNumberInput"),
  };
}

/**
 * Fills the edit dialog with the values of the contact.
 * @param {Object} inputs - The text fields.
 * @param {Object} contact - The contact.
 */
function fillEditForm({ nameInput, emailInput, phoneInput }, contact) {
  if (nameInput) nameInput.value = contact.name || "";
  if (emailInput) emailInput.value = contact.email || "";
  if (phoneInput) phoneInput.value = contact.phoneNumber || "";
  const vacationTakenInput = document.getElementById("EditContactVacationTakenInput");
  const vacationTotalInput = document.getElementById("EditContactVacationTotalInput");
  if (vacationTakenInput) vacationTakenInput.value = contact.vacationDaysTaken ?? "";
  if (vacationTotalInput) vacationTotalInput.value = contact.vacationDaysTotal ?? "";
}

/**
 * Connects the close, save and delete buttons of the edit dialog.
 * @param {Object} contact - The edited contact.
 */
function addEventListenerToEditContactForm(contact) {
  const closeEditBtn = document.getElementById("closeEditContactBtn");
  closeEditBtn?.addEventListener("click", closeEditContactOverlay);
  const container = document.querySelector(".edit-contact-container");
  initOutsideClickHandler(container, closeEditContactOverlay, [closeEditBtn]);
  document.getElementById("saveEditContactBtn")?.addEventListener("click", (event) => {
    handleSaveEditedContact(event, contact);
  });
  document.getElementById("deleteEditContactBtn")?.addEventListener("click", (event) => {
    handleDeleteFromEdit(event, contact);
  });
}

/**
 * Saves the edited contact and closes the dialog on success.
 * @param {MouseEvent} event - The click event.
 * @param {Object} contact - The edited contact.
 */
async function handleSaveEditedContact(event, contact) {
  event.preventDefault();
  const success = await saveEditedContact(contact);
  if (success) closeEditContactOverlay();
}

/**
 * Deletes the contact from the edit dialog.
 * @param {MouseEvent} event - The click event.
 * @param {Object} contact - The edited contact.
 */
async function handleDeleteFromEdit(event, contact) {
  event.preventDefault();
  try {
    await deleteContact(contact.id);
    removeContactFromList(contact.id);
    closeEditContactOverlay();
    showPopup("Contact deleted.", "success");
  } catch (error) {
    showPopup(error.message || "There was an error deleting the contact.");
  }
}

/**
 * Reads the values of the edit dialog, missing fields keep the old value.
 * @param {Object} contact - The edited contact.
 * @returns {Object} Name, email, phone number and vacation days.
 */
function readEditFormValues(contact) {
  const { nameInput, emailInput, phoneInput } = getEditFormInputs();
  return {
    name: nameInput ? nameInput.value.trim() : contact.name,
    email: emailInput ? emailInput.value.trim() : contact.email,
    phoneNumber: phoneInput ? phoneInput.value.trim() : contact.phoneNumber,
    vacationDaysTaken: readVacationDaysInput("EditContactVacationTakenInput"),
    vacationDaysTotal: readVacationDaysInput("EditContactVacationTotalInput"),
  };
}

/**
 * Validates and saves the edited contact.
 * @param {Object} contact - The edited contact.
 * @returns {Promise<boolean>} True if the contact was saved.
 */
async function saveEditedContact(contact) {
  const values = readEditFormValues(contact);
  if (!isContactInputValid(values)) return false;
  try {
    const vacationDays = { taken: values.vacationDaysTaken, total: values.vacationDaysTotal };
    await editOrAddContact(contact.id, values.name, values.email, values.phoneNumber, contact.color, vacationDays);
    updateContactInList(contact.id, values);
    showPopup("Contact updated.", "success");
    return true;
  } catch (error) {
    showPopup(error.message || "There was an error saving the contact.");
    return false;
  }
}

/**
 * Closes the edit dialog.
 */
export function closeEditContactOverlay() {
  document.querySelector(".edit-contact-overlay")?.remove();
}
