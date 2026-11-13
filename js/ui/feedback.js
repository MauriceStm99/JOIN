// The styles of the popup and the toast are in styles/feedback.css.
const TOAST_ICON_URL = new URL("../../assets/sideboardAssets/board.svg", import.meta.url).href;

let activePopup = null;
let hideTimeout = null;

/**
 * Removes the popup that is currently shown.
 */
function clearPopup() {
  activePopup?.remove();
  activePopup = null;
}

/**
 * Creates the toast element with its text and board icon.
 * @param {string} message - Text of the toast.
 * @returns {HTMLDivElement} The toast element.
 */
function createBoardToast(message) {
  const toast = document.createElement("div");
  toast.className = "board-toast";
  toast.setAttribute("role", "status");
  const label = document.createElement("span");
  label.textContent = message;
  const icon = document.createElement("img");
  icon.src = TOAST_ICON_URL;
  icon.alt = "";
  toast.append(label, icon);
  return toast;
}

/**
 * Shows a toast in the middle of the screen, used after a task was added.
 * @param {string} [message] - Text of the toast.
 * @param {number} [duration] - Time in milliseconds before it disappears.
 */
export function showBoardToast(message = "Task added to board", duration = 1000) {
  const toast = createBoardToast(message);
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add("show"));
  setTimeout(() => toast.remove(), duration + 400);
}

/**
 * Creates the popup dialog element.
 * @param {string} message - Text of the popup.
 * @param {string} type - error, success or info.
 * @returns {HTMLDialogElement} The popup element.
 */
function createPopup(message, type) {
  const popup = document.createElement("dialog");
  popup.className = `app-popup ${type}`;
  popup.setAttribute("role", "alert");
  popup.textContent = String(message);
  return popup;
}

/**
 * Shows a message in the top right corner, only one popup is visible at a time.
 * @param {string} message - Text of the popup.
 * @param {string} [type] - error, success or info.
 * @param {number} [duration] - Time in milliseconds before it disappears.
 */
export function showPopup(message, type = "error", duration = 3200) {
  if (!message) return;
  clearTimeout(hideTimeout);
  clearPopup();
  const popup = createPopup(message, type);
  document.body.appendChild(popup);
  activePopup = popup;
  popup.setAttribute("open", "");
  requestAnimationFrame(() => popup.classList.add("show"));
  hideTimeout = setTimeout(() => hidePopup(popup), duration);
}

/**
 * Fades the popup out and removes it after the transition.
 * @param {HTMLDialogElement} popup - The popup to hide.
 */
function hidePopup(popup) {
  popup.classList.remove("show");
  setTimeout(() => removePopup(popup), 180);
}

/**
 * Removes a popup from the page.
 * @param {HTMLDialogElement} popup - The popup to remove.
 */
function removePopup(popup) {
  if (activePopup === popup) clearPopup();
  else popup.remove();
}
