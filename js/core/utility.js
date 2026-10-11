const ALLOWED_COLOR_PATTERNS = [
  /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i,
  /^rgb(a)?\(\s*[\d.%\s,/-]+\)$/i,
  /^hsl(a)?\(\s*[\d.%\s,/-]+\)$/i,
  /^var\(--[a-z0-9-]+\)$/i,
];

export const GUEST_EMAIL = "guest@join-demo.com";

const RANDOM_COLORS = [
  "var(--orange-default)",
  "var(--purpleViolett-default)",
  "var(--skyBlue-default)",
  "var(--pink-default)",
  "var(--yellow-default)",
  "var(--aquamarine-default)",
];

/**
 * Removes all whitespace from a string.
 * @param {string} str - The input string.
 * @returns {string} The string without whitespace.
 */
export function removeWhitespace(str) {
  return str.replace(/\s+/g, "");
}

/**
 * Escapes HTML special characters so a value can be inserted into markup safely.
 * @param {*} value - Any value, null and undefined become an empty string.
 * @returns {string} The escaped string.
 */
export function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Returns the color if it is a valid hex, rgb, hsl or CSS variable value, otherwise the fallback.
 * @param {*} value - The color to check.
 * @param {string} [fallback] - Color used when the value is not allowed.
 * @returns {string} A safe CSS color.
 */
export function sanitizeColor(value, fallback = "var(--mainColor-default)") {
  const color = String(value ?? "").trim();
  return ALLOWED_COLOR_PATTERNS.some((pattern) => pattern.test(color)) ? color : fallback;
}

/**
 * Turns a value into a lowercase token that can be used as part of a CSS class name.
 * @param {*} value - The value to convert.
 * @param {string} [fallback] - Token used when nothing usable is left.
 * @returns {string} The class token.
 */
export function sanitizeClassToken(value, fallback = "default") {
  const token = String(value ?? "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-_]/g, "");
  return token || fallback;
}

/**
 * Checks whether a node lies inside one of the given elements.
 * @param {Node} node - The node to check.
 * @param {(HTMLElement|null)[]} elements - Possible container elements.
 * @returns {boolean} True if one of the elements contains the node.
 */
function isInsideAny(node, elements) {
  return elements.some((element) => element && element.contains(node));
}

/**
 * Calls onClose once as soon as the user clicks outside of the target element.
 * @param {HTMLElement|null} target - Element that counts as inside.
 * @param {Function} onClose - Callback for the outside click.
 * @param {(HTMLElement|null)[]} [ignore] - Elements whose clicks are ignored.
 */
export function initOutsideClickHandler(target, onClose, ignore = []) {
  if (!target) return;
  /**
   * Closes on an outside click and removes itself afterwards.
   * @param {MouseEvent} event - The click event.
   */
  function handleClick(event) {
    if (isInsideAny(event.target, [target, ...ignore])) return;
    onClose?.();
    document.removeEventListener("click", handleClick, true);
  }
  requestAnimationFrame(() => document.addEventListener("click", handleClick, true));
}

/**
 * Calls onClose on the next click outside of the given elements, used by the board dropdowns.
 * @param {(HTMLElement|null)[]} insideElements - Elements that count as inside.
 * @param {Function} onClose - Callback for the outside click.
 */
export function closeOnOutsideClick(insideElements, onClose) {
  /**
   * Closes on an outside click and removes itself afterwards.
   * @param {MouseEvent} event - The click event.
   */
  function handleDocumentClick(event) {
    if (isInsideAny(event.target, insideElements)) return;
    onClose();
    document.removeEventListener("click", handleDocumentClick);
  }
  document.addEventListener("click", handleDocumentClick);
}

/**
 * Selects the whole text of an element, used when inline editing starts.
 * @param {HTMLElement} element - The element whose text is selected.
 */
export function selectElementText(element) {
  const range = document.createRange();
  range.selectNodeContents(element);
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
}

/**
 * Picks one of the predefined contact colors at random.
 * @returns {string} A CSS color variable.
 */
export function getRandomColor() {
  return RANDOM_COLORS[Math.floor(Math.random() * RANDOM_COLORS.length)];
}

/**
 * Builds the initials of a name from its first and last word.
 * @param {string} name - Full name.
 * @returns {string} One or two uppercase letters.
 */
export function getInitials(name) {
  if (!name || typeof name !== "string") return "";
  const names = name.trim().split(/\s+/);
  let initials = names[0].charAt(0).toUpperCase();
  if (names.length > 1) {
    initials += names[names.length - 1].charAt(0).toUpperCase();
  }
  return initials;
}

/**
 * Finds a contact by its id.
 * @param {string} id - Contact id.
 * @param {Object[]} contactsList - All contacts.
 * @returns {Object|undefined} The matching contact.
 */
export function returnContactById(id, contactsList) {
  return contactsList.find((contact) => contact.id === id);
}

/**
 * Reads the logged-in user that was stored in localStorage at login.
 * @returns {Object|null} The stored user or null.
 */
export function getStoredCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem("currentUser"));
  } catch {
    return null;
  }
}

/**
 * Checks whether an email belongs to the shared guest account.
 * @param {string|undefined} email - Email of the logged-in user.
 * @returns {boolean} True for the guest account.
 */
export function isGuestEmail(email) {
  return email === GUEST_EMAIL;
}

/**
 * Finds the position of a task in a list.
 * @param {string} id - Task id.
 * @param {Object[]} tasksList - All tasks.
 * @returns {number} The index or -1.
 */
export function getTaskIndexById(id, tasksList) {
  return tasksList.findIndex((task) => task.id === id);
}

/**
 * Returns all tasks that are assigned to a contact.
 * @param {Object[]} tasksList - All tasks.
 * @param {string} uid - Contact id.
 * @returns {Object[]} The assigned tasks.
 */
export function getAllTasksFromContacts(tasksList, uid) {
  return tasksList.filter((task) => task.assignedTo.includes(uid));
}
