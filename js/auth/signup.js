import { createUser } from "../firebase/firebaseUsers.js";
import { showPopup } from "../ui/feedback.js";

const LOCK_ICON = "../../assets/logIn&SignUp/lock.svg";
const VISIBILITY_ICON = "../../assets/logIn&SignUp/visibility.svg";
const VISIBILITY_OFF_ICON = "../../assets/logIn&SignUp/visibility_off.svg";
const EMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const PASSWORD_RULES = [
  { pattern: /^[\s\S]{6,}$/, message: "Password must be at least 6 characters." },
  { pattern: /[a-z]/, message: "Password must contain a lowercase letter." },
];

const form = document.querySelector("form");
const signUpBtn = document.getElementById("signUpBtn");
const nameInput = document.getElementById("nameInput");
const emailInput = document.getElementById("emailInput");
const passwordInput = document.getElementById("passwordInput");
const confirmInput = document.getElementById("confirmInput");
const privacyCheck = document.getElementById("privacyCheck");
const errorBox = document.getElementById("loginError");

const fieldErrors = {
  name: document.getElementById("nameError"),
  email: document.getElementById("emailError"),
  password: document.getElementById("passwordError"),
  confirm: document.getElementById("confirmError"),
  privacy: document.getElementById("privacyError"),
};

/**
 * Shows an error message below a field.
 * @param {string} field - Key of the field in fieldErrors.
 * @param {string} message - The error message.
 */
function setFieldError(field, message) {
  if (fieldErrors[field]) fieldErrors[field].textContent = message;
}

/**
 * Removes the error message below a field.
 * @param {string} field - Key of the field in fieldErrors.
 */
function clearFieldError(field) {
  if (fieldErrors[field]) fieldErrors[field].textContent = "";
}

/**
 * Removes the error messages of all fields.
 */
function clearAllFieldErrors() {
  Object.keys(fieldErrors).forEach(clearFieldError);
}

/**
 * Checks the format of an email address.
 * @param {string} email - Email address.
 * @returns {boolean} True if the address is valid.
 */
function isValidEmail(email) {
  return EMAIL_PATTERN.test(email) && !email.includes("..");
}

/**
 * Returns the message of the first password rule that is not met.
 * @param {string} password - The password.
 * @returns {string} The error message or an empty string.
 */
function getPasswordError(password) {
  return PASSWORD_RULES.find((rule) => !rule.pattern.test(password))?.message || "";
}

/**
 * Checks the password rules and shows the first unmet rule below the field.
 * @param {string} password - The password.
 * @returns {boolean} True if all rules are met.
 */
function validatePassword(password) {
  const error = getPasswordError(password);
  if (error) {
    setFieldError("password", error);
  } else {
    clearFieldError("password");
  }
  return !error;
}

/**
 * Validates the name field.
 * @returns {boolean} True if the name has at least two characters.
 */
function validateNameField() {
  const valid = nameInput.value.trim().length >= 2;
  if (valid) {
    clearFieldError("name");
  } else {
    setFieldError("name", "Please enter your name.");
  }
  return valid;
}

/**
 * Validates the email field.
 * @returns {boolean} True if the email is valid.
 */
function validateEmailField() {
  const valid = isValidEmail(emailInput.value.trim());
  if (valid) {
    clearFieldError("email");
  } else {
    setFieldError("email", "Please enter a valid email address.");
  }
  return valid;
}

/**
 * Validates that both passwords match.
 * @returns {boolean} True if they match.
 */
function validateConfirmField() {
  const valid = confirmInput.value === passwordInput.value;
  if (valid) {
    clearFieldError("confirm");
  } else {
    setFieldError("confirm", "Passwords do not match.");
  }
  return valid;
}

/**
 * Validates that the privacy policy was accepted.
 * @returns {boolean} True if the checkbox is checked.
 */
function validatePrivacyField() {
  if (!privacyCheck.checked) {
    setFieldError("privacy", "You must accept the privacy policy.");
  }
  return privacyCheck.checked;
}

/**
 * Validates every field and shows all errors at once.
 * @returns {boolean} True if the whole form is valid.
 */
function validateForm() {
  return [
    validateNameField(),
    validateEmailField(),
    validatePassword(passwordInput.value),
    validateConfirmField(),
    validatePrivacyField(),
  ].every(Boolean);
}

/**
 * Clears the error of a field whenever the field changes.
 * @param {HTMLInputElement} input - The field.
 * @param {string} field - Key of the field in fieldErrors.
 * @param {string} [eventName] - Event that marks a change.
 */
function watchField(input, field, eventName = "input") {
  input.addEventListener(eventName, () => clearFieldError(field));
}

/**
 * Returns the eye icon that belongs to a password field.
 * @param {HTMLInputElement} inputEl - The password field.
 * @returns {HTMLImageElement} The icon.
 */
function getToggleIcon(inputEl) {
  return inputEl.nextElementSibling.querySelector("img");
}

/**
 * Shows the eye icon while a password is typed and the lock icon when the field is empty.
 * @param {HTMLInputElement} inputEl - The password field.
 * @param {HTMLImageElement} iconImg - Its icon.
 */
function updateToggleIcon(inputEl, iconImg) {
  if (inputEl.value.length > 0) {
    iconImg.src = VISIBILITY_ICON;
  } else {
    iconImg.src = LOCK_ICON;
    inputEl.type = "password";
  }
}

/**
 * Shows or hides the password in plain text.
 * @param {HTMLInputElement} inputEl - The password field.
 * @param {HTMLImageElement} iconImg - Its icon.
 */
function togglePasswordVisibility(inputEl, iconImg) {
  if (inputEl.value.length === 0) return;
  if (inputEl.type === "password") {
    inputEl.type = "text";
    iconImg.src = VISIBILITY_OFF_ICON;
  } else {
    inputEl.type = "password";
    iconImg.src = VISIBILITY_ICON;
  }
}

/**
 * Lets keyboard users toggle the password with Enter or Space.
 * @param {KeyboardEvent} event - The keydown event.
 * @param {HTMLImageElement} iconImg - The icon to click.
 */
function handleIconKeydown(event, iconImg) {
  if (event.key !== "Enter" && event.key !== " ") return;
  event.preventDefault();
  iconImg.click();
}

/**
 * Connects the eye icon of a password field.
 * @param {HTMLInputElement} inputEl - The password field.
 * @param {HTMLImageElement} iconImg - Its icon.
 */
function setupPasswordToggle(inputEl, iconImg) {
  inputEl.addEventListener("input", () => updateToggleIcon(inputEl, iconImg));
  iconImg.addEventListener("click", () => togglePasswordVisibility(inputEl, iconImg));
  iconImg.addEventListener("keydown", (event) => handleIconKeydown(event, iconImg));
}

/**
 * Validates the form and registers the user.
 * @param {MouseEvent} event - The click event.
 */
async function handleSignUp(event) {
  event.preventDefault();
  errorBox.textContent = "";
  clearAllFieldErrors();
  if (!validateForm()) {
    showPopup("Please check your sign up data.", "info");
    return;
  }
  await registerUser();
}

/**
 * Shows the loading state on the sign up button and blocks further clicks.
 * @param {boolean} isLoading - True while the account is being created.
 */
function setSignUpLoading(isLoading) {
  signUpBtn.disabled = isLoading;
  signUpBtn.textContent = isLoading ? "Loading" : "Sign up";
}

/**
 * Creates the account and shows the result.
 */
async function registerUser() {
  setSignUpLoading(true);
  try {
    await createUser(emailInput.value.trim(), passwordInput.value, nameInput.value.trim());
    finishRegistration();
  } catch (error) {
    setSignUpLoading(false);
    errorBox.textContent = error.message;
    showPopup(error.message || "Registration failed.");
  }
}

/**
 * Resets the form, confirms the registration and returns to the login page.
 */
function finishRegistration() {
  form.reset();
  clearAllFieldErrors();
  showPopup("Registration successful. You can now log in.", "success", 2200);
  setTimeout(() => {
    window.location.href = "../../index.html";
  }, 900);
}

/**
 * Turns off the browser validation and limits the input lengths.
 */
function configureSignupForm() {
  if (form) form.noValidate = true;
  nameInput.maxLength = 50;
  emailInput.maxLength = 120;
  passwordInput.maxLength = 64;
  confirmInput.maxLength = 64;
}

/**
 * Validates the fields when they lose focus and clears their error on every change.
 */
function initFieldValidation() {
  nameInput.addEventListener("blur", validateNameField);
  emailInput.addEventListener("blur", validateEmailField);
  passwordInput.addEventListener("blur", () => validatePassword(passwordInput.value));
  confirmInput.addEventListener("blur", validateConfirmField);
  watchField(nameInput, "name");
  watchField(emailInput, "email");
  watchField(passwordInput, "password");
  watchField(confirmInput, "confirm");
  watchField(privacyCheck, "privacy", "change");
}

/**
 * Resets the button when the browser restores this page from its back/forward cache.
 * @param {PageTransitionEvent} event - The pageshow event.
 */
function handlePageShow(event) {
  if (event.persisted) setSignUpLoading(false);
}

/**
 * Connects all inputs and buttons of the sign up page.
 */
function initSignup() {
  configureSignupForm();
  initFieldValidation();
  setupPasswordToggle(passwordInput, getToggleIcon(passwordInput));
  setupPasswordToggle(confirmInput, getToggleIcon(confirmInput));
  signUpBtn.addEventListener("click", handleSignUp);
  window.addEventListener("pageshow", handlePageShow);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    signUpBtn.click();
  });
}

document.addEventListener("DOMContentLoaded", initSignup);
