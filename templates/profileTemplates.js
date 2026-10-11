import { escapeHtml, sanitizeColor } from "../js/core/utility.js";

export const profileTemplate = `
<div class="btnList">
    <a href="../app/help.html" class="btnListItem help-menu-item" id="helpMenuBtn">Help</a>
    <button class="btnListItem" id="editProfileBtn">Edit Profile</button>
    <button class="legalNoticeBtn btnListItem" id="legalNoticeBtn">Legal Notice</button>
    <button class="btnListItem" id="privacySettingsBtn">Privacy Settings</button>
    <button class="btnListItem" id="logoutBtn">Logout</button>
</div>
`;

export const profileTemplateSimple = `
<div class="btnList">
    <a href="../app/help.html" class="btnListItem help-menu-item" id="helpMenuBtn">Help</a>
    <button class="legalNoticeBtn btnListItem" id="legalNoticeBtn">Legal Notice</button>
    <button class="btnListItem" id="privacySettingsBtn">Privacy Settings</button>
    <button class="btnListItem" id="logoutBtn">Logout</button>
</div>
`;

/**
 * Renders a round avatar with the initials of a person.
 * @param {string} initials - Initials shown in the avatar.
 * @param {string} color - Background color.
 * @param {string} [addedClass] - Additional CSS class.
 * @returns {string} The avatar HTML.
 */
export function iconTemplate(initials, color, addedClass = "") {
  const safeInitials = escapeHtml(initials);
  const safeColor = sanitizeColor(color);
  return `
    <div class="profileIconContainer ${addedClass}" style="background-color: ${safeColor};">
        ${safeInitials}
    </div>
    `;
}
