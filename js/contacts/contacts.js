import { auth } from "../firebase/firebase.js";
import { getContact } from "../firebase/firebaseContacts.js";
import { showPopup } from "../ui/feedback.js";
import { loadContactsData, contactListClickHandler, getCurrentShownContact } from "./contactsList.js";
import {
  openAddContactOverlay,
  closeAddContactOverlay,
  openEditContactDialog,
  closeEditContactOverlay,
} from "./contactsDialogs.js";

export { getContactsArray } from "./contactsList.js";

/**
 * Opens the edit dialog when the edit button of the detail view is clicked.
 * @param {MouseEvent} event - The click event.
 */
function handleDetailsClick(event) {
  if (!event.target.closest("#editContactBtn")) return;
  openEditContactDialog(getCurrentShownContact());
}

/**
 * Closes the open contact dialog with the Escape key.
 * @param {KeyboardEvent} event - The keydown event.
 */
function handleEscapeKey(event) {
  if (event.key !== "Escape") return;
  if (document.querySelector(".edit-contact-overlay:not(.add-contact-overlay)")) {
    closeEditContactOverlay();
    return;
  }
  if (document.querySelector(".add-contact-overlay")) {
    closeAddContactOverlay();
  }
}

/**
 * Opens the own contact for editing when "Edit Profile" is clicked in the profile menu.
 * @param {MouseEvent} event - The click event.
 */
async function handleProfileMenuClick(event) {
  if (!event.target.closest("#editProfileBtn")) return;
  document.getElementById("profileShowMore")?.classList.add("d-none");
  const user = auth.currentUser;
  if (!user) {
    showPopup("No user logged in.");
    return;
  }
  await openOwnContact(user.uid);
}

/**
 * Loads the contact of the logged-in user and opens the edit dialog.
 * @param {string} uid - User id.
 */
async function openOwnContact(uid) {
  try {
    openEditContactDialog(await getContact(uid));
  } catch (error) {
    showPopup(error.message || "Could not load your profile.");
  }
}

/**
 * Connects the list, the add buttons and the detail view and loads the contacts.
 */
function initContactsPage() {
  document.getElementById("contactsList")?.addEventListener("click", contactListClickHandler);
  document.getElementById("addContactBtn")?.addEventListener("click", openAddContactOverlay);
  document.getElementById("addContactMobileBtn")?.addEventListener("click", openAddContactOverlay);
  document.getElementById("contactDetailsOverlay")?.addEventListener("click", handleDetailsClick);
  loadContactsData();
  document.addEventListener("keydown", handleEscapeKey);
  document.getElementById("profileShowMore")?.addEventListener("click", handleProfileMenuClick);
}

initContactsPage();
