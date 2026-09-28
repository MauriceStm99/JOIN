import { addSubTask } from "../templates/addTaskTemplates.js";

function enableEditableSubtask(subtaskElement) {
  const textSpan = subtaskElement.querySelector("span");
  const pointDiv = subtaskElement.querySelector(".point");

  if (pointDiv) pointDiv.style.display = "none";
  if (textSpan) {
    textSpan.contentEditable = true;
    textSpan.focus();
  }

  subtaskElement.classList.add("subtask-label-active");

  if (!textSpan) return;
  const range = document.createRange();
  range.selectNodeContents(textSpan);
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
}

function disableEditableSubtask(subtaskElement) {
  const textSpan = subtaskElement.querySelector("span");
  const pointDiv = subtaskElement.querySelector(".point");

  if (pointDiv) pointDiv.style.display = "block";
  if (textSpan) textSpan.contentEditable = false;
  subtaskElement.classList.remove("subtask-label-active");
}

function startEditingSubtask(subtaskNode) {
  const textSpan = subtaskNode.querySelector("span");
  if (!textSpan) return;

  subtaskNode.dataset.originalText = textSpan.textContent.trim();

  enableEditableSubtask(subtaskNode);

  const closeEdit = () => {
    disableEditableSubtask(subtaskNode);
    document.removeEventListener("click", handleOutsideClick);
  };

  const handleOutsideClick = (event) => {
    if (event.target.closest(".subtask-label") !== subtaskNode) {
      closeEdit();
    }
  };

  setTimeout(() => {
    document.addEventListener("click", handleOutsideClick);
  }, 0);

  textSpan.addEventListener(
    "keydown",
    (event) => {
      if (event.key !== "Enter") return;
      event.preventDefault();
      closeEdit();
    },
    { once: true }
  );
}

function wireInlineEditButtons(subtaskNode) {
  const editBtn = subtaskNode.querySelector(".edit-subtask-button-size");
  const deleteBtn = subtaskNode.querySelector(".delete-subtask-button-size");
  const cancelBtn = subtaskNode.querySelector(".cancel-subtask-button-size");
  const confirmBtn = subtaskNode.querySelector(".confirm-subtask-button-size");
  const textSpan = subtaskNode.querySelector("span");

  if (editBtn) {
    editBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      startEditingSubtask(subtaskNode);
    });
  }

  if (deleteBtn) {
    deleteBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      subtaskNode.remove();
    });
  }

  if (cancelBtn) {
    cancelBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (textSpan && subtaskNode.dataset.originalText) {
        textSpan.textContent = subtaskNode.dataset.originalText;
      }
      disableEditableSubtask(subtaskNode);
    });
  }

  if (confirmBtn) {
    confirmBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      disableEditableSubtask(subtaskNode);
    });
  }
}

function addSubtaskEventListeners(subtaskElement) {
  wireInlineEditButtons(subtaskElement);

  subtaskElement.addEventListener("dblclick", (e) => {
    e.preventDefault();
    startEditingSubtask(subtaskElement);
  });
}

export function initSubtaskEventListeners() {
  const addSubtaskBtn = document.getElementById("addSubtaskBtn");
  const removeSubtaskBtn = document.getElementById("removeSubtaskBtn");
  const subtasksList = document.getElementById("subtasksList");
  const subtaskInput = document.getElementById("subtasks");

  const addSubtaskFromInput = () => {
    const subtaskText = subtaskInput.value.trim();
    if (!subtaskText) return;

    subtasksList.insertAdjacentHTML("beforeend", addSubTask(subtaskText));
    addSubtaskEventListeners(subtasksList.lastElementChild);
    subtaskInput.value = "";
  };

  addSubtaskBtn.addEventListener("click", (e) => {
    e.preventDefault();
    addSubtaskFromInput();
  });

  subtaskInput.addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    addSubtaskFromInput();
  });

  removeSubtaskBtn.addEventListener("click", (e) => {
    e.preventDefault();
    subtasksList.lastElementChild?.remove();
  });
}

export function getSubtasksList() {
  const subtasks = [];
  document.querySelectorAll("#subtasksList span").forEach((span) => {
    const checkbox = span.querySelector('input[type="checkbox"]');
    subtasks.push({
      text: span.textContent.trim(),
      completed: checkbox ? checkbox.checked : false,
    });
  });
  return subtasks;
}
