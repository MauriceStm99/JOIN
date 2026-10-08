import { createUser } from "../core/firebase.js";
import { showPopup } from "../ui/feedback.js";

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

function setFieldError(field, message) {
  if (fieldErrors[field]) fieldErrors[field].textContent = message;
}

function clearFieldError(field) {
  if (fieldErrors[field]) fieldErrors[field].textContent = "";
}

function clearAllFieldErrors() {
  Object.keys(fieldErrors).forEach(clearFieldError);
}

const passwordIconImg = passwordInput.nextElementSibling.querySelector("img");
const confirmIconImg = confirmInput.nextElementSibling.querySelector("img");

const lockIcon = "../../assets/LogIn&SignUp/lock.svg";
const visibilityIcon = "../../assets/LogIn&SignUp/visibility.svg";
const visibilityOffIcon = "../../assets/LogIn&SignUp/visibility_off.svg";

if (form) form.noValidate = true;

nameInput.maxLength = 50;
emailInput.maxLength = 120;
passwordInput.maxLength = 64;
confirmInput.maxLength = 64;

signUpBtn.disabled = true;

function checkFormValid() {
  const isValid =
    nameInput.value.trim().length >= 2 &&
    isValidEmail(emailInput.value.trim()) &&
    validatePasswordSilent(passwordInput.value) &&
    confirmInput.value === passwordInput.value &&
    privacyCheck.checked;

  signUpBtn.disabled = !isValid;
}

nameInput.addEventListener("blur", () => {
  if (nameInput.value.trim().length < 2) {
    setFieldError("name", "Please enter your name.");
  } else {
    clearFieldError("name");
  }
});

emailInput.addEventListener("blur", () => {
  if (!isValidEmail(emailInput.value.trim())) {
    setFieldError("email", "Please enter a valid email address.");
  } else {
    clearFieldError("email");
  }
});

passwordInput.addEventListener("blur", () => {
  validatePassword(passwordInput.value);
});

confirmInput.addEventListener("blur", () => {
  if (confirmInput.value !== passwordInput.value) {
    setFieldError("confirm", "Passwords do not match.");
  } else {
    clearFieldError("confirm");
  }
});

nameInput.addEventListener("input", () => {
  clearFieldError("name");
  checkFormValid();
});
emailInput.addEventListener("input", () => {
  clearFieldError("email");
  checkFormValid();
});
passwordInput.addEventListener("input", () => {
  clearFieldError("password");
  checkFormValid();
});
confirmInput.addEventListener("input", () => {
  clearFieldError("confirm");
  checkFormValid();
});
privacyCheck.addEventListener("change", () => {
  clearFieldError("privacy");
  checkFormValid();
});

function setupPasswordToggle(inputEl, iconImg) {
  inputEl.addEventListener("input", () => {
    if (inputEl.value.length > 0) {
      iconImg.src = visibilityIcon;
    } else {
      iconImg.src = lockIcon;
      inputEl.type = "password";
    }
  });

  iconImg.addEventListener("click", () => {
    if (inputEl.value.length === 0) return;

    if (inputEl.type === "password") {
      inputEl.type = "text";
      iconImg.src = visibilityOffIcon;
    } else {
      inputEl.type = "password";
      iconImg.src = visibilityIcon;
    }
  });

  iconImg.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    iconImg.click();
  });
}

setupPasswordToggle(passwordInput, passwordIconImg);
setupPasswordToggle(confirmInput, confirmIconImg);


function isValidEmail(email) {
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email) && !email.includes("..");
}

function validatePasswordSilent(password) {
  if (password.length < 6) return false;
  if (!/[A-Z]/.test(password)) return false;
  if (!/[a-z]/.test(password)) return false;
  if (!/[!@#$%^&*(),.?\":{}|<>]/.test(password)) return false;
  return true;
}

signUpBtn.addEventListener("click", async (event) => {
  event.preventDefault();
  errorBox.textContent = "";
  clearAllFieldErrors();

  if (!validateForm()) {
    showPopup("Please check your sign up data.", "info");
    return;
  }

  try {
    await createUser(
      emailInput.value.trim(),
      passwordInput.value,
      nameInput.value.trim()
    );

    form.reset();
    clearAllFieldErrors();
    checkFormValid();

    showPopup("Registration successful. You can now log in.", "success", 2200);

    setTimeout(() => {
      window.location.href = "../../index.html";
    }, 900);
  } catch (error) {
    errorBox.textContent = error.message;
    showPopup(error.message || "Registration failed.");
  }
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  signUpBtn.click();
});

function validateForm() {
  let valid = true;

  if (nameInput.value.trim().length < 2) {
    setFieldError("name", "Please enter your name.");
    valid = false;
  }

  if (!isValidEmail(emailInput.value.trim())) {
    setFieldError("email", "Please enter a valid email address.");
    valid = false;
  }

  if (!validatePassword(passwordInput.value)) valid = false;

  if (confirmInput.value !== passwordInput.value) {
    setFieldError("confirm", "Passwords do not match.");
    valid = false;
  }

  if (!privacyCheck.checked) {
    setFieldError("privacy", "You must accept the privacy policy.");
    valid = false;
  }

  return valid;
}

function validatePassword(password) {
  if (password.length < 6) {
    setFieldError("password", "Password must be at least 6 characters.");
    return false;
  }

  if (!/[A-Z]/.test(password)) {
    setFieldError("password", "Password must contain a capital letter.");
    return false;
  }

  if (!/[a-z]/.test(password)) {
    setFieldError("password", "Password must contain a lowercase letter.");
    return false;
  }

  if (!/[!@#$%^&*(),.?\":{}|<>]/.test(password)) {
    setFieldError("password", "Password must contain a special character.");
    return false;
  }

  clearFieldError("password");
  return true;
}
