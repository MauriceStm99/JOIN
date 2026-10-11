const POPUP_STYLE_ID = "app-popup-styles";
const TOAST_STYLE_ID = "board-toast-styles";
const TOAST_ICON_URL = new URL("../../assets/sideboardAssets/board.svg", import.meta.url).href;

const POPUP_STYLES = `
  dialog.app-popup {
    position: fixed;
    top: 20px;
    right: 20px;
    left: auto;
    bottom: auto;
    margin: 0;
    z-index: 12000;
    width: auto;
    height: auto;
    min-width: 280px;
    max-width: 420px;
    border: none;
    border-radius: 12px;
    padding: 14px 16px;
    color: #fff;
    font-size: 16px;
    line-height: 1.35;
    font-weight: 500;
    box-shadow: 0 10px 24px rgba(0, 0, 0, 0.24);
    opacity: 0;
    transform: translateY(-8px);
    transition: opacity 160ms ease, transform 160ms ease;
  }

  .app-popup.show {
    opacity: 1;
    transform: translateY(0);
  }

  .app-popup.error {
    background: #c62828;
  }

  .app-popup.success {
    background: #2e7d32;
  }

  .app-popup.info {
    background: #2a3647;
  }

  @media (max-width: 600px) {
    dialog.app-popup {
      right: 12px;
      left: 12px;
      top: 12px;
      min-width: auto;
      max-width: none;
    }
  }
`;

const TOAST_STYLES = `
  .board-toast {
    position: fixed;
    left: 50%;
    top: 50%;
    transform: translate(-50%, 150vh);
    background: #2a3647;
    color: #fff;
    padding: 22px 30px;
    border-radius: 20px;
    font-size: 20px;
    font-weight: 500;
    box-shadow: 0 10px 24px rgba(0, 0, 0, 0.24);
    z-index: 13000;
    white-space: nowrap;
    transition: transform 350ms ease-out;
    pointer-events: none;
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .board-toast img {
    width: 28px;
    height: 28px;
  }

  .board-toast.show {
    transform: translate(-50%, -50%);
  }

  @media (max-width: 600px) {
    .board-toast {
      font-size: 17px;
      padding: 18px 24px;
    }
  }
`;

let activePopup = null;
let hideTimeout = null;

/**
 * Adds a style element to the head once.
 * @param {string} id - Id of the style element.
 * @param {string} css - The CSS rules.
 */
function injectStyles(id, css) {
  if (document.getElementById(id)) return;
  const style = document.createElement("style");
  style.id = id;
  style.textContent = css;
  document.head.appendChild(style);
}

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
  injectStyles(TOAST_STYLE_ID, TOAST_STYLES);
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
  injectStyles(POPUP_STYLE_ID, POPUP_STYLES);
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
