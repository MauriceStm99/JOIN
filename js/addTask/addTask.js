import { addEditTask } from "../firebase/firebaseTasks.js";
import {
  applyContentLimits,
  initBlurValidation,
  validateTaskForm,
  resetAddTaskForm,
  initPriorityButtons,
  toggleDropdown,
  closeDropdown,
} from "./addTaskFormHelpers.js";
import { getSubtasksList, initSubtaskEventListeners } from "./addTaskSubtasks.js";
import {
  loadAddTaskContacts,
  initAssignedDropdown,
  getSelectedAssignedTo,
  resetAssignedContacts,
} from "./addTaskContacts.js";
import { showPopup, showBoardToast } from "../ui/feedback.js";

const PRIORITY = Object.freeze({
  LOW: "Low",
  MEDIUM: "Medium",
  URGENT: "Urgent",
});

const CATEGORY = Object.freeze({
  TECHTASK: "Technical Task",
  USERSTORY: "User Story",
});

const FORM_GETTERS = {
  getTitle: getTitleTask,
  getDueDate: getDueDateTask,
  getCategory: getCategoryTask,
};

let selectedPriority = PRIORITY.MEDIUM;

/**
 * Sets up the whole add task page.
 */
async function initAddTaskPage() {
  setMinimumDueDate();
  const form = document.querySelector(".add-task-form");
  if (form) form.noValidate = true;
  initAssignedDropdown();
  initCategoryDropdown();
  initFormButtons();
  applyContentLimits();
  initBlurValidation(FORM_GETTERS);
  addCategoryOptionsTask();
  initSubtaskEventListeners();
  initPriorityButtons(getPriorityButtonConfig());
  await loadAddTaskContacts();
}

/**
 * Prevents due dates in the past.
 */
function setMinimumDueDate() {
  const dateInput = document.getElementById("taskDate");
  if (dateInput) {
    dateInput.min = new Date().toISOString().split("T")[0];
  }
}

/**
 * Connects the create and clear buttons.
 */
function initFormButtons() {
  document.getElementById("addTaskBtn").addEventListener("click", handleCreateTaskClick);
  document.getElementById("cancelTaskBtn").addEventListener("click", (event) => {
    event.preventDefault();
    resetTaskFormState();
  });
}

/**
 * Validates the form and creates the task.
 * @param {MouseEvent} event - The click event.
 */
function handleCreateTaskClick(event) {
  event.preventDefault();
  if (!validateTaskForm(FORM_GETTERS)) return;
  createTaskObject();
}

/**
 * Returns the buttons and values for the priority buttons.
 * @returns {Object} The configuration for initPriorityButtons.
 */
function getPriorityButtonConfig() {
  return {
    lowBtn: document.getElementById("priorityLowBtn"),
    mediumBtn: document.getElementById("priorityMediumBtn"),
    urgentBtn: document.getElementById("priorityUrgentBtn"),
    priorities: { low: PRIORITY.LOW, medium: PRIORITY.MEDIUM, urgent: PRIORITY.URGENT },
    setPriority: setSelectedPriority,
  };
}

/**
 * Stores the selected priority.
 * @param {string} value - Low, Medium or Urgent.
 */
function setSelectedPriority(value) {
  selectedPriority = value;
}

/**
 * Reads the title.
 * @returns {string} The title.
 */
function getTitleTask() {
  return document.getElementById("taskTitle").value;
}

/**
 * Reads the description.
 * @returns {string} The description.
 */
function getDescriptionTask() {
  return document.getElementById("taskDescription").value;
}

/**
 * Reads the due date.
 * @returns {string} The date as YYYY-MM-DD.
 */
function getDueDateTask() {
  return document.getElementById("taskDate").value;
}

/**
 * Returns the selected priority.
 * @returns {string} Low, Medium or Urgent.
 */
function getPriorityTask() {
  return selectedPriority;
}

/**
 * Renders the options of the category dropdown.
 */
function addCategoryOptionsTask() {
  const list = document.getElementById("categoryOptionsList");
  if (!list) return;
  list.innerHTML = "";
  Object.values(CATEGORY).forEach((category) => list.appendChild(createCategoryOption(category)));
}

/**
 * Creates one option of the category dropdown.
 * @param {string} category - Name of the category.
 * @returns {HTMLDivElement} The option.
 */
function createCategoryOption(category) {
  const option = document.createElement("div");
  option.className = "category-option";
  option.dataset.value = category;
  option.textContent = category;
  return option;
}

/**
 * Connects the category field, its arrow and its options.
 */
function initCategoryDropdown() {
  const box = document.getElementById("categorySelect");
  const arrow = document.getElementById("categoryArrow");
  const list = document.getElementById("categoryOptionsList");
  if (!box || !list) return;
  box.addEventListener("click", () => toggleDropdown(box, list, arrow));
  arrow?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    toggleDropdown(box, list, arrow);
  });
  list.addEventListener("click", (event) => selectCategoryOption(event, box, list));
}

/**
 * Writes the clicked category into the field and closes the list.
 * @param {MouseEvent} event - The click event.
 * @param {HTMLInputElement} box - The category field.
 * @param {HTMLElement} list - The options list.
 */
function selectCategoryOption(event, box, list) {
  const option = event.target.closest(".category-option");
  if (!option) return;
  box.value = option.dataset.value;
  closeDropdown(box, list);
  box.style.borderColor = "";
  document.getElementById("categoryHint")?.classList.remove("show");
}

/**
 * Reads the category, the placeholder counts as empty.
 * @returns {string} The category or an empty string.
 */
function getCategoryTask() {
  const value = document.getElementById("categorySelect")?.value || "";
  return value === "Select task category" ? "" : value;
}

/**
 * Collects all values of the form.
 * @returns {Object} The new task.
 */
function collectTaskData() {
  return {
    title: getTitleTask(),
    description: getDescriptionTask(),
    dueDate: getDueDateTask(),
    priority: getPriorityTask(),
    assignedTo: getSelectedAssignedTo(),
    category: getCategoryTask(),
    subtasks: getSubtasksList(),
  };
}

/**
 * Saves the task and blocks the create button while saving.
 * @returns {Promise<Object>} The saved task.
 */
async function createTaskObject() {
  const task = collectTaskData();
  const addTaskBtn = document.getElementById("addTaskBtn");
  if (addTaskBtn) addTaskBtn.style.pointerEvents = "none";
  try {
    await saveTaskAndOpenBoard(task);
  } catch (error) {
    showPopup(error.message || "Task could not be created.");
    throw error;
  } finally {
    if (addTaskBtn) addTaskBtn.style.pointerEvents = "";
  }
  return task;
}

/**
 * Saves the task, confirms it and opens the board.
 * @param {Object} task - The new task.
 */
async function saveTaskAndOpenBoard(task) {
  await addEditTask(task);
  showBoardToast("Task added to board");
  resetTaskFormState();
  setTimeout(() => {
    window.location.href = "board.html";
  }, 1000);
}

/**
 * Sets the priority back to medium.
 */
function resetPrioritySelection() {
  selectedPriority = PRIORITY.MEDIUM;
}

/**
 * Empties the whole form including the selected contacts.
 */
function resetTaskFormState() {
  resetAddTaskForm({
    checkboxList: document.getElementById("chooseContactsCheckboxList"),
    selectBox: document.getElementById("selectedBox"),
    resetPriority: resetPrioritySelection,
  });
  resetAssignedContacts();
}

document.addEventListener("DOMContentLoaded", initAddTaskPage);
