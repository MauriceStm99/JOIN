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
        <img src="../../assets/LogIn&SignUp/person1.svg" class="icon-profile" alt="">
      </div>

      <form class="edit-form" novalidate>
        <div class="input-wrapper">
          <input type="text" id="AddContactNameInput" placeholder="Name" maxlength="50" autocomplete="off">
          <span class="icon"><img src="../../assets/LogIn&SignUp/person.svg" alt=""></span>
        </div>

        <div class="input-wrapper">
          <input type="text" id="AddContactEmailInput" placeholder="Email" maxlength="120" autocomplete="off" inputmode="email">
          <span class="icon"><img src="../../assets/LogIn&SignUp/mail.svg" alt=""></span>
        </div>

        <div class="input-wrapper">
          <input type="text" id="AddContactPhoneNumberInput" placeholder="Phone" maxlength="30" autocomplete="off" inputmode="tel">
          <span class="icon"><img src="../../assets/LogIn&SignUp/call.svg" alt=""></span>
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

export function getContactsGroupTemplate(letter, contacts) {
  const itemsHTML = contacts
    .map((contact) => {
      const safeId = escapeHtml(contact._index);
      const safeColor = sanitizeColor(contact.color);
      const safeInitials = escapeHtml(contact.initials);
      const safeName = escapeHtml(contact.name);
      const safeEmail = escapeHtml(contact.email);

      return `
        <button class="contact-item" data-contact-id="${safeId}">
          <div class="contact-avatar" style="background-color: ${safeColor}">
            ${safeInitials}
          </div>

          <div class="contact-data">
            <span class="contact-name">${safeName}</span>
            <span class="contact-email">${safeEmail}</span>
          </div>
        </button>
      `;
    })
    .join("");

  return `
    <div class="contacts-letter">${escapeHtml(letter)}</div>
    ${itemsHTML}
  `;
}

export function getContactDetailsTemplate(contact, color) {
  const safeColor = sanitizeColor(color);
  const safeInitials = escapeHtml(contact.initials);
  const safeName = escapeHtml(contact.name);
  const safeEmail = escapeHtml(contact.email);
  const safePhone = escapeHtml(contact.phoneNumber || "-");
  const vacationTaken = Number(contact.vacationDaysTaken) || 0;
  const vacationTotal = Number(contact.vacationDaysTotal) || 0;

  let vacationText = "-";
  if (vacationTotal > 0) {
    vacationText = `${vacationTaken} of ${vacationTotal} taken &middot; ${Math.max(vacationTotal - vacationTaken, 0)} remaining`;
  } else if (vacationTaken > 0) {
    vacationText = `${vacationTaken} taken`;
  }

  return `
<div class="contact-details-container" id="contactDetailsContainer">
  <div class="contact-details-header">
    <div class="contact-avatar-large" id="contactAvatarLarge" style="background-color: ${safeColor}">${safeInitials}</div>
    <div class="contact-details-content">
      <h2 class="contact-name-large" id="contactNameLarge">${safeName}</h2>
      <div class="contact-buttons">
        <button class="edit-contact-btn contact-btn" id="editContactBtn" type="button">
          <img src="../../assets/contacts/editButton.svg" alt="Edit icon" class="edit-icon">
          Edit
        </button>
        <button class="delete-contact-details-btn contact-btn" id="deleteContactDetailsBtn" type="button">
          <img src="../../assets/contacts/deleteButton.svg" alt="Delete icon" class="delete-icon">
          Delete
        </button>
      </div>
    </div>
  </div>

  <div class="contact-details-body">
    <h3>Contact Information</h3>
    <div>
      <h4>Email</h4>
      <a href="mailto:${safeEmail}">${safeEmail}</a>
    </div>
    <div>
      <h4>Phone</h4>
      <span>${safePhone}</span>
    </div>
    <div>
      <h4>Vacation days</h4>
      <span>${vacationText}</span>
    </div>
  </div>
</div>
`;
}

export function editContactTemplate(name, email, phoneNumber, uuid, color, initials) {
  const safeUuid = escapeHtml(uuid);
  const safeColor = sanitizeColor(color);
  const safeInitials = escapeHtml(initials);
  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safePhone = escapeHtml(phoneNumber);

  return `
<div class="edit-contact-overlay">
  <dialog class="edit-contact-container add-contact-container" data-contact-id="${safeUuid}" open aria-label="Edit contact">
    <div class="edit-contact-left">
      <img src="../../assets/sideboardAssets/joinLogo.svg" class="logo" alt="Join logo">
      <h2 class="add-contact-title">Edit contact</h2>
      <div class="blue-line"></div>
    </div>

    <div class="edit-contact-right">
      <button class="close-btn" id="closeEditContactBtn" type="button" aria-label="Close">&times;</button>
      <div class="profile-circle" style="background-color: ${safeColor}">${safeInitials}</div>

      <form class="edit-form" novalidate>
        <div class="input-wrapper">
          <input type="text" id="EditContactNameInput" placeholder="Name" value="${safeName}" maxlength="50" autocomplete="off">
          <span class="icon"><img src="../../assets/LogIn&SignUp/person.svg" alt=""></span>
        </div>

        <div class="input-wrapper">
          <input type="text" id="EditContactEmailInput" placeholder="Mail" value="${safeEmail}" maxlength="120" autocomplete="off" inputmode="email">
          <span class="icon"><img src="../../assets/LogIn&SignUp/mail.svg" alt=""></span>
        </div>

        <div class="input-wrapper">
          <input type="text" id="EditContactPhoneNumberInput" placeholder="Phone Number" value="${safePhone}" maxlength="30" autocomplete="off" inputmode="tel">
          <span class="icon"><img src="../../assets/LogIn&SignUp/call.svg" alt=""></span>
        </div>

        <div class="vacation-row">
          <div class="input-wrapper">
            <input type="number" id="EditContactVacationTakenInput" placeholder="Vacation taken" min="0" max="365" inputmode="numeric" aria-label="Vacation days taken">
          </div>
          <div class="input-wrapper">
            <input type="number" id="EditContactVacationTotalInput" placeholder="Vacation total" min="0" max="365" inputmode="numeric" aria-label="Vacation days total">
          </div>
        </div>

        <div class="buttons">
          <button class="delete-btn" id="deleteEditContactBtn" type="button">Delete</button>
          <button class="save-btn" id="saveEditContactBtn" type="submit">Save &#10003;</button>
        </div>
      </form>
    </div>
  </dialog>
</div>
`;
}
