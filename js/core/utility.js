export function removeWhitespace(str) {
  return str.replace(/\s+/g, '');
}

export function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function sanitizeColor(value, fallback = "var(--mainColor-default)") {
  const color = String(value ?? "").trim();
  const allowedPatterns = [
    /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i,
    /^rgb(a)?\(\s*[\d.%\s,/-]+\)$/i,
    /^hsl(a)?\(\s*[\d.%\s,/-]+\)$/i,
    /^var\(--[a-z0-9-]+\)$/i,
  ];

  return allowedPatterns.some((pattern) => pattern.test(color)) ? color : fallback;
}

export function sanitizeClassToken(value, fallback = "default") {
  const token = String(value ?? "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-_]/g, "");

  return token || fallback;
}


export function initOutsideClickHandler(target, onClose, ignore = []) {
    if (!target) return;
    function handleClick(e) {
      const inside = target.contains(e.target);
      const ignored = ignore.some((el) => el && el.contains(e.target));
      if (!inside && !ignored) {
        onClose?.();
        document.removeEventListener("click", handleClick, true);
      }
    }
    requestAnimationFrame(() => document.addEventListener("click", handleClick, true));
  }
  
export function getRandomColor() {
    const colors = [
      "var(--orange-default)",
      "var(--purpleViolett-default)",
      "var(--skyBlue-default)",
      "var(--pink-default)",
      "var(--yellow-default)",
      "var(--aquamarine-default)",
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }


  export function getInitials(name) {
    if (!name || typeof name !== 'string') return '';
    const names = name.trim().split(/\s+/);
    if (names.length === 0) return '';
    
    let initials = names[0].charAt(0).toUpperCase();
    if (names.length > 1) {
        initials += names[names.length - 1].charAt(0).toUpperCase();
    }
    return initials;
}
export function returnContactById(id,contactsList){
    let contact = contactsList.find(contact => contact.id === id);
    return contact;
}

export function getStoredCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem("currentUser"));
  } catch {
    return null;
  }
}

export function getTaskIndexById(id, tasksList) {
    return tasksList.findIndex(task => task.id === id);
}

export function getAllTasksFromContacts(tasksList, uid) {
    return tasksList.filter(task => task.assignedTo.includes(uid));
}

