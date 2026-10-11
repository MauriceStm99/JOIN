import {
  doc,
  setDoc,
  deleteDoc,
  serverTimestamp,
  collection,
  getDocs,
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";
import { db, toDataWithId, getDocumentWithId } from "./firebase.js";
import { seedDemoDataIfEmpty } from "./demoData.js";

/**
 * Creates or updates a contact document.
 * @param {string|null} docIdOrName - Document id, falls back to the name without spaces.
 * @param {string} name - Contact name.
 * @param {string} email - Email address.
 * @param {string} phoneNumber - Phone number.
 * @param {string} color - Avatar color.
 * @param {{taken: number, total: number}} [vacationDays] - Optional vacation days.
 * @returns {Promise<string>} The document id.
 */
export async function editOrAddContact(docIdOrName, name, email, phoneNumber, color, vacationDays) {
  const docId = docIdOrName ?? name.replace(/\s+/g, "");
  const contactData = buildContactData(name, email, phoneNumber, color, vacationDays);
  await setDoc(doc(db, "contacts", docId), contactData, { merge: true });
  return docId;
}

/**
 * Builds the document data for a contact.
 * @param {string} name - Contact name.
 * @param {string} email - Email address.
 * @param {string} phoneNumber - Phone number.
 * @param {string} color - Avatar color.
 * @param {{taken: number, total: number}} [vacationDays] - Optional vacation days.
 * @returns {Object} The contact data.
 */
function buildContactData(name, email, phoneNumber, color, vacationDays) {
  const contactData = {
    name, email, phoneNumber, color,
    updatedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
  };
  if (vacationDays) {
    contactData.vacationDaysTaken = vacationDays.taken;
    contactData.vacationDaysTotal = vacationDays.total;
  }
  return contactData;
}

/**
 * Deletes a contact and removes it from all tasks it was assigned to.
 * @param {string} uuid - Contact id.
 */
export async function deleteContact(uuid) {
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
 * Loads all contacts, seeds demo data first if the database is empty.
 * @returns {Promise<Object[]>} All contacts.
 */
export async function getContacts() {
  await seedDemoDataIfEmpty();
  const snapshot = await getDocs(collection(db, "contacts"));
  return snapshot.docs.map(toDataWithId);
}

/**
 * Loads a single contact.
 * @param {string} uid - Contact id.
 * @returns {Promise<Object>} The contact including its id.
 */
export function getContact(uid) {
  return getDocumentWithId("contacts", uid, "Contact not found");
}
