import { collection, getDocs } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";
import { db, toDataWithId } from "./firebase.js";

const STORAGE_KEY = "guestContacts";
const DEMO_CONTACTS_COLLECTION = "demoContacts";

/**
 * Loads the demo contacts of the guest from the database.
 * @returns {Promise<Object[]>} The demo contacts including their ids.
 */
export async function loadDemoContacts() {
  const snapshot = await getDocs(collection(db, DEMO_CONTACTS_COLLECTION));
  return snapshot.docs.map(toDataWithId);
}

/**
 * Reads the contacts the guest has changed in this browser.
 * @returns {Object[]|null} The contacts, or null if the guest has not changed anything yet.
 */
function readStoredGuestContacts() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}

/**
 * Reads the contacts of the guest, these are the demo contacts until the guest changes them.
 * @returns {Promise<Object[]>} The contacts.
 */
export async function getGuestContacts() {
  return readStoredGuestContacts() || loadDemoContacts();
}

/**
 * Stores the contacts of the guest in this browser.
 * @param {Object[]} contacts - The contacts.
 */
function storeGuestContacts(contacts) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts));
}

/**
 * Discards the changes of the guest, the next read returns the demo contacts again.
 */
export function resetGuestContacts() {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Adds a contact of the guest or updates it if the id already exists.
 * @param {Object} contact - The contact including its id.
 * @returns {Promise<void>} Resolves when the contact is stored.
 */
export async function saveGuestContact(contact) {
  const contacts = await getGuestContacts();
  const index = contacts.findIndex((entry) => entry.id === contact.id);
  if (index === -1) {
    contacts.push(contact);
  } else {
    contacts[index] = { ...contacts[index], ...contact };
  }
  storeGuestContacts(contacts);
}

/**
 * Removes a contact of the guest.
 * @param {string} id - Contact id.
 * @returns {Promise<void>} Resolves when the contact is removed.
 */
export async function deleteGuestContact(id) {
  const contacts = await getGuestContacts();
  storeGuestContacts(contacts.filter((entry) => entry.id !== id));
}
