import { escapeHtml, sanitizeClassToken, sanitizeColor } from "../js/utility.js";

function getTodayISO() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getSafeTask(task = {}) {
  const subtasks = Array.isArray(task.subtasks) ? task.subtasks : [];
  const totalSubtasks = subtasks.length;
  const completedSubtasks = subtasks.filter((subtask) => subtask?.completed).length;
  const progressPercent = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

  return {
    id: escapeHtml(task.id),
    title: escapeHtml(task.title),
    description: escapeHtml(task.description || ""),
    dueDate: escapeHtml(task.dueDate || ""),
    category: escapeHtml(task.category || "No Category"),
    categoryClass: sanitizeClassToken(task.category || "No Category"),
    priority: escapeHtml(task.priority || "Medium"),
    priorityClass: sanitizeClassToken(task.priority || "Medium"),
    progressPercent: Math.max(0, Math.min(100, Number(progressPercent) || 0)),
    subtaskText: totalSubtasks > 0 ? `${completedSubtasks}/${totalSubtasks} Subtasks` : "",
  };
}

function priorityIconMarkup(priorityClass) {
  if (priorityClass === "urgent") {
    return `
      <svg class="priority-icon priority-${priorityClass}" xmlns="http://www.w3.org/2000/svg" width="17" height="12" viewBox="0 0 17 12" fill="none">
        <path d="M2 10L8.5 2L15 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    `;
  }

  if (priorityClass === "low") {
    return `
      <svg class="priority-icon priority-${priorityClass}" xmlns="http://www.w3.org/2000/svg" width="17" height="12" viewBox="0 0 17 12" fill="none">
        <path d="M2 2L8.5 10L15 2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    `;
  }

  return `
    <svg class="priority-icon priority-${priorityClass}" xmlns="http://www.w3.org/2000/svg" width="17" height="10" viewBox="0 0 17 10" fill="none">
      <path d="M2 3H15" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
      <path d="M2 7H15" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
    </svg>
  `;
}

function staticPriorityIconMarkup(priorityClass) {
  const iconMap = {
    urgent: "./assets/board/priority-high.svg",
    medium: "./assets/board/priority-medium.svg",
    low: "./assets/board/priority-low.svg",
  };

  const iconSrc = iconMap[priorityClass] || iconMap.medium;
  const iconLabel = priorityClass || "medium";

  return `<img class="priority-icon-image" src="${iconSrc}" alt="${iconLabel} priority icon">`;
}

export function taskCardTemplate(task) {
  const safeTask = getSafeTask(task);

  return `
    <div class="task-card grabbable" id="task-card-${safeTask.id}" data-task-id="${safeTask.id}" draggable="true" tabindex="0" role="button">
      <div class="tasks-card-content">
        <div class="task-category ${safeTask.categoryClass}">${safeTask.category}</div>
        <div class="task-texts">
          <h3 class="task-title">${safeTask.title}</h3>
          <p class="task-description">${safeTask.description}</p>
        </div>
        ${safeTask.subtaskText ? `
          <div class="task-subtasks">
            <div class="subtasks-bar">
              <div class="subtasks-progress" id="progress-bar-${safeTask.id}" style="width: ${safeTask.progressPercent}%"></div>
            </div>
            <span class="subtask-info" id="subtask-info-${safeTask.id}">${escapeHtml(safeTask.subtaskText)}</span>
          </div>
        ` : ""}
        <div class="task-footer">
          <div class="task-assignees"></div>
          <div class="task-priority">
            ${staticPriorityIconMarkup(safeTask.priorityClass)}
          </div>
        </div>
      </div>
    </div>
  `;
}

export function taskDetailTemplate(task) {
  const safeTask = getSafeTask(task);

  return `
    <div class="overlay-detail-card" id="overlayDetailCard-${safeTask.id}" role="dialog" aria-modal="true" aria-label="Task details">
      <div class="overlay-detail-content">
        <div class="overlay-header">
          <div class="task-category-overlay card-detail-${safeTask.categoryClass}">${safeTask.category}</div>
          <button class="overlay-close-btn" id="overlayCloseBtn" type="button" aria-label="Close">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6L18 18" stroke="#2A3647" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>
        </div>

        <h2 class="overlay-title">${safeTask.title}</h2>
        <p class="overlay-description">${safeTask.description}</p>

        <div class="date-and-priority-section">
          <div class="overlay-field-label">
            <label>Due date:</label>
            <label>Priority:</label>
          </div>

          <div class="overlay-field-content">
            <span>${safeTask.dueDate}</span>
            <div class="overlay-priority">
              <span>${safeTask.priority}</span>
              ${staticPriorityIconMarkup(safeTask.priorityClass)}
            </div>
          </div>
        </div>

        <div class="overlay-field">
          <label class="overlay-label">Assigned To:</label>
          <div class="overlay-assignees" id="assignedDetails-${safeTask.id}"></div>
        </div>

        <div class="overlay-field">
          <div class="overlay-subtasks" id="subtaskDetails-${safeTask.id}"></div>
        </div>
      </div>

      <div class="overlay-actions">
        <button class="btn-delete" id="deleteTaskBtn-${safeTask.id}" type="button">
          <svg class="action-btn-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="18" viewBox="0 0 16 18" fill="none">
            <path d="M3 18C2.45 18 1.97917 17.8042 1.5875 17.4125C1.19583 17.0208 1 16.55 1 16V3C0.716667 3 0.479167 2.90417 0.2875 2.7125C0.0958333 2.52083 0 2.28333 0 2C0 1.71667 0.0958333 1.47917 0.2875 1.2875C0.479167 1.09583 0.716667 1 1 1H5C5 0.716667 5.09583 0.479167 5.2875 0.2875C5.47917 0.0958333 5.71667 0 6 0H10C10.2833 0 10.5208 0.0958333 10.7125 0.2875C10.9042 0.479167 11 0.716667 11 1H15C15.2833 1 15.5208 1.09583 15.7125 1.2875C15.9042 1.47917 16 1.71667 16 2C16 2.28333 15.9042 2.52083 15.7125 2.7125C15.5208 2.90417 15.2833 3 15 3V16C15 16.55 14.8042 17.0208 14.4125 17.4125C14.0208 17.8042 13.55 18 13 18H3ZM3 3V16H13V3H3ZM5 13C5 13.2833 5.09583 13.5208 5.2875 13.7125C5.47917 13.9042 5.71667 14 6 14C6.28333 14 6.52083 13.9042 6.7125 13.7125C6.90417 13.5208 7 13.2833 7 13V6C7 5.71667 6.90417 5.47917 6.7125 5.2875C6.52083 5.09583 6.28333 5 6 5C5.71667 5 5.47917 5.09583 5.2875 5.2875C5.09583 5.47917 5 5.71667 5 6V13ZM9 13C9 13.2833 9.09583 13.5208 9.2875 13.7125C9.47917 13.9042 9.71667 14 10 14C10.2833 14 10.5208 13.9042 10.7125 13.7125C10.9042 13.5208 11 13.2833 11 13V6C11 5.71667 10.9042 5.47917 10.7125 5.2875C10.5208 5.09583 10.2833 5 10 5C9.71667 5 9.47917 5.09583 9.2875 5.2875C9.09583 5.47917 9 5.71667 9 6V13Z" fill="currentColor" />
          </svg>
          Delete
        </button>
        <div class="action-btn-divider"></div>
        <button class="btn-edit" id="editTaskBtn-${safeTask.id}" type="button">
          <svg class="action-btn-icon" xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 19 19" fill="none">
            <path d="M2 16.25H3.4L12.025 7.625L10.625 6.225L2 14.85V16.25ZM16.3 6.175L12.05 1.975L13.45 0.575C13.8333 0.191667 14.3042 0 14.8625 0C15.4208 0 15.8917 0.191667 16.275 0.575L17.675 1.975C18.0583 2.35833 18.2583 2.82083 18.275 3.3625C18.2917 3.90417 18.1083 4.36667 17.725 4.75L16.3 6.175ZM14.85 7.65L4.25 18.25H0V14L10.6 3.4L14.85 7.65Z" fill="currentColor" />
          </svg>
          Edit
        </button>
      </div>
    </div>
  `;
}

export function assigneeAvatarTemplate(initials, color) {
  const safeInitials = escapeHtml(initials);
  const safeColor = sanitizeColor(color);
  return `<div class="assignee-avatar" style="background-color: ${safeColor};">${safeInitials}</div>`;
}

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

export function addSubtaskToDetailTemplate(text, completed = false, index) {
  const safeText = escapeHtml(text);
  const safeIndex = Number.isInteger(index) ? index : 0;
  const checked = completed ? "checked" : "";

  return `
    <label class="overlay-subtask-item">
      <input type="checkbox" ${checked} data-index="${safeIndex}" />
      <span>${safeText}</span>
    </label>
  `;
}

export function editTaskTemplate(task) {
  return taskDetailTemplate(task);
}

export function editTaskFormTemplate(task) {
  const safeTask = getSafeTask(task);
  const todayISO = getTodayISO();
  const dateMin = safeTask.dueDate && safeTask.dueDate < todayISO ? safeTask.dueDate : todayISO;

  return `
    <div class="edit-overlay-card" id="editOverlayCard-${safeTask.id}" role="dialog" aria-modal="true" aria-label="Edit task">
      <button class="edit-overlay-close-btn" id="editOverlayCloseBtn" type="button" aria-label="Close">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M18 6L6 18M6 6L18 18" stroke="#2A3647" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>

      <form class="edit-task-form" id="editTaskForm-${safeTask.id}" novalidate>
        <div class="edit-form-group">
          <label for="editTaskTitle-${safeTask.id}">Title</label>
          <input type="text" id="editTaskTitle-${safeTask.id}" class="edit-form-input" value="${safeTask.title}" maxlength="80">
        </div>

        <div class="edit-form-group">
          <label for="editTaskDescription-${safeTask.id}">Description</label>
          <textarea id="editTaskDescription-${safeTask.id}" class="edit-form-textarea" maxlength="500">${safeTask.description}</textarea>
        </div>

        <div class="edit-form-group">
          <label for="editTaskDate-${safeTask.id}">Due date</label>
          <input type="date" id="editTaskDate-${safeTask.id}" class="edit-form-input" value="${safeTask.dueDate}" min="${dateMin}">
        </div>

        <input type="hidden" id="editTaskCategory-${safeTask.id}" value="${safeTask.category}">

        <div class="edit-form-group">
          <label class="priority-label">Priority</label>
          <div class="edit-priority-group">
            <button type="button" class="edit-priority-btn" id="edit-priority-urgent-${safeTask.id}" data-priority="Urgent">
              <span class="priority-name">Urgent</span>
              ${priorityIconMarkup("urgent")}
            </button>
            <button type="button" class="edit-priority-btn" id="edit-priority-medium-${safeTask.id}" data-priority="Medium">
              <span class="priority-name">Medium</span>
              ${priorityIconMarkup("medium")}
            </button>
            <button type="button" class="edit-priority-btn" id="edit-priority-low-${safeTask.id}" data-priority="Low">
              <span class="priority-name">Low</span>
              ${priorityIconMarkup("low")}
            </button>
          </div>
        </div>

        <div class="assigned-area" id="assignedArea">
          <label class="assigned-label" for="editSelectedBox-${safeTask.id}">Assigned to</label>
          <div class="multi-select">
            <input class="selected-box task-input" id="editSelectedBox-${safeTask.id}" placeholder=" Select contacts to assign">
            <span class="select-arrow" id="editSelectedBoxArrow-${safeTask.id}" aria-hidden="true"></span>
            <div class="checkbox-list" id="editCheckboxList-${safeTask.id}"></div>
          </div>
          <div class="assignedIcons" id="editAssignees-${safeTask.id}"></div>
        </div>

        <div class="edit-form-group">
          <label>Subtasks</label>
          <div class="edit-subtask-input-area">
            <input class="edit-form-input" type="text" id="editSubtasks-${safeTask.id}" maxlength="120" placeholder="Add new subtask" />
            <div class="edit-subtask-buttons">
              <button class="remove-background edit-subtask-btn" id="editAddSubtaskBtn-${safeTask.id}" type="button">
                <img class="subtask-add-button-size" src="./assets/utilitys/check.svg" alt="add subtask button" />
              </button>
              <div class="dividing-line"></div>
              <button class="remove-background edit-subtask-btn" id="editRemoveSubtaskBtn-${safeTask.id}" type="button">
                <img class="subtask-remove-button-size" src="./assets/utilitys/close.svg" alt="remove subtask button" />
              </button>
            </div>
          </div>
          <div class="edit-subtasks-list" id="editSubtasksList-${safeTask.id}"></div>
        </div>
      </form>

      <div class="edit-overlay-actions">
        <button type="submit" form="editTaskForm-${safeTask.id}" class="edit-btn-ok" id="editBtnOk-${safeTask.id}">
          Ok
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="14" viewBox="0 0 18 14" fill="none">
            <path d="M1 7L7 13L17 1" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  `;
}
