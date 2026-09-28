import { profileTemplate, profileTemplateSimple } from "../templates/profileTemplates.js";
import { logout } from "./firebase.js";

function isSimpleProfilePage() {
  const simplePages = [
    "addTask.html",
    "board.html",
    "summaryUser.html",
    "privacyPolicyInt.html",
    "legalNoticeInt.html",
    "help.html",
  ];

  return simplePages.some((page) => window.location.pathname.endsWith(page));
}

function initBackButtons() {
  const backTargets = [
    ...document.querySelectorAll("#backBtn"),
    ...document.querySelectorAll(".h1-arrow"),
    ...document.querySelectorAll(".back-btn"),
  ];

  const internalPages = [
    "summaryUser.html",
    "addTask.html",
    "board.html",
    "contacts.html",
    "help.html",
    "privacyPolicyInt.html",
    "legalNoticeInt.html",
  ];

  backTargets.forEach((target) => {
    target.addEventListener("click", (event) => {
      event.preventDefault();

      const currentPage = window.location.pathname.split("/").pop();
      const fallbackTarget = internalPages.includes(currentPage) ? "summaryUser.html" : "index.html";

      const referrerPage = document.referrer
        ? new URL(document.referrer).pathname.split("/").pop()
        : "";

      const canGoBack =
        document.referrer &&
        document.referrer !== window.location.href &&
        internalPages.includes(referrerPage);

      if (canGoBack) {
        window.history.back();
      } else {
        window.location.href = fallbackTarget;
      }
    });
  });
}

initBackButtons();

function highlightActiveMobileNav() {
  const currentPage = window.location.pathname.split("/").pop() || "summaryUser.html";
  document.querySelectorAll(".mobile-nav a").forEach((link) => {
    const linkPage = link.getAttribute("href")?.split("/").pop();
    if (linkPage && linkPage === currentPage) {
      link.classList.add("mobile-active");
    }
  });
}

highlightActiveMobileNav();

const profileBtn = document.getElementById("userProfileInitialsBtn");
const profileMenu = document.getElementById("profileShowMore");

if (profileBtn && profileMenu) {
  profileMenu.innerHTML = isSimpleProfilePage() ? profileTemplateSimple : profileTemplate;

  const logoutBtn = profileMenu.querySelector("#logoutBtn");
  const privacyBtn = profileMenu.querySelector("#privacySettingsBtn");
  const legalBtn = profileMenu.querySelector("#legalNoticeBtn");

  logoutBtn?.addEventListener("click", () => {
    logout().then(() => (window.location.href = "index.html"));
  });

  privacyBtn?.addEventListener("click", () => {
    window.location.href = "privacyPolicyInt.html";
  });

  legalBtn?.addEventListener("click", () => {
    window.location.href = "legalNoticeInt.html";
  });

  profileBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    profileMenu.classList.toggle("d-none");
  });

  profileMenu.addEventListener("click", (event) => {
    event.stopPropagation();
  });

  document.addEventListener("click", () => {
    profileMenu.classList.add("d-none");
  });
}
