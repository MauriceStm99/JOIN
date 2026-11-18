/** Latest selectable date, it limits the year of the date field to four digits. */
export const MAX_DUE_DATE = "9999-12-31";

const DUE_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Formats a date as YYYY-MM-DD in local time.
 * @param {Date} date - The date.
 * @returns {string} The formatted date.
 */
function toISODate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Returns today as YYYY-MM-DD in local time.
 * @returns {string} The date.
 */
export function getTodayISO() {
  return toISODate(new Date());
}

/**
 * Sets the earliest and latest selectable date of a date field.
 * @param {HTMLInputElement|null} dateInput - The date field.
 * @param {string} [minISO] - Earliest date, today by default.
 */
export function applyDueDateRange(dateInput, minISO = getTodayISO()) {
  if (!dateInput) return;
  dateInput.min = minISO;
  dateInput.max = MAX_DUE_DATE;
}

/**
 * Checks that a due date has a four-digit year and is not before the earliest date.
 * @param {string} dueDate - The due date as YYYY-MM-DD, it must not be empty.
 * @param {string} [minISO] - Earliest allowed date, today by default.
 * @returns {string} The error message, empty if the due date is valid.
 */
export function getDueDateError(dueDate, minISO = getTodayISO()) {
  if (!DUE_DATE_PATTERN.test(dueDate)) return "Please enter a four-digit year.";
  if (dueDate < minISO) return "The due date cannot be in the past.";
  return "";
}
