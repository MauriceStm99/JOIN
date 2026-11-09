import { showPopup } from "../ui/feedback.js";

const EMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const INVALID_PHONE_CHARACTERS = /[^0-9+\-()/ ]/g;
const MIN_PHONE_LENGTH = 5;

/**
 * Checks the format of an email address.
 * @param {string} email - Email address.
 * @returns {boolean} True if the address is valid.
 */
export function isValidEmail(email) {
  return EMAIL_PATTERN.test(email) && !email.includes("..");
}

/**
 * Limits the input lengths of the contact form and validates the fields on blur.
 * @param {HTMLInputElement|null} nameInput - Name field.
 * @param {HTMLInputElement|null} emailInput - Email field.
 * @param {HTMLInputElement|null} phoneInput - Phone field.
 */
export function configureContactFormValidation(nameInput, emailInput, phoneInput) {
  if (!nameInput || !emailInput || !phoneInput) return;
  nameInput.maxLength = 50;
  emailInput.maxLength = 120;
  phoneInput.maxLength = 30;
  phoneInput.addEventListener("input", () => removeInvalidPhoneCharacters(phoneInput));
  const touched = new WeakSet();
  [nameInput, emailInput].forEach((input) => input.addEventListener("input", () => touched.add(input)));
  nameInput.addEventListener("blur", () => validateNameOnBlur(nameInput, touched));
  emailInput.addEventListener("blur", () => validateEmailOnBlur(emailInput, touched));
  phoneInput.addEventListener("blur", () => validatePhoneOnBlur(phoneInput));
}

/**
 * Removes every character from the phone field that is not allowed in a phone number.
 * @param {HTMLInputElement} phoneInput - Phone field.
 */
function removeInvalidPhoneCharacters(phoneInput) {
  const cleaned = phoneInput.value.replace(INVALID_PHONE_CHARACTERS, "");
  if (cleaned !== phoneInput.value) phoneInput.value = cleaned;
}

/**
 * Marks a field red and shows a message, an untouched empty field stays neutral.
 * @param {HTMLInputElement} input - The field.
 * @param {WeakSet} touched - Fields the user has typed in.
 * @param {boolean} isValid - Result of the validation.
 * @param {string} message - Message for an invalid value.
 */
function markInputOnBlur(input, touched, isValid, message) {
  if (isValid) {
    input.style.borderColor = "";
    return;
  }
  if (!touched.has(input) && input.value.trim().length === 0) return;
  input.style.borderColor = "red";
  showPopup(message, "info");
}

/**
 * Validates the name field when it loses focus.
 * @param {HTMLInputElement} nameInput - Name field.
 * @param {WeakSet} touched - Fields the user has typed in.
 */
function validateNameOnBlur(nameInput, touched) {
  const isValid = nameInput.value.trim().length >= 2;
  markInputOnBlur(nameInput, touched, isValid, "Please enter a contact name.");
}

/**
 * Validates the email field when it loses focus.
 * @param {HTMLInputElement} emailInput - Email field.
 * @param {WeakSet} touched - Fields the user has typed in.
 */
function validateEmailOnBlur(emailInput, touched) {
  const isValid = isValidEmail(emailInput.value.trim());
  markInputOnBlur(emailInput, touched, isValid, "Please enter a valid email address.");
}

/**
 * Validates the phone field when it loses focus, an empty phone number is allowed.
 * @param {HTMLInputElement} phoneInput - Phone field.
 */
function validatePhoneOnBlur(phoneInput) {
  const phone = phoneInput.value.trim();
  if (phone.length === 0 || phone.length >= MIN_PHONE_LENGTH) {
    phoneInput.style.borderColor = "";
    return;
  }
  phoneInput.style.borderColor = "red";
  showPopup("Phone number is too short.", "info");
}

/**
 * Reads all values of the add contact form.
 * @returns {Object} Name, email and phone number.
 */
export function getAddContactFormValues() {
  const name = document.getElementById("AddContactNameInput")?.value.trim() || "";
  const email = document.getElementById("AddContactEmailInput")?.value.trim() || "";
  const phoneNumber = document.getElementById("AddContactPhoneNumberInput")?.value.trim() || "";
  return { name, email, phoneNumber };
}
