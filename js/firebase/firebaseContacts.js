import {
  doc,
  setDoc,
  deleteDoc,
  serverTimestamp,
  collection,
  getDocs,
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";
import { db, toDataWithId, getDocumentWithId, isGuestSession } from "./firebase.js";
import { seedDemoDataIfEmpty, demoContacts } from "./demoData.js";
import { getGuestContacts, saveGuestContact, deleteGuestContact } from "./guestContacts.js";
import { isGuestEmail } from "../core/utility.js";

/**
 * Creates or updates a contact, the guest only changes its own demo contacts.
 * @param {string|null} docIdOrName - Document id, falls back to the name without spaces.
 * @param {string} name - Contact name.
 * @param {string} email - Email address.
 * @param {string} phoneNumber - Phone number.
 * @param {string} color - Avatar color.
 * @returns {Promise<string>} The document id.
 */
export async function editOrAddContact(docIdOrName, name, email, phoneNumber, color) {
  const docId = docIdOrName ?? name.replace(/\s+/g, "");
  const contactData = { name, email, phoneNumber, color };
  if (await isGuestSession()) {
    saveGuestContact({ id: docId, ...contactData });
    return docId;
  }
  const timestamps = { updatedAt: serverTimestamp(), createdAt: serverTimestamp() };
  await setDoc(doc(db, "contacts", docId), { ...contactData, ...timestamps }, { merge: true });
  return docId;
}

/**
 * Deletes a contact and removes it from all tasks it was assigned to.
 * The guest only removes it from its own demo contacts and leaves the shared tasks alone.
 * @param {string} uuid - Contact id.
 */
export async function deleteContact(uuid) {
  if (await isGuestSession()) {
    deleteGuestContact(uuid);
    return;
  }
  const snapshot = await getDocs(collection(db, "tasks"));
  await Promise.all(unassignContactFromTasks(snapshot, uuid));
  await deleteDoc(doc(db, "contacts", uuid));
}

/**
 * Starts an update for every task that has the contact assigned.
 * @param {Object} snapshot - Firestore snapshot of all tasks.
 * @param {string} uuid - Contact id.
 * @returns {Promise[]} The running updates.
 */
function unassignContactFromTasks(snapshot, uuid) {
  return snapshot.docs
    .filter((taskDoc) => getAssignedIds(taskDoc.data()).includes(uuid))
    .map((taskDoc) => removeAssigneeFromTask(taskDoc, uuid));
}

/**
 * Returns the assigned contact ids of a task.
 * @param {Object} taskData - Task document data.
 * @returns {string[]} The assigned ids.
 */
function getAssignedIds(taskData) {
  return Array.isArray(taskData.assignedTo) ? taskData.assignedTo : [];
}

/**
 * Removes one contact from the assignees of a task.
 * @param {Object} taskDoc - Firestore task document.
 * @param {string} uuid - Contact id.
 * @returns {Promise<void>} The update.
 */
function removeAssigneeFromTask(taskDoc, uuid) {
  const assignedTo = getAssignedIds(taskDoc.data()).filter((entry) => entry !== uuid);
  return setDoc(doc(db, "tasks", taskDoc.id), { assignedTo, updatedAt: serverTimestamp() }, { merge: true });
}

/**
 * Loads the contacts: the guest gets its demo contacts, everyone else the real accounts.
 * Seeds demo data first if the database is empty.
 * @returns {Promise<Object[]>} The contacts.
 */
export async function getContacts() {
  if (await isGuestSession()) return getGuestContacts();
  await seedDemoDataIfEmpty();
  const snapshot = await getDocs(collection(db, "contacts"));
  return snapshot.docs.map(toDataWithId).filter(isRealContact);
}

/**
 * Filters out the guest account and demo contacts that were stored by earlier versions.
 * @param {Object} contact - The contact.
 * @returns {boolean} True for a real contact.
 */
function isRealContact(contact) {
  return !isGuestEmail(contact.email) && !demoContacts.some((demo) => demo.id === contact.id);
}

/**
 * Loads a single contact.
 * @param {string} uid - Contact id.
 * @returns {Promise<Object>} The contact including its id.
 */
export function getContact(uid) {
  return getDocumentWithId("contacts", uid, "Contact not found");
}
