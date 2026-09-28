import { showPopup } from "./feedback.js";

export function isValidEmail(email) {
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email) && !email.includes("..");
}

export function configureContactFormValidation(nameInput, emailInput, phoneInput) {
  if (!nameInput || !emailInput || !phoneInput) return;

  nameInput.maxLength = 50;
  emailInput.maxLength = 120;
  phoneInput.maxLength = 30;

  phoneInput.addEventListener("input", () => {
    const cleaned = phoneInput.value.replace(/[^0-9+\-()/ ]/g, "");
    if (cleaned !== phoneInput.value) phoneInput.value = cleaned;
  });

  const touched = new WeakSet();
  [nameInput, emailInput].forEach((input) => {
    input.addEventListener("input", () => touched.add(input));
  });

  nameInput.addEventListener("blur", () => {
    if (nameInput.value.trim().length >= 2) {
      nameInput.style.borderColor = "";
      return;
    }

    if (!touched.has(nameInput) && nameInput.value.trim().length === 0) return;

    nameInput.style.borderColor = "red";
    showPopup("Please enter a contact name.", "info");
  });

  emailInput.addEventListener("blur", () => {
    if (isValidEmail(emailInput.value.trim())) {
      emailInput.style.borderColor = "";
      return;
    }

    if (!touched.has(emailInput) && emailInput.value.trim().length === 0) return;

    emailInput.style.borderColor = "red";
    showPopup("Please enter a valid email address.", "info");
  });

  phoneInput.addEventListener("blur", () => {
    const phone = phoneInput.value.trim();
    if (phone.length === 0 || phone.length >= 5) {
      phoneInput.style.borderColor = "";
      return;
    }

    phoneInput.style.borderColor = "red";
    showPopup("Phone number is too short.", "info");
  });
}

export function getAddContactFormValues() {
  const name = document.getElementById("AddContactNameInput")?.value.trim() || "";
  const email = document.getElementById("AddContactEmailInput")?.value.trim() || "";
  const phoneNumber = document.getElementById("AddContactPhoneNumberInput")?.value.trim() || "";
  const vacationDaysTaken = readVacationDaysInput("AddContactVacationTakenInput");
  const vacationDaysTotal = readVacationDaysInput("AddContactVacationTotalInput");

  return { name, email, phoneNumber, vacationDaysTaken, vacationDaysTotal };
}

export function readVacationDaysInput(id) {
  const raw = document.getElementById(id)?.value.trim() || "";
  const parsed = Number.parseInt(raw, 10);
  if (Number.isNaN(parsed)) return 0;
  return Math.min(Math.max(parsed, 0), 365);
}
