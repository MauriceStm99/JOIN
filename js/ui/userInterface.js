import { onAuthChange, logout } from "../firebase/firebase.js";
import { getUsername } from "../firebase/firebaseUsers.js";
import { showPopup } from "./feedback.js";
import { getStoredCurrentUser, isGuestEmail } from "../core/utility.js";

const PUBLIC_PAGES = ["", "index.html", "signUp.html"];

let uid = null;
let username = null;

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
  hideHelpForGuest(user.email);
  await loadUsername();
}

/**
 * Hides the help icon and the help entry of the profile menu for the guest account.
 * @param {string|undefined} email - Email of the logged-in user.
 */
function hideHelpForGuest(email) {
  document.documentElement.classList.toggle("guest-user", isGuestEmail(email));
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
 * Writes the initials of the logged-in user into the header avatar.
 */
export function editProfileInitials() {
  const nameInitialsElement = document.getElementById("nameInitials");
  if (nameInitialsElement) {
    nameInitialsElement.innerHTML = getInitials(username);
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

hideHelpForGuest(getStoredCurrentUser()?.email);
onAuthChange(handleAuthChange);
document.addEventListener("DOMContentLoaded", addEventListenersToProfileButtons);
