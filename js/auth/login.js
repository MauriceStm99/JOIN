import { loginWithEmail } from "../firebase/firebase.js";
import { createOrUpdateUserProfile } from "../firebase/firebaseUsers.js";
import { editOrAddContact } from "../firebase/firebaseContacts.js";
import { showPopup } from "../ui/feedback.js";
import { GUEST_EMAIL, isGuestEmail } from "../core/utility.js";

const LOCK_ICON = "./assets/logIn&SignUp/lock.svg";
const VISIBILITY_ICON = "./assets/logIn&SignUp/visibility.svg";
const VISIBILITY_OFF_ICON = "./assets/logIn&SignUp/visibility_off.svg";
const GUEST_PASSWORD = "Guest#Join2024!";
const SUMMARY_PAGE = "./pages/app/summaryUser.html";
const EMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const emailInput = document.getElementById("emailInput");
const passwordInput = document.getElementById("passwordInput");
const loginBtn = document.getElementById("loginBtn");
const loginGuest = document.getElementById("guestLoginBtn");
const errorBox = document.getElementById("loginError");
const emailError = document.getElementById("emailError");
const passwordError = document.getElementById("passwordError");
const form = document.querySelector("form");
const passwordIconImg = document.getElementById("passwordIconImg");

/**
 * Checks the format of an email address.
 * @param {string} email - Email address.
 * @returns {boolean} True if the address is valid.
 */
function isValidEmail(email) {
  return EMAIL_PATTERN.test(email) && !email.includes("..");
}

/**
 * Validates the email field and shows an error below it.
 * @returns {boolean} True if the email is valid.
 */
function validateEmailOnBlur() {
  if (!isValidEmail(emailInput.value.trim())) {
    emailError.textContent = "Please enter a valid email address.";
    return false;
  }
  emailError.textContent = "";
  return true;
}

/**
 * Validates the password field and shows an error below it.
 * @returns {boolean} True if the password is long enough.
 */
function validatePasswordOnBlur() {
  if (passwordInput.value.trim().length < 6) {
    passwordError.textContent = "Password must be at least 6 characters.";
    return false;
  }
  passwordError.textContent = "";
  return true;
}

/**
 * Picks the name that is shown for the logged-in user.
 * @param {Object} user - The Firebase user.
 * @param {string} fallbackName - Name used without display name and email.
 * @returns {string} The username.
 */
function getStoredUsername(user, fallbackName) {
  if (user.displayName) return user.displayName;
  if (isGuestEmail(user.email)) return "Guest";
  const email = user.email || "";
  return email.includes("@") ? email.split("@")[0] : fallbackName;
}

/**
 * Stores the logged-in user in localStorage for the other pages.
 * @param {Object} user - The Firebase user.
 * @param {string} [fallbackName] - Name used without display name and email.
 */
function persistCurrentUser(user, fallbackName = "Guest") {
  const currentUser = {
    uid: user.uid,
    email: user.email || "",
    username: getStoredUsername(user, fallbackName),
  };
  localStorage.setItem("currentUser", JSON.stringify(currentUser));
}

/**
 * Logs in with the shared guest account and waits until it has a profile and a contact,
 * otherwise the redirect would cancel these writes.
 * @returns {Promise<Object>} The Firebase user.
 */
async function loginAsGlobalGuest() {
  const user = await loginWithEmail(GUEST_EMAIL, GUEST_PASSWORD);
  await Promise.all([
    createOrUpdateUserProfile(user.uid, "Guest", GUEST_EMAIL).catch(console.error),
    editOrAddContact(user.uid, "Guest", GUEST_EMAIL, "", "#A133FF").catch(console.error),
  ]);
  return user;
}

/**
 * Handles the guest login button.
 * @param {MouseEvent} event - The click event.
 */
async function handleGuestLogin(event) {
  event.preventDefault();
  loginGuest.disabled = true;
  try {
    const user = await loginAsGlobalGuest();
    persistCurrentUser(user, "Guest");
    window.location.href = SUMMARY_PAGE;
  } catch (error) {
    showPopup(error.message || "Guest login failed.");
  } finally {
    loginGuest.disabled = false;
  }
}

/**
 * Shows the eye icon while a password is typed and the lock icon when the field is empty.
 */
function handlePasswordInput() {
  passwordError.textContent = "";
  if (passwordInput.value.length > 0) {
    passwordIconImg.src = VISIBILITY_ICON;
  } else {
    passwordIconImg.src = LOCK_ICON;
    passwordInput.type = "password";
  }
}

/**
 * Shows or hides the password in plain text.
 */
function togglePasswordVisibility() {
  if (passwordInput.type === "password" && passwordInput.value.length > 0) {
    passwordInput.type = "text";
    passwordIconImg.src = VISIBILITY_OFF_ICON;
  } else {
    passwordInput.type = "password";
    passwordIconImg.src = VISIBILITY_ICON;
  }
}

/**
 * Lets keyboard users toggle the password with Enter or Space.
 * @param {KeyboardEvent} event - The keydown event.
 */
function handleIconKeydown(event) {
  if (event.key !== "Enter" && event.key !== " ") return;
  event.preventDefault();
  passwordIconImg.click();
}

/**
 * Removes all error messages of the login form.
 */
function clearLoginErrors() {
  errorBox.textContent = "";
  emailError.textContent = "";
  passwordError.textContent = "";
}

/**
 * Validates the form and logs the user in.
 * @param {MouseEvent} event - The click event.
 */
async function handleLogin(event) {
  event.preventDefault();
  clearLoginErrors();
  if (!validateEmailOnBlur() || !validatePasswordOnBlur()) {
    showPopup("Please check the highlighted login fields.", "info");
    return;
  }
  await loginUser(emailInput.value.trim(), passwordInput.value);
}

/**
 * Logs the user in and opens the summary page.
 * @param {string} email - Email address.
 * @param {string} password - Password.
 */
async function loginUser(email, password) {
  try {
    const user = await loginWithEmail(email, password);
    persistCurrentUser(user, "User");
    window.location.href = SUMMARY_PAGE;
  } catch (error) {
    errorBox.textContent = "Error: " + error.message;
    showPopup(error.message || "Login failed.");
  }
}

/**
 * Sends the form with the login button so Enter works the same way as a click.
 * @param {SubmitEvent} event - The submit event.
 */
function handleFormSubmit(event) {
  event.preventDefault();
  loginBtn?.click();
}

/**
 * Turns off the browser validation and limits the input lengths.
 */
function configureLoginForm() {
  if (form) form.noValidate = true;
  if (emailInput) emailInput.maxLength = 120;
  if (passwordInput) passwordInput.maxLength = 64;
}

/**
 * Connects all inputs and buttons of the login page.
 */
function initLogin() {
  configureLoginForm();
  emailInput?.addEventListener("blur", validateEmailOnBlur);
  passwordInput?.addEventListener("blur", validatePasswordOnBlur);
  emailInput?.addEventListener("input", () => (emailError.textContent = ""));
  loginGuest?.addEventListener("click", handleGuestLogin);
  passwordInput?.addEventListener("input", handlePasswordInput);
  passwordIconImg?.addEventListener("click", togglePasswordVisibility);
  passwordIconImg?.addEventListener("keydown", handleIconKeydown);
  loginBtn?.addEventListener("click", handleLogin);
  form?.addEventListener("submit", handleFormSubmit);
}

initLogin();
