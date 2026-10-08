import {
  toggleUrgentButtonOnClick,
  toggleMediumButtonOnClick,
  toggleLowButtonOnClick,
  removeClickedFromPriorityButtons,
} from "./addTaskPriorityButtons.js";

function setBorderColor(id, color = "") {
  const input = document.getElementById(id);
  if (input) input.style.borderColor = color;
}

function toggleHint(hintId, show) {
  const hint = document.getElementById(hintId);
  if (hint) hint.classList.toggle("show", show);
}

export function applyContentLimits() {
  const titleInput = document.getElementById("taskTitle");
  const descriptionInput = document.getElementById("taskDescription");
  const subtaskInput = document.getElementById("subtasks");
  const selectInput = document.getElementById("selectedBox");

  if (titleInput) titleInput.maxLength = 80;
  if (descriptionInput) descriptionInput.maxLength = 500;
  if (subtaskInput) subtaskInput.maxLength = 120;
  if (selectInput) selectInput.maxLength = 120;
}

export function initBlurValidation({ getTitle, getDueDate, getCategory }) {
  const titleInput = document.getElementById("taskTitle");
  const dueDateInput = document.getElementById("taskDate");
  const categoryInput = document.getElementById("categorySelect");

  titleInput?.addEventListener("blur", () => {
    const invalid = !getTitle().trim();
    setBorderColor("taskTitle", invalid ? "red" : "");
    toggleHint("taskTitleHint", invalid);
  });

  dueDateInput?.addEventListener("blur", () => {
    const invalid = !getDueDate();
    setBorderColor("taskDate", invalid ? "red" : "");
    toggleHint("taskDateHint", invalid);
  });

  categoryInput?.addEventListener("blur", () => {
    const invalid = !getCategory();
    setBorderColor("categorySelect", invalid ? "red" : "");
    toggleHint("categoryHint", invalid);
  });
}

export function validateTaskForm({ getTitle, getDueDate, getCategory }) {
  const taskName = getTitle().trim();
  const taskDate = getDueDate();
  const taskCategory = getCategory();

  const titleInvalid = !taskName;
  const dateInvalid = !taskDate;
  const categoryInvalid = !taskCategory;

  setBorderColor("taskTitle", titleInvalid ? "red" : "");
  setBorderColor("taskDate", dateInvalid ? "red" : "");
  setBorderColor("categorySelect", categoryInvalid ? "red" : "");

  toggleHint("taskTitleHint", titleInvalid);
  toggleHint("taskDateHint", dateInvalid);
  toggleHint("categoryHint", categoryInvalid);

  return !(titleInvalid || dateInvalid || categoryInvalid);
}

export function resetAddTaskForm({ checkboxList, selectBox, resetPriority }) {
  const titleInput = document.getElementById("taskTitle");
  const descriptionInput = document.getElementById("taskDescription");
  const dueDateInput = document.getElementById("taskDate");
  const subtasksList = document.getElementById("subtasksList");
  const subtaskInput = document.getElementById("subtasks");
  const categorySelect = document.getElementById("categorySelect");

  if (titleInput) titleInput.value = "";
  if (descriptionInput) descriptionInput.value = "";
  if (dueDateInput) dueDateInput.value = "";
  if (subtaskInput) subtaskInput.value = "";
  if (subtasksList) subtasksList.innerHTML = "";
  if (categorySelect) categorySelect.value = "";
  if (selectBox) selectBox.value = "";

  const assignedIcons = document.getElementById("assignedIcons");
  if (assignedIcons) assignedIcons.innerHTML = "";

  checkboxList?.querySelectorAll(".assignedToCheckbox").forEach((cb) => {
    cb.checked = false;
  });

  removeClickedFromPriorityButtons();
  const mediumBtn = document.getElementById("priorityMediumBtn");
  if (mediumBtn) {
    mediumBtn.classList.add("clicked");
    toggleMediumButtonOnClick(mediumBtn);
  }

  resetPriority();
  setBorderColor("taskTitle");
  setBorderColor("taskDate");
  setBorderColor("categorySelect");

  toggleHint("taskTitleHint", false);
  toggleHint("taskDateHint", false);
  toggleHint("categoryHint", false);
}

export function initPriorityButtons({ lowBtn, mediumBtn, urgentBtn, priorities, setPriority }) {
  const configs = [
    { button: lowBtn, value: priorities.low, toggle: toggleLowButtonOnClick },
    { button: mediumBtn, value: priorities.medium, toggle: toggleMediumButtonOnClick },
    { button: urgentBtn, value: priorities.urgent, toggle: toggleUrgentButtonOnClick },
  ];

  configs.forEach(({ button, value, toggle }) => {
    button?.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (button.classList.contains("clicked")) return;

      setPriority(value);
      removeClickedFromPriorityButtons();
      button.classList.add("clicked");
      toggle(button);
    });
  });

  if (mediumBtn) {
    mediumBtn.classList.add("clicked");
    toggleMediumButtonOnClick(mediumBtn);
    setPriority(priorities.medium);
  }
}
