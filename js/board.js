import {
  getAllTasks,
  getContacts,
  getTask,
  deleteTask,
  changeTaskProgress,
  getSubtasksCompletionState,
  changeSubtaskCompletion,
} from "./firebase.js";
import {
  taskCardTemplate,
  taskDetailTemplate,
  assigneeAvatarTemplate,
  assigneeAvatarToDetail,
  addSubtaskToDetailTemplate,
} from "../templates/boardTasksTemplates.js";
import { getInitials, returnContactById } from "./utility.js";
import { showPopup } from "./feedback.js";
import { createBoardEditTaskController } from "./boardEditTask.js";
import { createBoardAddOverlayController } from "./boardAddOverlay.js";

const overlay = document.getElementById("taskDetailOverlay");
let contactsList = [];
let lastFocusedCard = null;

const editTaskController = createBoardEditTaskController({
  overlay,
  getContactsList: () => contactsList,
  refreshTaskCard: updateTaskCard,
  showTaskDetail,
});

const addTaskOverlayController = createBoardAddOverlayController({
  getContactsList: () => contactsList,
  appendNewTaskToBoard,
});

document.addEventListener("DOMContentLoaded", async () => {
  initTaskCardClicks();
  initTaskCardKeyboard();
  initEscapeKeyClose();
  initOverlayClose();
  initSearch();
  addTaskOverlayController.initAddTaskOverlay();

  const [tasksResult, contactsResult] = await Promise.allSettled([getAllTasks(), getContacts()]);

  if (contactsResult.status === "fulfilled") {
    contactsList = Array.isArray(contactsResult.value) ? contactsResult.value : [];
    addTaskOverlayController.populateOverlayContacts();
  } else {
    contactsList = [];
    showPopup("Contacts could not be loaded for the board.", "info");
  }

  if (tasksResult.status === "fulfilled") {
    renderTasks(tasksResult.value);
  } else {
    showPopup("Tasks could not be loaded for the board.", "info");
  }

  initDragAndDrop();
  checkColumnVisibility();
});

window.openAddTaskOverlay = (status) => addTaskOverlayController.openAddTaskOverlay(status);

function initDragAndDrop() {
  const cards = document.querySelectorAll('[draggable="true"]');
  const dropZones = document.querySelectorAll(".kanban-column");
  cards.forEach((card) => {
    card.addEventListener("dragstart", handleDragStart);
    initTouchDrag(card);
  });
  dropZones.forEach((zone) => {
    zone.addEventListener("dragover", handleDragOver);
    zone.addEventListener("dragenter", handleDragEnter);
    zone.addEventListener("dragleave", handleDragLeave);
    zone.addEventListener("drop", handleDrop);
  });
  document.addEventListener("dragend", handleDragEnd);
}

function initTaskCardClicks() {
  document.addEventListener("click", (event) => {
    const card = event.target.closest(".task-card");
    if (!card) return;
    handleTaskCardClick(event, card);
  });
}

function initTaskCardKeyboard() {
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    const card = event.target.closest?.(".task-card");
    if (!card || event.target !== card) return;
    event.preventDefault();
    handleTaskCardClick(event, card);
  });
}

function initEscapeKeyClose() {
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    const addOverlay = document.getElementById("addTaskOverlay");
    if (addOverlay?.classList.contains("active")) {
      addTaskOverlayController.closeAddTaskOverlay();
      return;
    }
    if (!overlay?.classList.contains("active")) return;
    if (overlay.querySelector(".edit-overlay-card")) {
      editTaskController.closeEditOverlay();
      return;
    }
    closeOverlayOnBtn();
  });
}

async function handleTaskCardClick(event, card) {
  if (event.target.closest("button") || card.classList.contains("dragging")) return;
  const taskId = card.dataset.taskId || card.id.replace("task-card-", "");
  if (!taskId) return;

  lastFocusedCard = card;
  try {
    const task = await getTask(taskId);
    showTaskDetail(task);
  } catch (error) {
    showPopup(error.message || "Could not load task details.");
  }
}

function showTaskDetail(task) {
  overlay.innerHTML = taskDetailTemplate(task);
  overlay.classList.add("active");
  addAssigneeAvatartoDetail(task);
  addSubtaskToDetail(task);
  addEventListenersToSubtaskButtons(task.id);
  initAddEventListenersToTaskDetailButtons(task.id);
  overlay.querySelector("#overlayCloseBtn")?.addEventListener("click", closeOverlayOnBtn);
  overlay.querySelector("#overlayCloseBtn")?.focus();
}

function initOverlayClose() {
  overlay?.addEventListener("click", (event) => {
    if (event.target === overlay) closeOverlayOnBtn();
  });
}

function initSearch() {
  const searchInput = document.getElementById("searchInput");
  if (!searchInput) return;
  searchInput.addEventListener("input", (event) => {
    filterTasks(event.target.value.toLowerCase());
  });
}

function filterTasks(searchText) {
  document.querySelectorAll(".task-card").forEach((card) => {
    const title = card.querySelector(".task-title")?.textContent.toLowerCase() || "";
    const description = card.querySelector(".task-description")?.textContent.toLowerCase() || "";
    const matches = searchText === "" || title.includes(searchText) || description.includes(searchText);
    card.style.display = matches ? "" : "none";
  });
  updateNoTaskVisibility();
}

function updateNoTaskVisibility() {
  const columns = [
    { id: "todoColumn", noTaskClass: ".todo-Column-no-task" },
    { id: "progressColumn", noTaskClass: ".inProgress-Column-no-task" },
    { id: "awaitFeedbackColumn", noTaskClass: ".awaitFeedback-Column-no-task" },
    { id: "doneColumn", noTaskClass: ".done-Column-no-task" },
  ];

  columns.forEach((columnConfig) => {
    const column = document.getElementById(columnConfig.id);
    const visibleTasks = column?.querySelectorAll('.task-card:not([style*="display: none"])').length || 0;
    const noTaskDiv = column?.querySelector(columnConfig.noTaskClass);
    if (noTaskDiv) noTaskDiv.style.display = visibleTasks === 0 ? "" : "none";
  });
}

function closeOverlayOnBtn() {
  overlay.classList.add("closing");
  setTimeout(() => {
    overlay.classList.remove("active", "closing");
    if (lastFocusedCard?.isConnected) lastFocusedCard.focus();
    lastFocusedCard = null;
  }, 200);
}

function renderTasks(tasks) {
  const columns = {
    toDo: document.getElementById("todoColumn"),
    inProgress: document.getElementById("progressColumn"),
    awaitFeedback: document.getElementById("awaitFeedbackColumn"),
    done: document.getElementById("doneColumn"),
  };

  (Array.isArray(tasks) ? tasks : []).forEach((task) => {
    const column = columns[task.progress];
    if (!column) return;

    try {
      column.insertAdjacentHTML("beforeend", taskCardTemplate(task));
      changeSubtaskProgressbar(task);
      addAssigneeAvatar(task);
    } catch (error) {
      showPopup("A task could not be rendered completely.", "info");
    }
  });
}

let dragActivateTimer = null;

function handleDragStart(event) {
  const card = event.target.closest('[draggable="true"]');
  event.dataTransfer.setData("text/plain", card.id);
  card.classList.add("dragging");
  dragActivateTimer = setTimeout(() => document.body.classList.add("drag-active"), 0);
}

function handleDragEnd(event) {
  const card = event.target.closest('[draggable="true"]');
  if (card) card.classList.remove("dragging");
  clearTimeout(dragActivateTimer);
  document.body.classList.remove("drag-active");
  document.querySelectorAll(".tasks-container").forEach((container) => {
    container.classList.remove("dragover-highlight");
  });
}

function handleDragOver(event) {
  event.preventDefault();
  event.dataTransfer.dropEffect = "move";
}

function handleDragEnter(event) {
  event.preventDefault();
  const container = this.querySelector(".tasks-container");
  if (container) {
    container.classList.add("dragover-highlight");
  }
}

function handleDragLeave(event) {
  const rect = this.getBoundingClientRect();
  const x = event.clientX;
  const y = event.clientY;

  if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
    const container = this.querySelector(".tasks-container");
    if (container) {
      container.classList.remove("dragover-highlight");
    }
  }
}

function handleDrop(event) {
  event.preventDefault();
  const cardId = event.dataTransfer.getData("text/plain");
  const movedCard = document.getElementById(cardId);
  if (!movedCard) return;

  const container = this.querySelector(".tasks-container");
  if (!container) return;

  container.appendChild(movedCard);
  movedCard.classList.remove("dragging");
  container.classList.remove("dragover-highlight");

  const taskId = (movedCard.dataset.taskId || movedCard.id).replace("task-card-", "");
  updateTaskProgressInFirebase(taskId, getNewProgressFromDropZone(container));
  checkColumnVisibility();
}

function updateTaskProgressInFirebase(taskId, newProgress) {
  changeTaskProgress(taskId, newProgress).catch((error) => {
    showPopup(error.message || "Task progress could not be updated.");
  });
}

function getNewProgressFromDropZone(dropZone) {
  const progressMap = {
    todoColumn: "toDo",
    progressColumn: "inProgress",
    awaitFeedbackColumn: "awaitFeedback",
    doneColumn: "done",
  };

  return progressMap[dropZone.id];
}

function checkColumnVisibility() {
  updateNoTaskVisibility();
}

function changeSubtaskProgressbar(task) {
  getSubtasksCompletionState(task.id)
    .then(({ totalSubtasks, completedSubtasks }) => {
      const progressBar = document.getElementById(`progress-bar-${task.id}`);
      const info = document.getElementById(`subtask-info-${task.id}`);
      if (info) info.textContent = `${completedSubtasks}/${totalSubtasks} Subtasks`;
      if (!progressBar) return;
      const percentage = (completedSubtasks / totalSubtasks) * 100 || 0;
      progressBar.style.width = `${percentage}%`;
    })
    .catch((error) => showPopup(error.message || "Subtask progress could not be loaded."));
}

function addAssigneeAvatar(task) {
  const container = document.getElementById(`task-card-${task.id}`)?.querySelector(".task-assignees");
  if (!container) return;

  const assigned = (Array.isArray(task.assignedTo) ? task.assignedTo : [])
    .map((uid) => returnContactById(uid, contactsList))
    .filter(Boolean);

  const maxVisible = 3;
  assigned.slice(0, maxVisible).forEach((contact) => {
    container.insertAdjacentHTML("beforeend", assigneeAvatarTemplate(getInitials(contact.name), contact.color));
  });

  const remaining = assigned.length - maxVisible;
  if (remaining > 0) {
    container.insertAdjacentHTML("beforeend", `<div class="assignee-avatar assignee-more-badge">+${remaining}</div>`);
  }
}

function addAssigneeAvatartoDetail(task) {
  const container = document.getElementById(`overlayDetailCard-${task.id}`)?.querySelector(".overlay-assignees");
  if (!container) return;

  (Array.isArray(task.assignedTo) ? task.assignedTo : []).forEach((uid) => {
    const contact = returnContactById(uid, contactsList);
    if (!contact) return;
    container.insertAdjacentHTML("beforeend", assigneeAvatarToDetail(getInitials(contact.name), contact.name, contact.color));
  });
}

function addSubtaskToDetail(task) {
  const subtaskDetails = document.getElementById(`subtaskDetails-${task.id}`);
  if (!subtaskDetails) return;

  subtaskDetails.innerHTML = '<span class="overlay-label">Subtasks:</span>';
  task.subtasks?.forEach((subtask, index) => {
    subtaskDetails.insertAdjacentHTML("beforeend", addSubtaskToDetailTemplate(subtask.text, subtask.completed, index));
  });

  if (!task.subtasks || task.subtasks.length === 0) {
    subtaskDetails.insertAdjacentHTML("beforeend", '<p class="no-subtasks">No subtasks</p>');
  }
}

function addEventListenersToSubtaskButtons(taskId) {
  const subtaskDetails = document.getElementById(`subtaskDetails-${taskId}`);
  if (!subtaskDetails) return;

  const subtaskItems = subtaskDetails.querySelectorAll(".overlay-subtask-item");
  subtaskItems.forEach((item, index) => {
    const checkbox = item.querySelector('input[type="checkbox"]');
    if (!checkbox) return;
    checkbox.addEventListener("change", async () => handleSubtaskCheckboxChange(taskId, index, checkbox));
  });
}

async function handleSubtaskCheckboxChange(taskId, index, checkbox) {
  try {
    await changeSubtaskCompletion(taskId, index, checkbox.checked);
    const updatedTask = await getTask(taskId);
    changeSubtaskProgressbar(updatedTask);
    updateOverlaySubtaskInfo(updatedTask);
  } catch (error) {
    showPopup(error.message || "Failed to update subtask.");
    checkbox.checked = !checkbox.checked;
  }
}

function updateOverlaySubtaskInfo(task) {
  const total = task.subtasks?.length || 0;
  const completed = task.subtasks?.filter((subtask) => subtask.completed).length || 0;
  const infoElement = document.getElementById(`subtaskDetails-${task.id}`)?.querySelector(".overlay-subtask-info");
  if (infoElement) infoElement.textContent = `${completed}/${total} Subtasks`;
}

function initAddEventListenersToTaskDetailButtons(taskId) {
  document.getElementById(`deleteTaskBtn-${taskId}`)?.addEventListener("click", () => deleteTaskFromBoard(taskId));
  document.getElementById(`editTaskBtn-${taskId}`)?.addEventListener("click", async () => {
    await editTaskController.openEditTaskOverlay(taskId);
  });
}

async function updateTaskCard(taskId, updatedTask) {
  const taskCard = document.getElementById(`task-card-${taskId}`);
  if (!taskCard || !updatedTask) return;

  taskCard.outerHTML = taskCardTemplate(updatedTask);
  const newCard = document.getElementById(`task-card-${taskId}`);
  if (!newCard) return;

  newCard.querySelector(".task-assignees").innerHTML = "";
  addAssigneeAvatar(updatedTask);
  newCard.addEventListener("dragstart", handleDragStart);
  initTouchDrag(newCard);
}

function deleteTaskFromBoard(taskId) {
  deleteTask(taskId)
    .then(() => {
      showPopup("Task deleted.", "success");
      closeOverlayOnBtn();
      document.getElementById(`task-card-${taskId}`)?.remove();
      checkColumnVisibility();
    })
    .catch((error) => showPopup(error.message || "Error deleting task."));
}

function getTasksContainerId(progress) {
  const map = {
    toDo: "todoColumn",
    inProgress: "progressColumn",
    awaitFeedback: "awaitFeedbackColumn",
    done: "doneColumn",
  };

  return map[progress] || "todoColumn";
}

function appendNewTaskToBoard(task) {
  const column = document.getElementById(getTasksContainerId(task.progress));
  if (!column) return;

  column.insertAdjacentHTML("beforeend", taskCardTemplate(task));
  changeSubtaskProgressbar(task);
  addAssigneeAvatar(task);
  const newCard = document.getElementById(`task-card-${task.id}`);
  if (newCard) {
    newCard.addEventListener("dragstart", handleDragStart);
    initTouchDrag(newCard);
  }
  checkColumnVisibility();
}

function initTouchDrag(card) {
  let touchStartTimer = null;
  let isDragging = false;
  let placeholder = null;
  let startX = 0;
  let startY = 0;
  let offsetX = 0;
  let offsetY = 0;
  let lastTouchX = 0;
  let lastTouchY = 0;
  let autoScrollFrame = null;
  let currentColumn = null;
  let originalParent = null;
  let originalSibling = null;

  card.addEventListener("touchstart", handleTouchStart, { passive: false });
  card.addEventListener("touchmove", handleTouchMove, { passive: false });
  card.addEventListener("touchend", handleTouchEnd, { passive: false });
  card.addEventListener("contextmenu", handleContextMenu);

  function handleContextMenu(e) {
    e.preventDefault();
  }

  function handleTouchStart(e) {
    if (e.touches.length !== 1) return;

    const touch = e.touches[0];
    startX = touch.clientX;
    startY = touch.clientY;

    const rect = card.getBoundingClientRect();
    offsetX = startX - rect.left;
    offsetY = startY - rect.top;

    touchStartTimer = setTimeout(() => {
      startDrag(touch, rect);
    }, 150);
  }

  function startDrag(touch, rect) {
    isDragging = true;
    card.classList.add("dragging");
    document.body.classList.add("drag-active");

    placeholder = document.createElement("div");
    placeholder.className = "task-card-placeholder";
    placeholder.style.height = `${rect.height}px`;
    placeholder.style.minWidth = `${rect.width}px`;
    placeholder.style.flexShrink = "0";
    placeholder.style.marginBottom = "20px";
    placeholder.style.borderRadius = "24px";
    placeholder.style.border = "2px dashed #D1D1D1";
    placeholder.style.backgroundColor = "rgba(0,0,0,0.02)";

    originalParent = card.parentNode;
    originalSibling = card.nextSibling;
    originalParent.insertBefore(placeholder, card);

    card.style.position = "fixed";
    card.style.width = `${rect.width}px`;
    card.style.height = `${rect.height}px`;
    card.style.zIndex = "10000";
    card.style.pointerEvents = "none";
    card.style.transform = "rotate(4deg)";
    card.style.transition = "none";

    updatePosition(touch);
    startAutoScroll();
  }

  function handleTouchMove(e) {
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];

    if (!isDragging) {
      const moveDist = Math.hypot(touch.clientX - startX, touch.clientY - startY);
      if (moveDist > 25) {
        clearTimeout(touchStartTimer);
      }
      return;
    }

    e.preventDefault();
    updatePosition(touch);
    updateDropTarget();
  }

  function updateDropTarget() {
    const elem = document.elementFromPoint(lastTouchX, lastTouchY);
    const col = elem?.closest(".kanban-column");

    document.querySelectorAll(".tasks-container").forEach((c) => {
      c.classList.remove("dragover-highlight");
    });

    if (col) {
      currentColumn = col;
      const container = col.querySelector(".tasks-container");
      if (container) {
        container.classList.add("dragover-highlight");
      }
    } else {
      currentColumn = null;
    }
  }

  function updatePosition(touch) {
    lastTouchX = touch.clientX;
    lastTouchY = touch.clientY;
    card.style.left = `${touch.clientX - offsetX}px`;
    card.style.top = `${touch.clientY - offsetY}px`;
  }

  function startAutoScroll() {
    const scrollZone = 120;
    const scrollSpeed = 10;

    const step = () => {
      if (lastTouchY > window.innerHeight - scrollZone) {
        window.scrollBy(0, scrollSpeed);
        updateDropTarget();
      } else if (lastTouchY < scrollZone && window.scrollY > 0) {
        window.scrollBy(0, -scrollSpeed);
        updateDropTarget();
      }
      autoScrollFrame = requestAnimationFrame(step);
    };

    autoScrollFrame = requestAnimationFrame(step);
  }

  function stopAutoScroll() {
    if (autoScrollFrame) cancelAnimationFrame(autoScrollFrame);
    autoScrollFrame = null;
  }

  function handleTouchEnd(e) {
    clearTimeout(touchStartTimer);

    if (!isDragging) return;
    isDragging = false;
    stopAutoScroll();
    card.classList.remove("dragging");
    document.body.classList.remove("drag-active");

    card.style.position = "";
    card.style.width = "";
    card.style.height = "";
    card.style.zIndex = "";
    card.style.pointerEvents = "";
    card.style.transform = "";
    card.style.left = "";
    card.style.top = "";
    card.style.transition = "";

    document.querySelectorAll(".tasks-container").forEach((c) => {
      c.classList.remove("dragover-highlight");
    });

    if (currentColumn) {
      const container = currentColumn.querySelector(".tasks-container");
      if (container) {
        container.appendChild(card);
        const taskId = (card.dataset.taskId || card.id).replace("task-card-", "");
        updateTaskProgressInFirebase(taskId, getNewProgressFromDropZone(container));
      }
    } else {
      originalParent.insertBefore(card, placeholder);
    }

    if (placeholder) {
      placeholder.remove();
      placeholder = null;
    }

    checkColumnVisibility();
  }
}
