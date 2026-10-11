import { onAuthChange, logout } from "../firebase/firebase.js";
import { getUsername } from "../firebase/firebaseUsers.js";
import { showPopup } from "./feedback.js";
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
 * Hides the help icon and the help menu entry for the guest and shows "G" as initials.
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
 * Logs the user out and returns to the login page.
 */
function logoutUser() {
  logout()
    .then(() => {
      window.location.href = "../../index.html";
    })
    .catch((error) => {
      showPopup("Logout failed: " + (error.message || "Unknown error"));
    });
}

/**
 * Connects the legal and logout buttons of the profile menu.
 */
function addEventListenersToProfileButtons() {
  document.getElementById("privacySettingsBtn")?.addEventListener("click", () => {
    window.location.href = "../legal/privacyPolicyInt.html";
  });
  document.getElementById("legalNoticeBtn")?.addEventListener("click", () => {
    window.location.href = "../legal/legalNoticeInt.html";
  });
  document.getElementById("logoutBtn")?.addEventListener("click", logoutUser);
}

applyStoredGuestState();
onAuthChange(handleAuthChange);
document.addEventListener("DOMContentLoaded", addEventListenersToProfileButtons);
