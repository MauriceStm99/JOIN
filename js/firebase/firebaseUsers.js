import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";
import { doc, setDoc, deleteDoc, serverTimestamp, getDoc } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";
import { auth, db, getDocumentWithId } from "./firebase.js";
import { editOrAddContact } from "./firebaseContacts.js";

const PROFILE_COLORS = [
  "#FF5733", "#33FF57", "#3357FF", "#FF33A1", "#A133FF",
  "#33FFF5", "#F5FF33", "#FF8C33", "#8C33FF", "#33FF8C",
];

const REGISTRATION_ERRORS = {
  "auth/email-already-in-use": "This email is already in use.",
  "auth/weak-password": "The password is too weak.",
  "auth/invalid-email": "Invalid email address.",
};

/**
 * Registers a new user, creates the user profile and adds the user as a contact.
 * @param {string} email - Email address.
 * @param {string} password - Password.
 * @param {string} username - Display name.
 * @returns {Promise<Object>} The Firebase user.
 */
export async function createUser(email, password, username) {
  try {
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    await createOrUpdateUserProfile(user.uid, username, email);
    await editOrAddContact(user.uid, username, email, "", generateRandomColor());
    return user;
  } catch (error) {
    throw new Error(REGISTRATION_ERRORS[error.code] || "Registration failed.");
  }
}

/**
 * Creates the user profile on first login, afterwards only updates its timestamp.
 * @param {string} uid - User id.
 * @param {string} username - Display name.
 * @param {string} email - Email address.
 */
export async function createOrUpdateUserProfile(uid, username, email) {
  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);
  if (userSnap.exists()) {
    await setDoc(userRef, { updatedAt: serverTimestamp() }, { merge: true });
    return;
  }
  await setDoc(userRef, buildNewUserProfile(username, email));
}

/**
 * Builds the document for a new user profile.
 * @param {string} username - Display name.
 * @param {string} email - Email address.
 * @returns {Object} The profile data.
 */
function buildNewUserProfile(username, email) {
  return {
    username,
    email,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    color: generateRandomColor(),
  };
}

/**
 * Picks a random profile color.
 * @returns {string} A hex color.
 */
function generateRandomColor() {
  return PROFILE_COLORS[Math.floor(Math.random() * PROFILE_COLORS.length)];
}

/**
 * Deletes the logged-in user account and its profile document.
 * @param {string} uid - User id.
 */
export async function deleteUserProfile(uid) {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("No user is currently logged in.");
  }
  await user.delete();
  await deleteDoc(doc(db, "users", uid));
}

/**
 * Reads the username of a user profile.
 * @param {string} uid - User id.
 * @returns {Promise<string>} The username or an empty string.
 */
export async function getUsername(uid) {
  const snapshot = await getDoc(doc(db, "users", uid));
  return snapshot.data()?.username || "";
}

/**
 * Loads a single user profile.
 * @param {string} uid - User id.
 * @returns {Promise<Object>} The user including its id.
 */
export function getUserById(uid) {
  return getDocumentWithId("users", uid, "User not found");
}
