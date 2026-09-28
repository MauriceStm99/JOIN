import { getTask, updateTask } from "./firebase.js";
import { assigneeAvatarTemplate, editTaskFormTemplate } from "../templates/boardTasksTemplates.js";
import { iconTemplate } from "../templates/profileTemplates.js";
import { escapeHtml, getInitials, getStoredCurrentUser, returnContactById } from "./utility.js";
import { showPopup } from "./feedback.js";

export function createBoardEditTaskController({ overlay, getContactsList, refreshTaskCard, showTaskDetail }) {
  function getContacts() {
    const contacts = getContactsList?.();
    return Array.isArray(contacts) ? contacts : [];
  }

  async function openEditTaskOverlay(taskId) {
    try {
      const task = await getTask(taskId);
      const detailCard = overlay.querySelector(`#overlayDetailCard-${taskId}`);
      if (!detailCard) return;
      detailCard.classList.add("editing");
      detailCard.insertAdjacentHTML("beforeend", editTaskFormTemplate(task));
      initEditModeSubtasks(task);
      attachEditFormEventListeners(taskId);
    } catch (error) {
      showPopup(error.message || "Could not open the edit form.");
    }
  }

  function attachEditFormEventListeners(taskId) {
    overlay.querySelector("#editOverlayCloseBtn")?.addEventListener("click", closeEditOverlay);
    initEditPriorityButtons(taskId);
    initEditDropdown(taskId);
    initEditAssignedTo(taskId);
    initEditSubtaskButtons(taskId);
    initEditBlurValidation(taskId);
    applyEditContentLimits(taskId);
    initEditFormSubmit(taskId);
  }

  function populateContactList(listEl, task) {
    const currentUser = getStoredCurrentUser();
    const sortedContacts = [...getContacts()].sort((a, b) => {
      if (currentUser && a.id === currentUser.uid) return -1;
      if (currentUser && b.id === currentUser.uid) return 1;
      return a.name.localeCompare(b.name);
    });

    listEl.innerHTML = "";
    sortedContacts.forEach((contact) => {
      const isYou = currentUser && contact.id === currentUser.uid;
      const displayName = isYou ? `${contact.name} (You)` : contact.name;
      const isChecked = Array.isArray(task.assignedTo) && task.assignedTo.includes(contact.id);
      const avatarIcon = iconTemplate(getInitials(contact.name), contact.color);
      const label = document.createElement("label");

      label.className = "checkbox-item";
      label.innerHTML = `
        <div class="assignedToCheckboxNameIcon">${avatarIcon} ${escapeHtml(displayName)}</div>
        <input
          type="checkbox"
          class="assignedToCheckbox"
          name="assignedTo"
          value="${escapeHtml(contact.id)}"
          ${isChecked ? "checked" : ""}
        >
      `;
      listEl.appendChild(label);
    });
  }

  function updateAssignedToSummary(listEl, selectedBox, iconsEl) {
    const checkedIds = [...listEl.querySelectorAll(".assignedToCheckbox")]
      .filter((checkbox) => checkbox.checked)
      .map((checkbox) => checkbox.value);

    if (selectedBox) selectedBox.value = "";
    if (!iconsEl) return;

    iconsEl.innerHTML = "";
    checkedIds.forEach((id) => {
      const contact = returnContactById(id, getContacts());
      if (!contact) return;
      iconsEl.insertAdjacentHTML("beforeend", assigneeAvatarTemplate(getInitials(contact.name), contact.color));
    });
  }

  function initEditAssignedTo(taskId) {
    const listEl = overlay.querySelector(`#editCheckboxList-${taskId}`);
    const selectedBox = overlay.querySelector(`#editSelectedBox-${taskId}`);
    const iconsEl = overlay.querySelector(`#editAssignees-${taskId}`);
    if (!listEl) return;

    getTask(taskId).then((task) => {
      populateContactList(listEl, task);
      const syncSummary = () => updateAssignedToSummary(listEl, selectedBox, iconsEl);
      syncSummary();
      listEl.addEventListener("change", syncSummary);
    }).catch((error) => {
      showPopup(error.message || "Assigned contacts could not be loaded.", "info");
    });
  }

  function initEditModeSubtasks(task) {
    const subtasksList = overlay.querySelector(`#editSubtasksList-${task.id}`);
    if (!subtasksList) return;

    subtasksList.innerHTML = "";
    if (!Array.isArray(task.subtasks) || task.subtasks.length === 0) return;

    task.subtasks.forEach((subtask) => {
      subtasksList.insertAdjacentHTML("beforeend", createEditSubtaskElement(subtask.text, subtask.completed));
      addEditSubtaskEventListeners(subtasksList.lastElementChild);
    });
  }

  function createEditSubtaskElement(subtaskText, completed = false) {
    return `
      <div class="subtask-label" data-completed="${completed ? "true" : "false"}">
        <div class="subtask-label-left">
          <div class="point"></div>
          <span>${escapeHtml(subtaskText)}</span>
        </div>
        <div class="edit-delete-subtask-buttons">
          <button class="edit-subtask-button-size" type="button" aria-label="Edit subtask">
            <img src="./assets/contacts/editButton.svg" alt="">
          </button>
          <div class="dividing-line"></div>
          <button class="delete-subtask-button-size" type="button" aria-label="Delete subtask">
            <img src="./assets/contacts/deleteButton.svg" alt="">
          </button>
        </div>
        <div class="edit-mode-buttons">
          <button class="cancel-subtask-button-size" type="button" aria-label="Cancel edit">
            <img src="./assets/utilitys/close.svg" alt="Cancel">
          </button>
          <div class="dividing-line"></div>
          <button class="confirm-subtask-button-size" type="button" aria-label="Confirm edit">
            <img src="./assets/utilitys/check.svg" alt="Confirm">
          </button>
        </div>
      </div>
    `;
  }

  function addEditSubtaskEventListeners(subtaskElement) {
    const editBtn = subtaskElement.querySelector(".edit-subtask-button-size");
    const deleteBtn = subtaskElement.querySelector(".delete-subtask-button-size");
    const cancelBtn = subtaskElement.querySelector(".cancel-subtask-button-size");
    const confirmBtn = subtaskElement.querySelector(".confirm-subtask-button-size");
    const textSpan = subtaskElement.querySelector("span");

    let originalText = "";

    const startEditing = () => {
      if (!textSpan) return;
      originalText = textSpan.textContent.trim();
      textSpan.contentEditable = true;
      textSpan.focus();
      subtaskElement.classList.add("subtask-label-active");

      const range = document.createRange();
      range.selectNodeContents(textSpan);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
    };

    const stopEditing = () => {
      if (textSpan) textSpan.contentEditable = false;
      subtaskElement.classList.remove("subtask-label-active");
    };

    subtaskElement.addEventListener("dblclick", (event) => {
      event.preventDefault();
      startEditing();
    });

    editBtn?.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      startEditing();
    });

    deleteBtn?.addEventListener("click", (event) => {
      event.preventDefault();
      subtaskElement.remove();
    });

    cancelBtn?.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (textSpan) textSpan.textContent = originalText;
      stopEditing();
    });

    confirmBtn?.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      stopEditing();
    });

    textSpan?.addEventListener("keydown", (keyboardEvent) => {
      if (keyboardEvent.key !== "Enter") return;
      keyboardEvent.preventDefault();
      stopEditing();
    });
  }

  function initEditPriorityButtons(taskId) {
    const priorityButtons = overlay.querySelectorAll(`#editTaskForm-${taskId} .edit-priority-btn`);

    getTask(taskId).then((task) => {
      const initialPriority = task?.priority || "Medium";
      priorityButtons.forEach((button) => {
        if (button.dataset.priority !== initialPriority) return;
        button.classList.add(`edit-priority-${initialPriority.toLowerCase()}-active`);
      });
    });

    priorityButtons.forEach((button) => {
      button.addEventListener("click", (event) => {
        event.preventDefault();
        priorityButtons.forEach((priorityButton) => {
          priorityButton.classList.remove(
            "edit-priority-urgent-active",
            "edit-priority-medium-active",
            "edit-priority-low-active",
          );
        });
        button.classList.add(`edit-priority-${button.dataset.priority.toLowerCase()}-active`);
      });
    });
  }

  function initEditDropdown(taskId) {
    const selectedBox = overlay.querySelector(`#editSelectedBox-${taskId}`);
    const checkboxList = overlay.querySelector(`#editCheckboxList-${taskId}`);
    const selectArrow = overlay.querySelector(`#editSelectedBoxArrow-${taskId}`);

    const toggleList = () => {
      checkboxList?.classList.toggle("active");
      if (!checkboxList?.classList.contains("active")) return;

      const onDocumentClick = (docEvent) => {
        if (
          checkboxList.contains(docEvent.target) ||
          selectedBox.contains(docEvent.target) ||
          selectArrow?.contains(docEvent.target)
        ) return;
        checkboxList.classList.remove("active");
        document.removeEventListener("click", onDocumentClick);
      };

      document.addEventListener("click", onDocumentClick);
    };

    selectedBox?.addEventListener("click", (event) => {
      event.stopPropagation();
      toggleList();
    });

    selectArrow?.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      toggleList();
    });
  }

  function applyEditContentLimits(taskId) {
    const titleInput = overlay.querySelector(`#editTaskTitle-${taskId}`);
    const descriptionInput = overlay.querySelector(`#editTaskDescription-${taskId}`);
    const subtaskInput = overlay.querySelector(`#editSubtasks-${taskId}`);

    if (titleInput) titleInput.maxLength = 80;
    if (descriptionInput) descriptionInput.maxLength = 500;
    if (subtaskInput) subtaskInput.maxLength = 120;
  }

  function initEditBlurValidation(taskId) {
    const titleInput = overlay.querySelector(`#editTaskTitle-${taskId}`);
    const dateInput = overlay.querySelector(`#editTaskDate-${taskId}`);

    titleInput?.addEventListener("blur", () => {
      if (titleInput.value.trim()) {
        titleInput.style.borderColor = "";
        return;
      }

      titleInput.style.borderColor = "red";
      showPopup("Please enter a task title.", "info");
    });

    dateInput?.addEventListener("blur", () => {
      if (dateInput.value) {
        dateInput.style.borderColor = "";
        return;
      }

      dateInput.style.borderColor = "red";
      showPopup("Please select a due date.", "info");
    });
  }

  function initEditSubtaskButtons(taskId) {
    const addBtn = overlay.querySelector(`#editAddSubtaskBtn-${taskId}`);
    const removeBtn = overlay.querySelector(`#editRemoveSubtaskBtn-${taskId}`);
    const input = overlay.querySelector(`#editSubtasks-${taskId}`);
    const list = overlay.querySelector(`#editSubtasksList-${taskId}`);

    addBtn?.addEventListener("click", (event) => {
      event.preventDefault();
      const text = input?.value.trim();
      if (!text || !list) return;

      list.insertAdjacentHTML("beforeend", createEditSubtaskElement(text));
      addEditSubtaskEventListeners(list.lastElementChild);
      input.value = "";
    });

    removeBtn?.addEventListener("click", (event) => {
      event.preventDefault();
      list?.lastElementChild?.remove();
    });
  }

  function initEditFormSubmit(taskId) {
    overlay.querySelector(`#editTaskForm-${taskId}`)?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const title = overlay.querySelector(`#editTaskTitle-${taskId}`)?.value;
      if (!title?.trim()) {
        showPopup("Please enter a task title.", "info");
        return;
      }

      const dateInput = overlay.querySelector(`#editTaskDate-${taskId}`);
      if (dateInput?.value && dateInput.min && dateInput.value < dateInput.min) {
        showPopup("The due date cannot be in the past.", "info");
        return;
      }

      try {
        const updateData = collectEditFormData(taskId);
        await updateTask(taskId, updateData);
        const updatedTask = await getTask(taskId);
        await refreshTaskCard(taskId, updatedTask);
        closeEditOverlay();
        showTaskDetail(updatedTask);
        overlay.querySelector(".overlay-detail-card")?.classList.add("no-animation");
      } catch (error) {
        showPopup(error.message || "Task could not be updated.");
      }
    });
  }

  function collectEditFormData(taskId) {
    const title = overlay.querySelector(`#editTaskTitle-${taskId}`)?.value.trim();
    const description = overlay.querySelector(`#editTaskDescription-${taskId}`)?.value || "";
    const dueDate = overlay.querySelector(`#editTaskDate-${taskId}`)?.value || "";
    const category = overlay.querySelector(`#editTaskCategory-${taskId}`)?.value || "No Category";
    const activePriorityBtn = overlay.querySelector(`#editTaskForm-${taskId} .edit-priority-btn[class*="-active"]`);
    const priority = activePriorityBtn?.dataset.priority || "Medium";
    const assignedTo = [...overlay.querySelectorAll(`#editCheckboxList-${taskId} .assignedToCheckbox:checked`)]
      .map((checkbox) => checkbox.value);
    const subtasks = [...overlay.querySelectorAll(`#editSubtasksList-${taskId} .subtask-label`)]
      .map((label) => ({
        text: label.querySelector("span")?.textContent.trim() || "",
        completed: label.dataset.completed === "true",
      }))
      .filter((subtask) => subtask.text);

    return { title, description, dueDate, priority, category, assignedTo, subtasks };
  }

  function closeEditOverlay() {
    overlay.querySelector(".edit-overlay-card")?.remove();
    overlay.querySelector(".overlay-detail-card")?.classList.remove("editing");
  }

  return {
    openEditTaskOverlay,
    closeEditOverlay,
  };
}
