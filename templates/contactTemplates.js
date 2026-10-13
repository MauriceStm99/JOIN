import { escapeHtml, sanitizeColor } from "../js/core/utility.js";

export const addContactTemplate = `
<div class="edit-contact-overlay add-contact-overlay">
  <dialog class="edit-contact-container add-contact-container" open aria-label="Add contact">
    <div class="edit-contact-left">
      <img src="../../assets/sideboardAssets/joinLogo.svg" class="logo" alt="Join logo">
      <h2 class="add-contact-title">Add contact</h2>
      <h3 class="add-contact-subtitle">Tasks are better with a team!</h3>
      <div class="blue-line"></div>
    </div>

    <div class="edit-contact-right">
      <button class="close-btn" id="closeAddContactBtn" type="button" aria-label="Close">&times;</button>
      <div class="profile-circle profile-circle-add">
        <img src="../../assets/logIn&SignUp/person1.svg" class="icon-profile" alt="">
      </div>

      <form class="edit-form" novalidate>
        <div class="input-wrapper">
          <input type="text" id="AddContactNameInput" placeholder="Name" maxlength="50" autocomplete="off">
          <span class="icon"><img src="../../assets/logIn&SignUp/person.svg" alt=""></span>
        </div>

        <div class="input-wrapper">
          <input type="text" id="AddContactEmailInput" placeholder="Email" maxlength="120" autocomplete="off" inputmode="email">
          <span class="icon"><img src="../../assets/logIn&SignUp/mail.svg" alt=""></span>
        </div>

        <div class="input-wrapper">
          <input type="text" id="AddContactPhoneNumberInput" placeholder="Phone" maxlength="30" autocomplete="off" inputmode="tel">
          <span class="icon"><img src="../../assets/logIn&SignUp/call.svg" alt=""></span>
        </div>

        <div class="vacation-row">
          <div class="input-wrapper">
            <input type="number" id="AddContactVacationTakenInput" placeholder="Vacation taken" min="0" max="365" inputmode="numeric" aria-label="Vacation days taken">
          </div>
          <div class="input-wrapper">
            <input type="number" id="AddContactVacationTotalInput" placeholder="Vacation total" min="0" max="365" inputmode="numeric" aria-label="Vacation days total">
          </div>
        </div>

        <div class="buttons">
          <button class="delete-btn" id="cancelAddContactBtn" type="button">Cancel &times;</button>
          <button class="save-btn" id="saveContactBtn" type="submit">Create contact &#10003;</button>
        </div>
      </form>
    </div>
  </dialog>
</div>
`;

/**
 * Renders one letter of the contact list with all its contacts.
 * @param {string} letter - Group letter.
 * @param {Object[]} contacts - Contacts of this letter.
 * @returns {string} The group HTML.
 */
export function getContactsGroupTemplate(letter, contacts) {
  return `
    <div class="contacts-letter">${escapeHtml(letter)}</div>
    ${contacts.map(contactItemTemplate).join("")}
  `;
}

/**
 * Renders one contact of the list.
 * @param {Object} contact - The contact including index and initials.
 * @returns {string} The contact HTML.
 */
function contactItemTemplate(contact) {
  return `
        <button class="contact-item" data-contact-id="${escapeHtml(contact._index)}">
          <div class="contact-avatar" style="background-color: ${sanitizeColor(contact.color)}">
            ${escapeHtml(contact.initials)}
          </div>
          <div class="contact-data">
            <span class="contact-name">${escapeHtml(contact.name)}</span>
            <span class="contact-email">${escapeHtml(contact.email)}</span>
          </div>
        </button>
      `;
}

/**
 * Builds the vacation text of the detail view.
 * @param {Object} contact - The contact.
 * @returns {string} For example "3 of 30 taken · 27 remaining".
 */
function getVacationText(contact) {
  const vacationTaken = Number(contact.vacationDaysTaken) || 0;
  const vacationTotal = Number(contact.vacationDaysTotal) || 0;
  if (vacationTotal > 0) {
    const remaining = Math.max(vacationTotal - vacationTaken, 0);
    return `${vacationTaken} of ${vacationTotal} taken &middot; ${remaining} remaining`;
  }
  return vacationTaken > 0 ? `${vacationTaken} taken` : "-";
}

/**
 * Renders the detail view of a contact.
 * @param {Object} contact - The contact.
 * @param {string} color - Avatar color.
 * @returns {string} The detail HTML.
 */
export function getContactDetailsTemplate(contact, color) {
  return `
<div class="contact-details-container" id="contactDetailsContainer">
  ${contactDetailsHeaderTemplate(contact, color)}
  ${contactDetailsBodyTemplate(contact)}
</div>
`;
}

/**
 * Renders avatar, name and buttons of the detail view.
 * @param {Object} contact - The contact.
 * @param {string} color - Avatar color.
 * @returns {string} The header HTML.
 */
function contactDetailsHeaderTemplate(contact, color) {
  return `
  <div class="contact-details-header">
    <div class="contact-avatar-large" id="contactAvatarLarge" style="background-color: ${sanitizeColor(color)}">${escapeHtml(contact.initials)}</div>
    <div class="contact-details-content">
      <h2 class="contact-name-large" id="contactNameLarge">${escapeHtml(contact.name)}</h2>
      ${contactDetailsButtonsTemplate()}
    </div>
  </div>`;
}

/**
 * Renders the edit and delete buttons of the detail view.
 * @returns {string} The buttons HTML.
 */
function contactDetailsButtonsTemplate() {
  return `
      <div class="contact-buttons">
        <button class="edit-contact-btn contact-btn" id="editContactBtn" type="button">
          <img src="../../assets/contacts/editButton.svg" alt="Edit icon" class="edit-icon">
          Edit
        </button>
        <button class="delete-contact-details-btn contact-btn" id="deleteContactDetailsBtn" type="button">
          <img src="../../assets/contacts/deleteButton.svg" alt="Delete icon" class="delete-icon">
          Delete
        </button>
      </div>`;
}

/**
 * Renders email, phone and vacation days of the detail view.
 * @param {Object} contact - The contact.
 * @returns {string} The body HTML.
 */
function contactDetailsBodyTemplate(contact) {
  const safeEmail = escapeHtml(contact.email);
  return `
  <div class="contact-details-body">
    <h3>Contact Information</h3>
    ${contactInfoRowTemplate("Email", `<a href="mailto:${safeEmail}">${safeEmail}</a>`)}
    ${contactInfoRowTemplate("Phone", `<span>${escapeHtml(contact.phoneNumber || "-")}</span>`)}
    ${contactInfoRowTemplate("Vacation days", `<span>${getVacationText(contact)}</span>`)}
  </div>`;
}

/**
 * Renders one labeled value of the detail view.
 * @param {string} label - The label.
 * @param {string} valueHtml - The value as HTML.
 * @returns {string} The row HTML.
 */
function contactInfoRowTemplate(label, valueHtml) {
  return `
    <div>
      <h4>${label}</h4>
      ${valueHtml}
    </div>`;
}

/**
 * Renders the edit contact dialog.
 * @param {string} name - Contact name.
 * @param {string} email - Email address.
 * @param {string} phoneNumber - Phone number.
 * @param {string} uuid - Contact id.
 * @param {string} color - Avatar color.
 * @param {string} initials - Avatar initials.
 * @returns {string} The dialog HTML.
 */
export function editContactTemplate(name, email, phoneNumber, uuid, color, initials) {
  return `
<div class="edit-contact-overlay">
  <dialog class="edit-contact-container add-contact-container" data-contact-id="${escapeHtml(uuid)}" open aria-label="Edit contact">
    ${editContactLeftTemplate()}
    <div class="edit-contact-right">
      <button class="close-btn" id="closeEditContactBtn" type="button" aria-label="Close">&times;</button>
      <div class="profile-circle" style="background-color: ${sanitizeColor(color)}">${escapeHtml(initials)}</div>
      ${editContactFormTemplate(name, email, phoneNumber)}
    </div>
  </dialog>
</div>
`;
}

/**
 * Renders the dark left side of the edit dialog.
 * @returns {string} The HTML.
 */
function editContactLeftTemplate() {
  return `
    <div class="edit-contact-left">
      <img src="../../assets/sideboardAssets/joinLogo.svg" class="logo" alt="Join logo">
      <h2 class="add-contact-title">Edit contact</h2>
      <div class="blue-line"></div>
    </div>`;
}

/**
 * Renders the form of the edit dialog.
 * @param {string} name - Contact name.
 * @param {string} email - Email address.
 * @param {string} phoneNumber - Phone number.
 * @returns {string} The form HTML.
 */
function editContactFormTemplate(name, email, phoneNumber) {
  return `
      <form class="edit-form" novalidate>
        ${contactInputTemplate({ id: "EditContactNameInput", placeholder: "Name", value: name, maxLength: 50, icon: "person.svg" })}
        ${contactInputTemplate({ id: "EditContactEmailInput", placeholder: "Mail", value: email, maxLength: 120, icon: "mail.svg", inputMode: "email" })}
        ${contactInputTemplate({ id: "EditContactPhoneNumberInput", placeholder: "Phone Number", value: phoneNumber, maxLength: 30, icon: "call.svg", inputMode: "tel" })}
        ${vacationRowTemplate("EditContact")}
        <div class="buttons">
          <button class="delete-btn" id="deleteEditContactBtn" type="button">Delete</button>
          <button class="save-btn" id="saveEditContactBtn" type="submit">Save &#10003;</button>
        </div>
      </form>`;
}

/**
 * Renders a text field with its icon.
 * @param {Object} field - id, placeholder, value, maxLength, icon file and optional inputMode.
 * @returns {string} The field HTML.
 */
function contactInputTemplate({ id, placeholder, value, maxLength, icon, inputMode }) {
  return `
        <div class="input-wrapper">
          <input type="text" id="${id}" placeholder="${placeholder}" value="${escapeHtml(value)}" maxlength="${maxLength}" autocomplete="off"${inputMode ? ` inputmode="${inputMode}"` : ""}>
          <span class="icon"><img src="../../assets/logIn&SignUp/${icon}" alt=""></span>
        </div>`;
}

/**
 * Renders the two vacation day fields.
 * @param {string} idPrefix - "AddContact" or "EditContact".
 * @returns {string} The fields HTML.
 */
function vacationRowTemplate(idPrefix) {
  return `
        <div class="vacation-row">
          <div class="input-wrapper">
            <input type="number" id="${idPrefix}VacationTakenInput" placeholder="Vacation taken" min="0" max="365" inputmode="numeric" aria-label="Vacation days taken">
          </div>
          <div class="input-wrapper">
            <input type="number" id="${idPrefix}VacationTotalInput" placeholder="Vacation total" min="0" max="365" inputmode="numeric" aria-label="Vacation days total">
          </div>
        </div>`;
}
