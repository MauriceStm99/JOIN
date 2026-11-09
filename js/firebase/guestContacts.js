import { demoContacts } from "./demoData.js";

const STORAGE_KEY = "guestContacts";

/**
 * Reads the contacts of the guest, these are the demo contacts until the guest changes them.
 * @returns {Object[]} A copy of the contacts.
 */
export function getGuestContacts() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || structuredClone(demoContacts);
  } catch {
    return structuredClone(demoContacts);
  }
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
 */
export function saveGuestContact(contact) {
  const contacts = getGuestContacts();
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
 */
export function deleteGuestContact(id) {
  storeGuestContacts(getGuestContacts().filter((entry) => entry.id !== id));
}
