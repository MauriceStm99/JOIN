import { onAuthChange, getUsername, logout } from "./firebase.js";
import { showPopup } from "./feedback.js";

let uid = null;
let username = null;

onAuthChange(async (user) => {
  if (user) {
    uid = user.uid;

    try {
      username = await getUsername(uid);
      if (username) {
        editProfileInitials();
      }
    } catch {
      editProfileInitials();
    }

    return;
  }

  setTimeout(() => {
    const currentPage = window.location.pathname.split("/").pop();
    const publicPages = ["", "index.html", "signUp.html"];
    if (!publicPages.includes(currentPage)) {
      window.location.href = "index.html";
    }
  }, 300);
});

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

export function editProfileInitials() {
  const nameInitialsElement = document.getElementById("nameInitials");
  if (nameInitialsElement) {
    nameInitialsElement.innerHTML = getInitials(username);
  }
}

function logoutUser() {
  logout()
    .then(() => {
      window.location.href = "index.html";
    })
    .catch((error) => {
      showPopup("Logout failed: " + (error.message || "Unknown error"));
    });
}

function addEventListenersToProfileButtons() {
  const privacySettingsBtn = document.getElementById("privacySettingsBtn");
  const legalNoticeBtn = document.getElementById("legalNoticeBtn");
  const logoutBtn = document.getElementById("logoutBtn");

  privacySettingsBtn?.addEventListener("click", () => {
    window.location.href = "privacyPolicyInt.html";
  });

  legalNoticeBtn?.addEventListener("click", () => {
    window.location.href = "legalNoticeInt.html";
  });

  logoutBtn?.addEventListener("click", () => {
    logoutUser();
  });
}

document.addEventListener("DOMContentLoaded", () => {
  addEventListenersToProfileButtons();
});
