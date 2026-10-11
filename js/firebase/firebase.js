import { initializeApp } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";

export const firebaseConfig = {
  apiKey: "AIzaSyAuMjatRtEmm3DlwGJmJFVyFubVSBYyHZE",
  authDomain: "join-462d3.firebaseapp.com",
  projectId: "join-462d3",
  storageBucket: "join-462d3.firebasestorage.app",
  messagingSenderId: "415727545660",
  appId: "1:415727545660:web:2a299ee4e1efb0fddc8239",
};

const LOGIN_ERRORS = {
  "auth/user-not-found": "User not found.",
  "auth/wrong-password": "Incorrect password.",
  "auth/invalid-credential": "Invalid email address or password.",
  "auth/invalid-email": "Invalid email address or password.",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

/**
 * Logs a user in with email and password.
 * @param {string} email - Email address.
 * @param {string} password - Password.
 * @returns {Promise<Object>} The Firebase user.
 */
export async function loginWithEmail(email, password) {
  try {
    const { user } = await signInWithEmailAndPassword(auth, email, password);
    return user;
  } catch (error) {
    throw new Error(LOGIN_ERRORS[error.code] || "Login failed, check email and password.");
  }
}

/**
 * Logs the user out and removes the stored user data.
 * @returns {Promise<void>} Resolves when Firebase has signed out.
 */
export function logout() {
  localStorage.removeItem("currentUser");
  return auth.signOut();
}

/**
 * Registers a callback for login and logout changes.
 * @param {Function} callback - Receives the user or null.
 * @returns {Function} Function that removes the listener.
 */
export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}

/**
 * Turns a Firestore document into a plain object that contains its id.
 * @param {Object} snapshotDoc - Firestore document snapshot.
 * @returns {Object} The data including the id.
 */
export function toDataWithId(snapshotDoc) {
  return { id: snapshotDoc.id, ...snapshotDoc.data() };
}

/**
 * Loads a single document or throws if it does not exist.
 * @param {string} collectionName - Collection name.
 * @param {string} id - Document id.
 * @param {string} notFoundMessage - Error message for a missing document.
 * @returns {Promise<Object>} The data including the id.
 */
export async function getDocumentWithId(collectionName, id, notFoundMessage) {
  const snapshot = await getDoc(doc(db, collectionName, id));
  if (snapshot.exists()) return toDataWithId(snapshot);
  throw new Error(notFoundMessage);
}
