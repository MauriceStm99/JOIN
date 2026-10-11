import { escapeHtml, sanitizeClassToken, sanitizeColor } from "../js/core/utility.js";

const STATIC_PRIORITY_ICONS = {
  urgent: "../../assets/board/priority-high.svg",
  medium: "../../assets/board/priority-medium.svg",
  low: "../../assets/board/priority-low.svg",
};

export const CLOSE_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
  <path d="M18 6L6 18M6 6L18 18" stroke="#2A3647" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
  </svg>`;

const DELETE_ICON = `<svg class="action-btn-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="18" viewBox="0 0 16 18" fill="none">
  <path d="M3 18C2.45 18 1.97917 17.8042 1.5875 17.4125C1.19583 17.0208 1 16.55 1 16V3C0.716667 3 0.479167 2.90417 0.2875 2.7125C0.0958333 2.52083 0 2.28333 0 2C0 1.71667 0.0958333 1.47917 0.2875 1.2875C0.479167 1.09583 0.716667 1 1 1H5C5 0.716667 5.09583 0.479167 5.2875 0.2875C5.47917 0.0958333 5.71667 0 6 0H10C10.2833 0 10.5208 0.0958333 10.7125 0.2875C10.9042 0.479167 11 0.716667 11 1H15C15.2833 1 15.5208 1.09583 15.7125 1.2875C15.9042 1.47917 16 1.71667 16 2C16 2.28333 15.9042 2.52083 15.7125 2.7125C15.5208 2.90417 15.2833 3 15 3V16C15 16.55 14.8042 17.0208 14.4125 17.4125C14.0208 17.8042 13.55 18 13 18H3ZM3 3V16H13V3H3ZM5 13C5 13.2833 5.09583 13.5208 5.2875 13.7125C5.47917 13.9042 5.71667 14 6 14C6.28333 14 6.52083 13.9042 6.7125 13.7125C6.90417 13.5208 7 13.2833 7 13V6C7 5.71667 6.90417 5.47917 6.7125 5.2875C6.52083 5.09583 6.28333 5 6 5C5.71667 5 5.47917 5.09583 5.2875 5.2875C5.09583 5.47917 5 5.71667 5 6V13ZM9 13C9 13.2833 9.09583 13.5208 9.2875 13.7125C9.47917 13.9042 9.71667 14 10 14C10.2833 14 10.5208 13.9042 10.7125 13.7125C10.9042 13.5208 11 13.2833 11 13V6C11 5.71667 10.9042 5.47917 10.7125 5.2875C10.5208 5.09583 10.2833 5 10 5C9.71667 5 9.47917 5.09583 9.2875 5.2875C9.09583 5.47917 9 5.71667 9 6V13Z" fill="currentColor" />
  </svg>`;

const EDIT_ICON = `<svg class="action-btn-icon" xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 19 19" fill="none">
  <path d="M2 16.25H3.4L12.025 7.625L10.625 6.225L2 14.85V16.25ZM16.3 6.175L12.05 1.975L13.45 0.575C13.8333 0.191667 14.3042 0 14.8625 0C15.4208 0 15.8917 0.191667 16.275 0.575L17.675 1.975C18.0583 2.35833 18.2583 2.82083 18.275 3.3625C18.2917 3.90417 18.1083 4.36667 17.725 4.75L16.3 6.175ZM14.85 7.65L4.25 18.25H0V14L10.6 3.4L14.85 7.65Z" fill="currentColor" />
  </svg>`;

/**
 * Returns the subtasks of a task as an array.
 * @param {Object} task - The task.
 * @returns {Object[]} The subtasks.
 */
function getSubtaskList(task) {
  return Array.isArray(task.subtasks) ? task.subtasks : [];
}

/**
 * Counts all and completed subtasks of a task.
 * @param {Object} task - The task.
 * @returns {{total: number, completed: number}} The counts.
 */
function countSubtasks(task) {
  const subtasks = getSubtaskList(task);
  return { total: subtasks.length, completed: subtasks.filter((subtask) => subtask?.completed).length };
}

/**
 * Calculates the width of the subtask progress bar.
 * @param {number} completed - Completed subtasks.
 * @param {number} total - All subtasks.
 * @returns {number} A percentage between 0 and 100.
 */
function getProgressPercent(completed, total) {
  if (total === 0) return 0;
  return Math.max(0, Math.min(100, Number((completed / total) * 100) || 0));
}

/**
 * Escapes category and priority and builds their CSS class tokens.
 * @param {Object} task - The task.
 * @returns {Object} category, categoryClass, priority and priorityClass.
 */
function getSafeLabels(task) {
  const category = task.category || "No Category";
  const priority = task.priority || "Medium";
  return {
    category: escapeHtml(category),
    categoryClass: sanitizeClassToken(category),
    priority: escapeHtml(priority),
    priorityClass: sanitizeClassToken(priority),
  };
}

/**
 * Returns all values of a task that the templates need, escaped for HTML.
 * @param {Object} [task] - The task.
 * @returns {Object} The escaped values.
 */
export function getSafeTask(task = {}) {
  const { completed, total } = countSubtasks(task);
  return {
    id: escapeHtml(task.id),
    title: escapeHtml(task.title),
    description: escapeHtml(task.description || ""),
    dueDate: escapeHtml(task.dueDate || ""),
    ...getSafeLabels(task),
    progressPercent: getProgressPercent(completed, total),
    subtaskText: total > 0 ? `${completed}/${total} Subtasks` : "",
  };
}

/**
 * Renders the priority icon of a card or the detail view.
 * @param {string} priorityClass - urgent, medium or low.
 * @returns {string} The image HTML.
 */
function staticPriorityIconMarkup(priorityClass) {
  const iconSrc = STATIC_PRIORITY_ICONS[priorityClass] || STATIC_PRIORITY_ICONS.medium;
  const iconLabel = priorityClass || "medium";
  return `<img class="priority-icon-image" src="${iconSrc}" alt="${iconLabel} priority icon">`;
}

/**
 * Renders a task card of the board.
 * @param {Object} task - The task.
 * @returns {string} The card HTML.
 */
export function taskCardTemplate(task) {
  const safeTask = getSafeTask(task);
  return `
    <div class="task-card grabbable" id="task-card-${safeTask.id}" data-task-id="${safeTask.id}" draggable="true" tabindex="0" role="button">
      <div class="tasks-card-content">
        ${taskCardTextsTemplate(safeTask)}
        ${safeTask.subtaskText ? taskCardSubtasksTemplate(safeTask) : ""}
        ${taskCardFooterTemplate(safeTask)}
      </div>
    </div>
  `;
}

/**
 * Renders category, title and description of a card.
 * @param {Object} safeTask - Escaped task values.
 * @returns {string} The HTML.
 */
function taskCardTextsTemplate(safeTask) {
  return `
        <div class="task-category ${safeTask.categoryClass}">${safeTask.category}</div>
        <div class="task-texts">
          <h3 class="task-title">${safeTask.title}</h3>
          <p class="task-description">${safeTask.description}</p>
        </div>`;
}

/**
 * Renders the subtask progress bar of a card.
 * @param {Object} safeTask - Escaped task values.
 * @returns {string} The HTML.
 */
function taskCardSubtasksTemplate(safeTask) {
  return `
          <div class="task-subtasks">
            <div class="subtasks-bar">
              <div class="subtasks-progress" id="progress-bar-${safeTask.id}" style="width: ${safeTask.progressPercent}%"></div>
            </div>
            <span class="subtask-info" id="subtask-info-${safeTask.id}">${escapeHtml(safeTask.subtaskText)}</span>
          </div>`;
}

/**
 * Renders the avatar container and the priority icon of a card.
 * @param {Object} safeTask - Escaped task values.
 * @returns {string} The HTML.
 */
function taskCardFooterTemplate(safeTask) {
  return `
        <div class="task-footer">
          <div class="task-assignees"></div>
          <div class="task-priority">
            ${staticPriorityIconMarkup(safeTask.priorityClass)}
          </div>
        </div>`;
}

/**
 * Renders the detail view of a task.
 * @param {Object} task - The task.
 * @returns {string} The detail HTML.
 */
export function taskDetailTemplate(task) {
  const safeTask = getSafeTask(task);
  return `
    <div class="overlay-detail-card" id="overlayDetailCard-${safeTask.id}" role="dialog" aria-modal="true" aria-label="Task details">
      <div class="overlay-detail-content">
        ${taskDetailHeaderTemplate(safeTask)}
        ${taskDetailTextsTemplate(safeTask)}
        ${taskDetailDateAndPriorityTemplate(safeTask)}
        ${taskDetailFieldsTemplate(safeTask)}
      </div>
      ${taskDetailActionsTemplate(safeTask)}
    </div>
  `;
}

/**
 * Renders category and close button of the detail view.
 * @param {Object} safeTask - Escaped task values.
 * @returns {string} The HTML.
 */
function taskDetailHeaderTemplate(safeTask) {
  return `
        <div class="overlay-header">
          <div class="task-category-overlay card-detail-${safeTask.categoryClass}">${safeTask.category}</div>
          <button class="overlay-close-btn" id="overlayCloseBtn" type="button" aria-label="Close">
            ${CLOSE_ICON}
          </button>
        </div>`;
}

/**
 * Renders title and description of the detail view.
 * @param {Object} safeTask - Escaped task values.
 * @returns {string} The HTML.
 */
function taskDetailTextsTemplate(safeTask) {
  return `
        <h2 class="overlay-title">${safeTask.title}</h2>
        <p class="overlay-description">${safeTask.description}</p>`;
}

/**
 * Renders due date and priority of the detail view.
 * @param {Object} safeTask - Escaped task values.
 * @returns {string} The HTML.
 */
function taskDetailDateAndPriorityTemplate(safeTask) {
  return `
        <div class="date-and-priority-section">
          <div class="overlay-field-label">
            <label>Due date:</label>
            <label>Priority:</label>
          </div>
          ${taskDetailDateAndPriorityValuesTemplate(safeTask)}
        </div>`;
}

/**
 * Renders the values of due date and priority of the detail view.
 * @param {Object} safeTask - Escaped task values.
 * @returns {string} The HTML.
 */
function taskDetailDateAndPriorityValuesTemplate(safeTask) {
  return `
          <div class="overlay-field-content">
            <span>${safeTask.dueDate}</span>
            <div class="overlay-priority">
              <span>${safeTask.priority}</span>
              ${staticPriorityIconMarkup(safeTask.priorityClass)}
            </div>
          </div>`;
}

/**
 * Renders the containers for assignees and subtasks of the detail view.
 * @param {Object} safeTask - Escaped task values.
 * @returns {string} The HTML.
 */
function taskDetailFieldsTemplate(safeTask) {
  return `
        <div class="overlay-field">
          <label class="overlay-label">Assigned To:</label>
          <div class="overlay-assignees" id="assignedDetails-${safeTask.id}"></div>
        </div>
        <div class="overlay-field">
          <div class="overlay-subtasks" id="subtaskDetails-${safeTask.id}"></div>
        </div>`;
}

/**
 * Renders the delete and edit buttons of the detail view.
 * @param {Object} safeTask - Escaped task values.
 * @returns {string} The HTML.
 */
function taskDetailActionsTemplate(safeTask) {
  return `
      <div class="overlay-actions">
        <button class="btn-delete" id="deleteTaskBtn-${safeTask.id}" type="button">
          ${DELETE_ICON}
          Delete
        </button>
        <div class="action-btn-divider"></div>
        <button class="btn-edit" id="editTaskBtn-${safeTask.id}" type="button">
          ${EDIT_ICON}
          Edit
        </button>
      </div>`;
}

/**
 * Renders a small avatar with initials.
 * @param {string} initials - The initials.
 * @param {string} color - Background color.
 * @returns {string} The avatar HTML.
 */
export function assigneeAvatarTemplate(initials, color) {
  const safeInitials = escapeHtml(initials);
  const safeColor = sanitizeColor(color);
  return `<div class="assignee-avatar" style="background-color: ${safeColor};">${safeInitials}</div>`;
}

/**
 * Renders the "+n" badge for assignees that do not fit on a card.
 * @param {number} remaining - Number of hidden assignees.
 * @returns {string} The badge HTML.
 */
export function assigneeMoreBadgeTemplate(remaining) {
  return `<div class="assignee-avatar assignee-more-badge">+${remaining}</div>`;
}

/**
 * Renders an assignee with avatar and name for the detail view.
 * @param {string} initials - The initials.
 * @param {string} name - The name.
 * @param {string} color - Background color.
 * @returns {string} The assignee HTML.
 */
export function assigneeAvatarToDetail(initials, name, color) {
  const safeInitials = escapeHtml(initials);
  const safeName = escapeHtml(name);
  const safeColor = sanitizeColor(color);
  return `
    <div class="overlay-assignee-item">
      <div class="assignee-avatar" style="background-color: ${safeColor};">${safeInitials}</div>
      <div class="assignee-name">${safeName}</div>
    </div>
  `;
}

/**
 * Renders a subtask with checkbox for the detail view.
 * @param {string} text - Subtask text.
 * @param {boolean} [completed] - Whether the subtask is done.
 * @param {number} index - Position of the subtask.
 * @returns {string} The subtask HTML.
 */
export function addSubtaskToDetailTemplate(text, completed = false, index) {
  return `
    <label class="overlay-subtask-item">
      <input type="checkbox" ${completed ? "checked" : ""} data-index="${Number.isInteger(index) ? index : 0}" />
      <span>${escapeHtml(text)}</span>
    </label>
  `;
}

/**
 * Renders the detail view, kept for older calls of the edit template.
 * @param {Object} task - The task.
 * @returns {string} The detail HTML.
 */
export function editTaskTemplate(task) {
  return taskDetailTemplate(task);
}
