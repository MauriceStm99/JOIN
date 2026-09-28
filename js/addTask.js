import { getContacts, addEditTask, getContact } from "./firebase.js";
import {
  addAssignedToBarTask,
} from "../templates/addTaskTemplates.js";
import {
  getInitials,
  getStoredCurrentUser,
  initOutsideClickHandler,
  returnContactById,
} from "./utility.js";
import {
  applyContentLimits,
  initBlurValidation,
  validateTaskForm,
  resetAddTaskForm,
  initPriorityButtons,
} from "./addTaskFormHelpers.js";
import { getSubtasksList, initSubtaskEventListeners } from "./addTaskSubtasks.js";
import { iconTemplate } from "../templates/profileTemplates.js";
import { showPopup, showBoardToast } from "./feedback.js";

const PRIORITY = Object.freeze({
  LOW: "Low",
  MEDIUM: "Medium",
  URGENT: "Urgent",
});
let selectedPriority = PRIORITY.MEDIUM;

let priorityUrgentBtn;
let priorityMediumBtn;
let priorityLowBtn;
let selectBox;
let checkboxList;
let contactsList = [];
const selectedContactIds = new Set();

document.addEventListener("DOMContentLoaded", async () => {
    const dateInput = document.getElementById("taskDate");
  if (dateInput) {
    const today = new Date().toISOString().split("T")[0];
    dateInput.min = today;
  }
  const form = document.querySelector(".add-task-form");
  if (form) form.noValidate = true;
  const addTaskBtn = document.getElementById("addTaskBtn");
  const cancelTaskBtn = document.getElementById("cancelTaskBtn");

  priorityUrgentBtn = document.getElementById("priorityUrgentBtn");
  priorityMediumBtn = document.getElementById("priorityMediumBtn");
  priorityLowBtn = document.getElementById("priorityLowBtn");
  selectBox = document.getElementById("selectedBox");
  checkboxList = document.getElementById("chooseContactsCheckboxList");

  if (selectBox && checkboxList) {
    const selectArrow = selectBox.closest(".multi-select")?.querySelector(".select-arrow");

    const toggleCheckboxList = () => {
      const wasVisible = checkboxList.style.display === "flex";
      checkboxList.style.display = wasVisible ? "none" : "flex";
      selectBox.closest(".multi-select")?.classList.toggle("open", !wasVisible);

      if (!wasVisible) {
        initOutsideClickHandler(
          selectBox,
          () => {
            checkboxList.style.display = "none";
            selectBox.closest(".multi-select")?.classList.remove("open");
          },
          [checkboxList, selectArrow].filter(Boolean)
        );
      }
    };

    selectBox.addEventListener("click", toggleCheckboxList);

    selectArrow?.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleCheckboxList();
    });

    selectBox.addEventListener("input", () => {
      const searchTerm = selectBox.value;

      addContactsToAssignTask(contactsList, searchTerm);
      checkCheckboxChanges();
    });
  }

  initCategoryDropdown();

  addTaskBtn.addEventListener("click", (e) => {
    e.preventDefault();

    if (!validateTaskForm({
      getTitle: getTitleTask,
      getDueDate: getDueDateTask,
      getCategory: getCategoryTask,
    })) {
      return;
    }
    createTaskObject();
  });
  cancelTaskBtn.addEventListener("click", (e) => {
    e.preventDefault();
    resetTaskFormState();
  });

  applyContentLimits();
  initBlurValidation({
    getTitle: getTitleTask,
    getDueDate: getDueDateTask,
    getCategory: getCategoryTask,
  });
  addCategoryOptionsTask();
  initSubtaskEventListeners();
  initPriorityButtons({
    lowBtn: priorityLowBtn,
    mediumBtn: priorityMediumBtn,
    urgentBtn: priorityUrgentBtn,
    priorities: {
      low: PRIORITY.LOW,
      medium: PRIORITY.MEDIUM,
      urgent: PRIORITY.URGENT,
    },
    setPriority: (value) => {
      selectedPriority = value;
    },
  });
  await loadAddTaskContacts();
});

async function loadAddTaskContacts() {
  try {
    contactsList = await getContacts();
  } catch {
    contactsList = [];
    showPopup("Contacts could not be loaded right now.", "info");
  }

  addContactsToAssignTask(contactsList);
  checkCheckboxChanges();
}

function addContactsToAssignTask(contacts, filterString = "") {
  const assignedSelect = document.getElementById("chooseContactsCheckboxList");
  if (!assignedSelect) return;

  assignedSelect.innerHTML = "";

  const filteredContacts = filterString.trim()
    ? contacts.filter((contact) =>
        contact?.name?.toLowerCase().includes(filterString.toLowerCase())
      )
    : contacts;

  const currentUser = getStoredCurrentUser();
  const sortedContacts = filteredContacts.sort((a, b) => {
    if (currentUser && a.id === currentUser.uid) return -1;
    if (currentUser && b.id === currentUser.uid) return 1;

    return (a.name || "").localeCompare(b.name || "");
  });

  sortedContacts.forEach((contact) => {
    if (!contact?.id || !contact?.name) return;
    const isCurrentUser = currentUser && contact.id === currentUser.uid;
    const displayName = isCurrentUser ? `${contact.name} (You)` : contact.name;

    const option = addAssignedToBarTask(
      displayName,
      contact.id,
      iconTemplate(
        getInitials(contact.name),
        contact.color,
        "assignedToCheckboxIcon"
      )
    );

    if (typeof option === "string") {
      assignedSelect.insertAdjacentHTML("beforeend", option);
    } else if (option instanceof Node) {
      assignedSelect.appendChild(option);
    } else {
      return;
    }
  });

  assignedSelect.querySelectorAll(".assignedToCheckbox").forEach((cb) => {
    cb.checked = selectedContactIds.has(cb.value);
  });

  if (filteredContacts.length === 0) {
    assignedSelect.innerHTML =
      '<div class="no-results">No contacts found</div>';
  }
}

function getTitleTask() {
  const titleTask = document.getElementById("taskTitle").value;
  return titleTask;
}

function getDescriptionTask() {
  const descriptionTask = document.getElementById("taskDescription").value;
  return descriptionTask;
}

function getDueDateTask() {
  const dueDateTask = document.getElementById("taskDate").value;

  return dueDateTask;
}

function getPriorityTask() {
  return selectedPriority;
}

function checkCheckboxChanges() {
  if (!checkboxList || !selectBox) return;
  const checkboxes = checkboxList.querySelectorAll(".assignedToCheckbox");
  const selectedNamesIconContainer = document.getElementById("assignedIcons");

  checkboxes.forEach((cb) => {
    cb.addEventListener("change", () => {
      if (cb.checked) {
        selectedContactIds.add(cb.value);
      } else {
        selectedContactIds.delete(cb.value);
      }

      updateAssignedIcons(selectedNamesIconContainer);
    });
  });
}

function updateAssignedIcons(container) {
  if (!container) return;

  container.innerHTML = "";

  const checked = [...selectedContactIds];
  const maxVisible = 3;

  const renderIcon = (id) => {
    const contact = returnContactById(id, contactsList);
    if (!contact) return;
    const icon = iconTemplate(
      getInitials(contact.name),
      contact.color,
      "assignedToContainerChecked"
    );
    if (typeof icon === "string") {
      container.insertAdjacentHTML("beforeend", icon);
    } else if (icon instanceof Node) {
      container.appendChild(icon);
    }
  };

  checked.slice(0, maxVisible).forEach(renderIcon);

  const remaining = checked.length - maxVisible;
  if (remaining > 0) {
    const badge = document.createElement("button");
    badge.type = "button";
    badge.className = "profileIconContainer assignedToContainerChecked assigned-more-badge";
    badge.textContent = `+${remaining}`;
    badge.setAttribute("aria-label", `Show all ${checked.length} assigned contacts`);
    badge.addEventListener("click", () => {
      container.innerHTML = "";
      checked.forEach(renderIcon);
    });
    container.appendChild(badge);
  }
}

function getSelectedAssignedTo() {
  return [...selectedContactIds];
}

const CATEGORY = Object.freeze({
  TECHTASK: "Technical Task",
  USERSTORY: "User Story",
});
function addCategoryOptionsTask() {
  const list = document.getElementById("categoryOptionsList");
  if (!list) return;
  list.innerHTML = "";
  for (const key in CATEGORY) {
    const option = document.createElement("div");
    option.className = "category-option";
    option.dataset.value = CATEGORY[key];
    option.textContent = CATEGORY[key];
    list.appendChild(option);
  }
}

function initCategoryDropdown() {
  const box = document.getElementById("categorySelect");
  const arrow = document.getElementById("categoryArrow");
  const list = document.getElementById("categoryOptionsList");
  const multiSelect = box?.closest(".multi-select");
  if (!box || !list) return;

  const toggle = () => {
    const wasVisible = list.style.display === "flex";
    list.style.display = wasVisible ? "none" : "flex";
    multiSelect?.classList.toggle("open", !wasVisible);
    if (!wasVisible) {
      initOutsideClickHandler(
        box,
        () => {
          list.style.display = "none";
          multiSelect?.classList.remove("open");
        },
        [list, arrow].filter(Boolean)
      );
    }
  };

  box.addEventListener("click", toggle);
  arrow?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    toggle();
  });

  list.addEventListener("click", (event) => {
    const option = event.target.closest(".category-option");
    if (!option) return;
    box.value = option.dataset.value;
    list.style.display = "none";
    multiSelect?.classList.remove("open");
    box.style.borderColor = "";
    document.getElementById("categoryHint")?.classList.remove("show");
  });
}

function getCategoryTask() {
  const box = document.getElementById("categorySelect");
  const value = box?.value || "";
  if (value === "Select task category") {
    return "";
  }
  return value;
}

async function createTaskObject() {
  const task = {
    title: getTitleTask(),
    description: getDescriptionTask(),
    dueDate: getDueDateTask(),
    priority: getPriorityTask(),
    assignedTo: getSelectedAssignedTo(),
    category: getCategoryTask(),
    subtasks: getSubtasksList(),
  };

  const addTaskBtn = document.getElementById("addTaskBtn");
  if (addTaskBtn) addTaskBtn.style.pointerEvents = "none";

  try {
    await addEditTask(task);
    showBoardToast("Task added to board");
    resetTaskFormState();
    setTimeout(() => {
      window.location.href = "board.html";
    }, 1000);
  } catch (error) {
    showPopup(error.message || "Task could not be created.");
    throw error;
  } finally {
    if (addTaskBtn) addTaskBtn.style.pointerEvents = "";
  }

  return task;
}
function resetPrioritySelection() {
  selectedPriority = PRIORITY.MEDIUM;
}

function resetTaskFormState() {
  resetAddTaskForm({
    checkboxList,
    selectBox,
    resetPriority: resetPrioritySelection,
  });
  selectedContactIds.clear();
  addContactsToAssignTask(contactsList);
  checkCheckboxChanges();
}




