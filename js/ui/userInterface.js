import { onAuthChange } from "../firebase/firebase.js";
import { getUsername } from "../firebase/firebaseUsers.js";
import { getStoredCurrentUser, isGuestEmail } from "../core/utility.js";

const PUBLIC_PAGES = ["", "index.html", "signUp.html"];
const GUEST_INITIALS = "G";

let uid = null;
let username = null;
let isGuest = false;

/**
 * Loads the username after login, or sends logged-out users back to the login page.
 * @param {Object|null} user - The Firebase user or null.
 */
async function handleAuthChange(user) {
  if (!user) {
    setTimeout(redirectIfProtectedPage, 300);
    return;
  }
  uid = user.uid;
  isGuest = isGuestEmail(user.email);
  applyGuestView();
  if (!isGuest) await loadUsername();
}

/**
 * Applies the guest view right away from the stored user, Firebase confirms it after login.
 */
function applyStoredGuestState() {
  isGuest = isGuestEmail(getStoredCurrentUser()?.email);
  applyGuestView();
}

/**
 * Marks the guest view, which hides the help on the legal pages, and shows "G" as initials.
 */
function applyGuestView() {
  document.documentElement.classList.toggle("guest-user", isGuest);
  if (isGuest) editProfileInitials();
}

/**
 * Reads the username of the logged-in user and shows its initials.
 */
async function loadUsername() {
  try {
    username = await getUsername(uid);
    if (username) editProfileInitials();
  } catch {
    editProfileInitials();
  }
}

/**
 * Sends the user to the login page if the current page requires a login.
 */
function redirectIfProtectedPage() {
  const currentPage = window.location.pathname.split("/").pop();
  if (!PUBLIC_PAGES.includes(currentPage)) {
    window.location.href = "../../index.html";
  }
}

/**
 * Builds the initials for the header avatar, a single name gives its first two letters.
 * @param {string} name - Username.
 * @returns {string} One or two uppercase letters.
 */
export function getInitials(name) {
  if (!name) return "";
  const names = name.split(" ");
  let initials = names[0].charAt(0).toUpperCase();
  if (names.length > 1) {
    initials += names[names.length - 1].charAt(0).toUpperCase();
  }
  if (initials.length === 1 && names[0].length > 1) {
    initials += names[0].charAt(1).toUpperCase();
  }
  return initials;
}

/**
 * Writes the initials of the logged-in user into the header avatar, the guest gets "G".
 */
export function editProfileInitials() {
  const nameInitialsElement = document.getElementById("nameInitials");
  if (nameInitialsElement) {
    nameInitialsElement.innerHTML = isGuest ? GUEST_INITIALS : getInitials(username);
  }
}

/**
 * Shows the stored guest state and the initials, then follows every login change.
 * The buttons of the profile menu are connected in profilePopup.js, which also renders the menu.
 */
function initUserInterface() {
  applyStoredGuestState();
  onAuthChange(handleAuthChange);
}

document.addEventListener("DOMContentLoaded", initUserInterface);
