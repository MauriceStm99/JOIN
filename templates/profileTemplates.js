import { escapeHtml, sanitizeColor } from "../js/utility.js";

export var profileTemplate = `
<div class="btnList">
    <a href="help.html" class="btnListItem help-menu-item" id="helpMenuBtn">Help</a>
    <button class="btnListItem" id="editProfileBtn">Edit Profile</button>
    <button class="legalNoticeBtn btnListItem" id="legalNoticeBtn">Legal Notice</button>
    <button class="btnListItem" id="privacySettingsBtn">Privacy Settings</button>
    <button class="btnListItem" id="logoutBtn">Logout</button>
</div>
`;

export var profileTemplateSimple = `
<div class="btnList">
    <a href="help.html" class="btnListItem help-menu-item" id="helpMenuBtn">Help</a>
    <button class="legalNoticeBtn btnListItem" id="legalNoticeBtn">Legal Notice</button>
    <button class="btnListItem" id="privacySettingsBtn">Privacy Settings</button>
    <button class="btnListItem" id="logoutBtn">Logout</button>
</div>
`;

export function iconTemplate(initials,color,addedClass="") {
    const safeInitials = escapeHtml(initials);
    const safeColor = sanitizeColor(color);
    return `
    <div class="profileIconContainer ${addedClass}" style="background-color: ${safeColor};">
        ${safeInitials}
    </div>
    `;
}



