import {
  addContactTemplate,
  getContactsGroupTemplate,
  getContactDetailsTemplate,
  editContactTemplate,
} from "../templates/contactTemplates.js";
import { initOutsideClickHandler, getRandomColor } from "./utility.js";
import { editOrAddContact, getContacts, auth, getContact, deleteContact } from "./firebase.js";
import { showPopup } from "./feedback.js";
import { configureContactFormValidation, getAddContactFormValues, isValidEmail, readVacationDaysInput } from "./contactsFormHelpers.js";

let contacts = [];
let currentShownContact = null;

function groupContacts(contactList) {
  const grouped = {};

  const sorted = [...contactList].sort((a, b) =>
    (a.name || "").localeCompare(b.name || "", undefined, { sensitivity: "base" })
  );

  sorted.forEach((contact, index) => {
    contact._index = contactList.indexOf(contact);

    const firstChar = (contact.name || "").trim().charAt(0).toUpperCase();
    const letter = firstChar >= "A" && firstChar <= "Z" ? firstChar : "#";

    const initials = (contact.name || "")
      .split(" ")
      .map((namePart) => namePart.charAt(0).toUpperCase())
      .join("")
      .substring(0, 2);

    contact.initials = initials;

    if (!grouped[letter]) grouped[letter] = [];
    grouped[letter].push(contact);
  });

  return grouped;
}

function renderContacts() {
  const container = document.getElementById("contactsList");
  if (!container) return;

  const groupedContacts = groupContacts(contacts);
  let html = "";

  const sortedLetters = Object.keys(groupedContacts).sort((a, b) => a.localeCompare(b));
  for (const letter of sortedLetters) {
    html += getContactsGroupTemplate(letter, groupedContacts[letter]);
  }

  container.innerHTML = html;
}

const contactsList = document.getElementById("contactsList");
function isEmailTruncated(emailElement) {
  return emailElement.classList.contains("expanded") || emailElement.scrollWidth > emailElement.clientWidth;
}

function contactListClickHandler(event) {
  const item = event.target.closest(".contact-item");
  if (!item) return;

  const emailElement = event.target.closest(".contact-email");
  if (emailElement && isEmailTruncated(emailElement)) {
    emailElement.classList.toggle("expanded");
    return;
  }

  const id = Number(item.dataset.contactId);
  const contact = contacts.find((entry) => entry._index === id) || contacts[id];
  if (contact) {
    contactShowDetails(contact, contact._index);
  }
}

if (contactsList) contactsList.addEventListener("click", contactListClickHandler);

const addContactBtn = document.getElementById("addContactBtn");
const addContactMobileBtn = document.getElementById("addContactMobileBtn");

let closeAddBtn = null;
let saveContactBtn = null;

function openAddContactOverlay() {
  if (document.querySelector(".add-contact-overlay")) return;

  const addContent = document.getElementById("addContact");
  addContent.insertAdjacentHTML("beforeend", addContactTemplate);
  addEventListenerToAddContactForm();
}

if (addContactBtn) {
  addContactBtn.addEventListener("click", openAddContactOverlay);
}

if (addContactMobileBtn) {
  addContactMobileBtn.addEventListener("click", openAddContactOverlay);
}

loadContactsData();

async function loadContactsData() {
  try {
    contacts = await getContacts();
  } catch {
    contacts = [];
    showPopup("Contacts could not be loaded.");
  }

  renderContacts();
}

function addEventListenerToAddContactForm() {
  closeAddBtn = document.getElementById("closeAddContactBtn");
  if (closeAddBtn) {
    closeAddBtn.addEventListener("click", () => {
      closeAddContactOverlay();
    });
  }

  const cancelAddBtn = document.getElementById("cancelAddContactBtn");
  if (cancelAddBtn) {
    cancelAddBtn.addEventListener("click", () => {
      closeAddContactOverlay();
    });
  }

  initOutsideClickHandler(document.querySelector(".add-contact-container"), closeAddContactOverlay, [closeAddBtn, cancelAddBtn]);

  const nameInput = document.getElementById("AddContactNameInput");
  const emailInput = document.getElementById("AddContactEmailInput");
  const phoneInput = document.getElementById("AddContactPhoneNumberInput");
  configureContactFormValidation(nameInput, emailInput, phoneInput);

  saveContactBtn = document.getElementById("saveContactBtn");
  if (saveContactBtn) {
    saveContactBtn.addEventListener("click", async (event) => {
      event.preventDefault();
      const success = await addContact();
      if (success) closeAddContactOverlay();
    });
  }
}

function closeAddContactOverlay() {
  const overlay = document.querySelector(".add-contact-overlay");
  if (overlay) overlay.remove();
}

async function addContact() {
  const id = crypto.randomUUID();

  const { name, email, phoneNumber, vacationDaysTaken, vacationDaysTotal } = getAddContactFormValues();
  const color = getRandomColor();

  if (name.length < 2) {
    showPopup("Please provide a valid contact name.");
    return false;
  }

  if (!isValidEmail(email)) {
    showPopup("Please provide a valid contact email.");
    return false;
  }

  if (vacationDaysTotal > 0 && vacationDaysTaken > vacationDaysTotal) {
    showPopup("Taken vacation days cannot exceed the total.");
    return false;
  }

  const initials = name
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase())
    .join("")
    .substring(0, 2);

  try {
    const returnedId = await editOrAddContact(id, name, email, phoneNumber, color, {
      taken: vacationDaysTaken,
      total: vacationDaysTotal,
    });
    const docId = returnedId || id;

    contacts.push({
      id: docId,
      name,
      email,
      phoneNumber,
      vacationDaysTaken,
      vacationDaysTotal,
      initials,
      color,
    });

    contacts[contacts.length - 1]._index = contacts.length - 1;
    renderContacts();
    showPopup("Contact saved.", "success");
    return true;
  } catch (error) {
    showPopup(error.message || "There was an error saving the contact.");
    return false;
  }
}

function contactShowDetails(contact, index) {
  let contactButton;

  if (currentShownContact != null) {
    contactButton = document.querySelector(`[data-contact-id="${currentShownContact._index}"]`);
    if (contactButton) contactButton.classList.remove("active-contact");
  }

  contactButton = document.querySelector(`[data-contact-id="${index}"]`);
  if (!contactButton) return;

  const contactDetailsOverlay = document.getElementById("contactDetailsOverlay");
  contactButton.classList.add("active-contact");
  currentShownContact = contact;
  contactDetailsOverlay.innerHTML = getContactDetailsTemplate(contact, contact.color);
  contactDetailsAddEventListeners();

  if (window.innerWidth <= 768) {
    showMobileDetailView();
  }
}

function showMobileDetailView() {
  const left = document.querySelector(".contacts-left");
  const right = document.querySelector(".contacts-right");
  if (!left || !right) return;

  left.classList.add("mobile-hidden");
  right.classList.remove("mobile-hidden");
  right.classList.add("mobile-detail-visible");

  if (!document.getElementById("mobileBackBtn")) {
    const backBtn = document.createElement("button");
    backBtn.id = "mobileBackBtn";
    backBtn.className = "mobile-back-btn";
    backBtn.setAttribute("aria-label", "Back");
    backBtn.innerHTML = `<img src="./assets/utilitys/arrowBack.svg" alt="">`;
    backBtn.addEventListener("click", hideMobileDetailView);
    right.prepend(backBtn);
  }
}

function hideMobileDetailView() {
  const left = document.querySelector(".contacts-left");
  const right = document.querySelector(".contacts-right");
  const backBtn = document.getElementById("mobileBackBtn");

  if (left) left.classList.remove("mobile-hidden");
  if (right) {
    right.classList.add("mobile-hidden");
    right.classList.remove("mobile-detail-visible");
  }
  if (backBtn) backBtn.remove();

  if (currentShownContact != null) {
    const btn = document.querySelector(`[data-contact-id="${currentShownContact._index}"]`);
    if (btn) btn.classList.remove("active-contact");
    currentShownContact = null;
  }
}

function contactDetailsAddEventListeners() {
  const deleteDetailsBtn = document.getElementById("deleteContactDetailsBtn");
  const editDetailsBtn = document.getElementById("editContactBtn");
  const contact = currentShownContact;

  if (deleteDetailsBtn) {
    deleteDetailsBtn.addEventListener("click", async () => {
      try {
        await deleteContact(contact.id);
        const index = contacts.findIndex((entry) => entry.id === contact.id);
        if (index !== -1) contacts.splice(index, 1);
        renderContacts();

        const contactDetailsOverlay = document.getElementById("contactDetailsOverlay");
        if (contactDetailsOverlay) contactDetailsOverlay.innerHTML = "";
        currentShownContact = null;
        showPopup("Contact deleted.", "success");
      } catch (error) {
        showPopup(error.message || "There was an error deleting the contact.");
      }
    });
  }

  if (editDetailsBtn) {
    editDetailsBtn.addEventListener("click", () => {
      editContact(currentShownContact);
    });
  }
}

function editContact(contact) {
  const contactTemplate = editContactTemplate(
    contact.name,
    contact.email,
    contact.phoneNumber,
    contact.id,
    contact.color,
    contact.initials
  );

  const addContent = document.getElementById("addContact");
  addContent.insertAdjacentHTML("beforeend", contactTemplate);

  const nameInput = document.getElementById("EditContactNameInput") || document.getElementById("AddContactNameInput");
  const emailInput = document.getElementById("EditContactEmailInput") || document.getElementById("AddContactEmailInput");
  const phoneInput =
    document.getElementById("EditContactPhoneNumberInput") || document.getElementById("AddContactPhoneNumberInput");

  if (nameInput) nameInput.value = contact.name || "";
  if (emailInput) emailInput.value = contact.email || "";
  if (phoneInput) phoneInput.value = contact.phoneNumber || "";

  const vacationTakenInput = document.getElementById("EditContactVacationTakenInput");
  const vacationTotalInput = document.getElementById("EditContactVacationTotalInput");
  if (vacationTakenInput) vacationTakenInput.value = contact.vacationDaysTaken ?? "";
  if (vacationTotalInput) vacationTotalInput.value = contact.vacationDaysTotal ?? "";

  configureContactFormValidation(nameInput, emailInput, phoneInput);
  addEventListenerToEditContactForm(contact);
}

function addEventListenerToEditContactForm(contact) {
  const closeEditBtn = document.getElementById("closeEditContactBtn");
  if (closeEditBtn) {
    closeEditBtn.addEventListener("click", () => {
      closeEditContactOverlay();
    });
  }

  initOutsideClickHandler(document.querySelector(".edit-contact-container"), closeEditContactOverlay, [closeEditBtn]);

  const saveEditContactBtn = document.getElementById("saveEditContactBtn");
  if (saveEditContactBtn) {
    saveEditContactBtn.addEventListener("click", async (event) => {
      event.preventDefault();
      const success = await saveEditedContact(contact);
      if (success) closeEditContactOverlay();
    });
  }

  const deleteContactBtn = document.getElementById("deleteEditContactBtn");
  if (deleteContactBtn) {
    deleteContactBtn.addEventListener("click", async (event) => {
      event.preventDefault();

      try {
        await deleteContact(contact.id);
        const index = contacts.findIndex((entry) => entry.id === contact.id);
        if (index !== -1) contacts.splice(index, 1);
        renderContacts();
        closeEditContactOverlay();
        showPopup("Contact deleted.", "success");
      } catch (error) {
        showPopup(error.message || "There was an error deleting the contact.");
      }
    });
  }
}

async function saveEditedContact(contact) {
  const nameElement = document.getElementById("EditContactNameInput") || document.getElementById("AddContactNameInput");
  const emailElement =
    document.getElementById("EditContactEmailInput") || document.getElementById("AddContactEmailInput");
  const phoneElement =
    document.getElementById("EditContactPhoneNumberInput") || document.getElementById("AddContactPhoneNumberInput");

  const name = nameElement ? nameElement.value.trim() : contact.name;
  const email = emailElement ? emailElement.value.trim() : contact.email;
  const phoneNumber = phoneElement ? phoneElement.value.trim() : contact.phoneNumber;
  const vacationDaysTaken = readVacationDaysInput("EditContactVacationTakenInput");
  const vacationDaysTotal = readVacationDaysInput("EditContactVacationTotalInput");

  if (name.length < 2) {
    showPopup("Please provide a valid contact name.");
    return false;
  }

  if (!isValidEmail(email)) {
    showPopup("Please provide a valid contact email.");
    return false;
  }

  if (vacationDaysTotal > 0 && vacationDaysTaken > vacationDaysTotal) {
    showPopup("Taken vacation days cannot exceed the total.");
    return false;
  }

  try {
    await editOrAddContact(contact.id, name, email, phoneNumber, contact.color, {
      taken: vacationDaysTaken,
      total: vacationDaysTotal,
    });

    const index = contacts.findIndex((entry) => entry.id === contact.id);
    if (index !== -1) {
      contacts[index].name = name;
      contacts[index].email = email;
      contacts[index].phoneNumber = phoneNumber;
      contacts[index].vacationDaysTaken = vacationDaysTaken;
      contacts[index].vacationDaysTotal = vacationDaysTotal;
      contacts[index].initials = name
        .split(" ")
        .map((part) => part.charAt(0).toUpperCase())
        .join("")
        .substring(0, 2);
    }

    renderContacts();

    const updatedIndex = contacts.findIndex((entry) => entry.id === contact.id);
    if (updatedIndex !== -1) {
      contactShowDetails(contacts[updatedIndex], contacts[updatedIndex]._index);
    }

    showPopup("Contact updated.", "success");
    return true;
  } catch (error) {
    showPopup(error.message || "There was an error saving the contact.");
    return false;
  }
}

function closeEditContactOverlay() {
  const overlay = document.querySelector(".edit-contact-overlay");
  if (overlay) overlay.remove();
}

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  if (document.querySelector(".edit-contact-overlay:not(.add-contact-overlay)")) {
    closeEditContactOverlay();
    return;
  }
  if (document.querySelector(".add-contact-overlay")) {
    closeAddContactOverlay();
  }
});

export function getContactsArray() {
  return contacts;
}

document.getElementById("profileShowMore")?.addEventListener("click", async (event) => {
  if (!event.target.closest("#editProfileBtn")) return;
  document.getElementById("profileShowMore")?.classList.add("d-none");

  const user = auth.currentUser;
  if (!user) {
    showPopup("No user logged in.");
    return;
  }

  try {
    const contact = await getContact(user.uid);
    editContact(contact);
  } catch (error) {
    showPopup(error.message || "Could not load your profile.");
  }
});

