import { profileTemplate, profileTemplateSimple } from "../../templates/profileTemplates.js";
import { logout } from "../firebase/firebase.js";

const SIMPLE_PROFILE_PAGES = [
  "addTask.html",
  "board.html",
  "summaryUser.html",
  "privacyPolicyInt.html",
  "legalNoticeInt.html",
  "help.html",
];

const INTERNAL_PAGES = [
  "summaryUser.html",
  "addTask.html",
  "board.html",
  "contacts.html",
  "help.html",
  "privacyPolicyInt.html",
  "legalNoticeInt.html",
];

const profileBtn = document.getElementById("userProfileInitialsBtn");
const profileMenu = document.getElementById("profileShowMore");

/**
 * Returns the file name of the current page.
 * @returns {string} For example "board.html".
 */
function getCurrentPageName() {
  return window.location.pathname.split("/").pop();
}

/**
 * Checks whether the current page shows the short profile menu without "Edit Profile".
 * @returns {boolean} True for pages with the short menu.
 */
function isSimpleProfilePage() {
  return SIMPLE_PROFILE_PAGES.some((page) => window.location.pathname.endsWith(page));
}

/**
 * Collects all back arrows of the page.
 * @returns {HTMLElement[]} The back buttons.
 */
function getBackButtons() {
  return [
    ...document.querySelectorAll("#backBtn"),
    ...document.querySelectorAll(".h1-arrow"),
    ...document.querySelectorAll(".back-btn"),
  ];
}

/**
 * Connects all back arrows with the back navigation.
 */
function initBackButtons() {
  getBackButtons().forEach((target) => target.addEventListener("click", handleBackClick));
}

/**
 * Goes back in the history if the user came from an internal page, otherwise to a fallback page.
 * @param {MouseEvent} event - The click event.
 */
function handleBackClick(event) {
  event.preventDefault();
  if (canGoBack()) {
    window.history.back();
  } else {
    window.location.href = getBackFallbackTarget();
  }
}

/**
 * Returns the page the back arrow leads to when there is no internal history.
 * @returns {string} Summary for internal pages, login otherwise.
 */
function getBackFallbackTarget() {
  return INTERNAL_PAGES.includes(getCurrentPageName()) ? "../app/summaryUser.html" : "../../index.html";
}

/**
 * Returns the file name of the page the user came from.
 * @returns {string} The file name or an empty string.
 */
function getReferrerPageName() {
  return document.referrer ? new URL(document.referrer).pathname.split("/").pop() : "";
}

/**
 * Checks whether the previous page was another internal page.
 * @returns {boolean} True if history.back() leads to an internal page.
 */
function canGoBack() {
  if (!document.referrer || document.referrer === window.location.href) return false;
  return INTERNAL_PAGES.includes(getReferrerPageName());
}

/**
 * Marks the link of the current page in the mobile navigation.
 */
function highlightActiveMobileNav() {
  const currentPage = getCurrentPageName() || "summaryUser.html";
  document.querySelectorAll(".mobile-nav a").forEach((link) => markIfActive(link, currentPage));
}

/**
 * Adds the active class to a navigation link if it points to the current page.
 * @param {HTMLAnchorElement} link - Navigation link.
 * @param {string} currentPage - File name of the current page.
 */
function markIfActive(link, currentPage) {
  const linkPage = link.getAttribute("href")?.split("/").pop();
  if (linkPage && linkPage === currentPage) {
    link.classList.add("mobile-active");
  }
}

/**
 * Opens another page.
 * @param {string} url - Target page.
 */
function navigateTo(url) {
  window.location.href = url;
}

/**
 * Logs the user out and returns to the login page.
 */
function logoutAndRedirect() {
  logout().then(() => navigateTo("../../index.html"));
}

/**
 * Opens or closes the profile menu.
 * @param {MouseEvent} event - The click event.
 */
function toggleProfileMenu(event) {
  event.stopPropagation();
  profileMenu.classList.toggle("d-none");
}

/**
 * Connects the buttons inside the profile menu.
 */
function initProfileMenuButtons() {
  profileMenu.querySelector("#logoutBtn")?.addEventListener("click", logoutAndRedirect);
  profileMenu.querySelector("#privacySettingsBtn")?.addEventListener("click", () => navigateTo("../legal/privacyPolicyInt.html"));
  profileMenu.querySelector("#legalNoticeBtn")?.addEventListener("click", () => navigateTo("../legal/legalNoticeInt.html"));
}

/**
 * Renders the profile menu and closes it on clicks outside of it.
 */
function initProfileMenu() {
  if (!profileBtn || !profileMenu) return;
  profileMenu.innerHTML = isSimpleProfilePage() ? profileTemplateSimple : profileTemplate;
  initProfileMenuButtons();
  profileBtn.addEventListener("click", toggleProfileMenu);
  profileMenu.addEventListener("click", (event) => event.stopPropagation());
  document.addEventListener("click", () => profileMenu.classList.add("d-none"));
}

initBackButtons();
highlightActiveMobileNav();
initProfileMenu();
