import { createTask } from "./firebase.js";
import { iconTemplate } from "../templates/profileTemplates.js";
import { addAssignedToBarTask, addSubTask } from "../templates/addTaskTemplates.js";
import { getInitials, getStoredCurrentUser, returnContactById } from "./utility.js";
import { showBoardToast, showPopup } from "./feedback.js";

export function createBoardAddOverlayController({ getContactsList, appendNewTaskToBoard }) {
  let currentStatus = "toDo";

  function getContacts() {
    const contacts = getContactsList?.();
    return Array.isArray(contacts) ? contacts : [];
  }

  function initAddTaskOverlay() {
    const form = document.getElementById("addTaskFormOverlay");
    if (form) form.noValidate = true;

    const dateInput = document.getElementById("overlayTaskDate");
    if (dateInput) dateInput.min = new Date().toISOString().split("T")[0];

    applyOverlayContentLimits();
    initOverlayBlurValidation();
    populateOverlayContacts();
    initOverlayPriorityButtons();
    initOverlayAssignedTo();
    initOverlayCategoryArrow();
    initOverlaySubtasks();
    initOverlayFormSubmit();
    bindOverlayCloseHandlers();
  }

  function initOverlayCategoryArrow() {
    const categorySelect = document.getElementById("overlayCategory");
    const categoryArrow = document.getElementById("overlayCategoryArrow");
    categoryArrow?.addEventListener("click", () => {
      if (typeof categorySelect?.showPicker === "function") {
        categorySelect.showPicker();
      } else {
        categorySelect?.focus();
      }
    });
  }

  function bindOverlayCloseHandlers() {
    document.getElementById("addTaskCloseBtn")?.addEventListener("click", closeAddTaskOverlay);
    document.getElementById("addTaskCancelBtn")?.addEventListener("click", (event) => {
      event.preventDefault();
      resetOverlayForm();
    });
    document.getElementById("addTaskOverlay")?.addEventListener("click", (event) => {
      if (event.target !== document.getElementById("addTaskOverlay")) return;
      closeAddTaskOverlay();
    });
  }

  function openAddTaskOverlay(status) {
    currentStatus = status || "toDo";
    document.getElementById("addTaskOverlay")?.classList.add("active");
  }

  function closeAddTaskOverlay() {
    const overlay = document.getElementById("addTaskOverlay");
    overlay?.classList.add("closing");
    setTimeout(() => {
      overlay?.classList.remove("active", "closing");
      resetOverlayForm();
    }, 200);
  }

  function populateOverlayContacts() {
    const checkboxList = document.getElementById("overlayCheckboxList");
    if (!checkboxList) return;

    const currentUser = getStoredCurrentUser();
    const sortedContacts = [...getContacts()].sort((a, b) => {
      if (currentUser && a.id === currentUser.uid) return -1;
      if (currentUser && b.id === currentUser.uid) return 1;
      return (a.name || "").localeCompare(b.name || "");
    });

    checkboxList.innerHTML = "";
    sortedContacts.forEach((contact) => {
      if (!contact?.id || !contact?.name) return;
      const isCurrentUser = currentUser && contact.id === currentUser.uid;
      const displayName = isCurrentUser ? `${contact.name} (You)` : contact.name;
      const icon = iconTemplate(getInitials(contact.name), contact.color, "assignedToCheckboxIcon");
      checkboxList.insertAdjacentHTML("beforeend", addAssignedToBarTask(displayName, contact.id, icon));
    });

    attachCheckboxChangeListeners();
  }

  function initOverlayPriorityButtons() {
    const priorityBtns = document.querySelectorAll(".priority-button-group .priority-button");
    priorityBtns.forEach((button) => {
      if (button.textContent.includes("Medium")) {
        button.classList.add("priority-button-medium-active");
      }

      button.addEventListener("click", (event) => {
        event.preventDefault();
        priorityBtns.forEach((priorityButton) => {
          priorityButton.classList.remove(
            "priority-button-urgent-active",
            "priority-button-medium-active",
            "priority-button-low-active",
          );
        });

        if (button.textContent.includes("Urgent")) {
          button.classList.add("priority-button-urgent-active");
          return;
        }

        if (button.textContent.includes("Medium")) {
          button.classList.add("priority-button-medium-active");
          return;
        }

        button.classList.add("priority-button-low-active");
      });
    });
  }

  function initOverlayAssignedTo() {
    const selectBox = document.getElementById("overlaySelectedBox");
    const checkboxList = document.getElementById("overlayCheckboxList");
    const selectArrow = document.getElementById("overlaySelectedBoxArrow");
    const multiSelect = selectBox?.closest(".multi-select-overlay");
    if (!selectBox || !checkboxList) return;

    const toggleList = () => {
      const isVisible = checkboxList.style.display === "flex";
      checkboxList.style.display = isVisible ? "none" : "flex";
      multiSelect?.classList.toggle("open", !isVisible);
      if (isVisible) return;

      const closeOnOutsideClick = (docEvent) => {
        if (
          checkboxList.contains(docEvent.target) ||
          selectBox.contains(docEvent.target) ||
          selectArrow?.contains(docEvent.target)
        ) return;
        checkboxList.style.display = "none";
        multiSelect?.classList.remove("open");
        document.removeEventListener("click", closeOnOutsideClick);
      };

      document.addEventListener("click", closeOnOutsideClick);
    };

    selectBox.addEventListener("click", (event) => {
      event.stopPropagation();
      toggleList();
    });

    selectBox.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      event.stopPropagation();
      toggleList();
    });

    selectArrow?.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      toggleList();
    });
  }

  function attachCheckboxChangeListeners() {
    const checkboxes = document.querySelectorAll("#overlayCheckboxList .assignedToCheckbox");
    const selectBox = document.getElementById("overlaySelectedBox");
    const iconsContainer = document.getElementById("overlayAssignedIcons");

    checkboxes.forEach((checkbox) => {
      checkbox.addEventListener("change", () => {
        const selected = Array.from(checkboxes)
          .filter((currentCheckbox) => currentCheckbox.checked)
          .map((currentCheckbox) => returnContactById(currentCheckbox.value, getContacts())?.name)
          .filter(Boolean);

        selectBox.innerText = selected.length ? selected.join(", ") : "Select contacts to assign";
        updateOverlayAssignedIcons(iconsContainer, checkboxes);
      });
    });
  }

  function updateOverlayAssignedIcons(container, checkboxes) {
    if (!container) return;
    container.innerHTML = "";

    const checked = Array.from(checkboxes).filter((checkbox) => checkbox.checked);
    const maxVisible = 3;

    const renderIcon = (checkbox) => {
      const contact = returnContactById(checkbox.value, getContacts());
      if (!contact) return;
      container.insertAdjacentHTML(
        "beforeend",
        iconTemplate(getInitials(contact.name), contact.color, "assignedToContainerChecked"),
      );
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

  function initOverlaySubtasks() {
    const addBtn = document.getElementById("addSubtaskBtnOverlay");
    const removeBtn = document.getElementById("removeSubtaskBtnOverlay");
    const input = document.getElementById("overlaySubtask");
    const list = document.getElementById("subtasksListOverlay");
    if (!addBtn || !removeBtn || !input || !list) return;

    addBtn.addEventListener("click", (event) => {
      event.preventDefault();
      const text = input.value.trim();
      if (!text) return;
      addOverlaySubtask(text, list);
      input.value = "";
      input.focus();
    });

    removeBtn.addEventListener("click", (event) => {
      event.preventDefault();
      list.lastElementChild?.remove();
    });
  }

  function addOverlaySubtask(text, list) {
    list.insertAdjacentHTML("beforeend", addSubTask(text));
    wireOverlaySubtaskButtons(list.lastElementChild);
  }

  function startEditingOverlaySubtask(subtaskNode) {
    const textSpan = subtaskNode.querySelector("span");
    if (!textSpan) return;

    subtaskNode.dataset.originalText = textSpan.textContent.trim();
    textSpan.contentEditable = true;
    textSpan.focus();
    subtaskNode.classList.add("subtask-label-active");

    const range = document.createRange();
    range.selectNodeContents(textSpan);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  }

  function stopEditingOverlaySubtask(subtaskNode) {
    const textSpan = subtaskNode.querySelector("span");
    if (textSpan) textSpan.contentEditable = false;
    subtaskNode.classList.remove("subtask-label-active");
  }

  function wireOverlaySubtaskButtons(subtaskNode) {
    if (!subtaskNode) return;
    const editBtn = subtaskNode.querySelector(".edit-subtask-button-size");
    const deleteBtn = subtaskNode.querySelector(".delete-subtask-button-size");
    const cancelBtn = subtaskNode.querySelector(".cancel-subtask-button-size");
    const confirmBtn = subtaskNode.querySelector(".confirm-subtask-button-size");
    const textSpan = subtaskNode.querySelector("span");

    editBtn?.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      startEditingOverlaySubtask(subtaskNode);
    });

    deleteBtn?.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      subtaskNode.remove();
    });

    cancelBtn?.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (textSpan && subtaskNode.dataset.originalText) {
        textSpan.textContent = subtaskNode.dataset.originalText;
      }
      stopEditingOverlaySubtask(subtaskNode);
    });

    confirmBtn?.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      stopEditingOverlaySubtask(subtaskNode);
    });

    subtaskNode.addEventListener("dblclick", (event) => {
      event.preventDefault();
      startEditingOverlaySubtask(subtaskNode);
    });

    textSpan?.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") return;
      event.preventDefault();
      stopEditingOverlaySubtask(subtaskNode);
    });
  }

  function applyOverlayContentLimits() {
    const titleInput = document.getElementById("overlayTaskTitle");
    const descriptionInput = document.getElementById("overlayTaskDescription");
    const subtaskInput = document.getElementById("overlaySubtask");

    if (titleInput) titleInput.maxLength = 80;
    if (descriptionInput) descriptionInput.maxLength = 500;
    if (subtaskInput) subtaskInput.maxLength = 120;
  }

  function initOverlayBlurValidation() {
    const titleInput = document.getElementById("overlayTaskTitle");
    const dateInput = document.getElementById("overlayTaskDate");
    const categoryInput = document.getElementById("overlayCategory");

    titleInput?.addEventListener("blur", () => {
      const invalid = !titleInput.value.trim();
      setOverlayBorder("overlayTaskTitle", invalid);
      toggleOverlayHint("overlayTaskTitleHint", invalid);
    });

    dateInput?.addEventListener("blur", () => {
      const invalid = !dateInput.value;
      setOverlayBorder("overlayTaskDate", invalid);
      toggleOverlayHint("overlayTaskDateHint", invalid);
    });

    categoryInput?.addEventListener("blur", () => {
      const invalid = !categoryInput.value || categoryInput.value === "Select task category";
      setOverlayBorder("overlayCategory", invalid);
      toggleOverlayHint("overlayCategoryHint", invalid);
    });
  }

  function setOverlayBorder(fieldId, invalid) {
    const field = document.getElementById(fieldId);
    if (field) field.style.borderColor = invalid ? "red" : "";
  }

  function toggleOverlayHint(hintId, show) {
    const hint = document.getElementById(hintId);
    if (hint) hint.classList.toggle("show", show);
  }

  function initOverlayFormSubmit() {
    const form = document.getElementById("addTaskFormOverlay");
    if (!form) return;

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const taskData = collectOverlayFormData();
      if (!validateOverlayForm(taskData)) return;

      const newTask = { ...taskData, progress: currentStatus };
      try {
        const taskId = await createTask(newTask);
        newTask.id = taskId;
        appendNewTaskToBoard(newTask);
        resetOverlayForm();
        closeAddTaskOverlay();
        showBoardToast("Task added to board");
      } catch (error) {
        showPopup(error.message || "Task could not be created.");
      }
    });
  }

  function collectOverlayFormData() {
    const title = document.getElementById("overlayTaskTitle")?.value || "";
    const description = document.getElementById("overlayTaskDescription")?.value || "";
    const dueDate = document.getElementById("overlayTaskDate")?.value || "";
    const priority = getOverlayPriority();
    const assignedTo = getOverlayAssignedTo();
    const category = document.getElementById("overlayCategory")?.value || "";
    const subtasks = getOverlaySubtasks();

    return { title, description, dueDate, priority, assignedTo, category, subtasks };
  }

  function getOverlayPriority() {
    const activeBtn = document.querySelector(".priority-button-urgent-active, .priority-button-medium-active, .priority-button-low-active");
    if (!activeBtn) return "Medium";
    if (activeBtn.classList.contains("priority-button-urgent-active")) return "Urgent";
    if (activeBtn.classList.contains("priority-button-low-active")) return "Low";
    return "Medium";
  }

  function getOverlayAssignedTo() {
    return Array.from(document.querySelectorAll("#overlayCheckboxList .assignedToCheckbox:checked"))
      .map((checkbox) => checkbox.value);
  }

  function getOverlaySubtasks() {
    return Array.from(document.querySelectorAll("#subtasksListOverlay .subtask-label .subtask-text"))
      .map((span) => ({ text: span.textContent.trim(), completed: false }))
      .filter((subtask) => subtask.text);
  }

  function validateOverlayForm(taskData) {
    const titleInvalid = !taskData.title.trim();
    const dateInvalid = !taskData.dueDate;
    const categoryInvalid = !taskData.category || taskData.category === "Select task category";

    setOverlayBorder("overlayTaskTitle", titleInvalid);
    setOverlayBorder("overlayTaskDate", dateInvalid);
    setOverlayBorder("overlayCategory", categoryInvalid);

    toggleOverlayHint("overlayTaskTitleHint", titleInvalid);
    toggleOverlayHint("overlayTaskDateHint", dateInvalid);
    toggleOverlayHint("overlayCategoryHint", categoryInvalid);

    return !(titleInvalid || dateInvalid || categoryInvalid);
  }

  function resetOverlayForm() {
    document.getElementById("overlayTaskTitle").value = "";
    document.getElementById("overlayTaskDescription").value = "";
    document.getElementById("overlayTaskDate").value = "";
    document.getElementById("overlayCategory").selectedIndex = 0;
    document.getElementById("overlaySelectedBox").innerText = "Select contacts to assign";
    document.querySelectorAll("#overlayCheckboxList .assignedToCheckbox").forEach((checkbox) => {
      checkbox.checked = false;
    });
    document.getElementById("overlayCheckboxList").style.display = "none";
    const iconsContainer = document.getElementById("overlayAssignedIcons");
    if (iconsContainer) iconsContainer.innerHTML = "";
    document.getElementById("subtasksListOverlay").innerHTML = "";
    ["overlayTaskTitle", "overlayTaskDate", "overlayCategory"].forEach((fieldId) => setOverlayBorder(fieldId, false));
    ["overlayTaskTitleHint", "overlayTaskDateHint", "overlayCategoryHint"].forEach((hintId) => toggleOverlayHint(hintId, false));
    document.querySelectorAll(".priority-button").forEach((button) => {
      button.classList.remove(
        "priority-button-urgent-active",
        "priority-button-medium-active",
        "priority-button-low-active",
      );
      if (button.textContent.includes("Medium")) {
        button.classList.add("priority-button-medium-active");
      }
    });
  }

  return {
    initAddTaskOverlay,
    openAddTaskOverlay,
    closeAddTaskOverlay,
    populateOverlayContacts,
  };
}
