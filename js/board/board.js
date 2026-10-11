import { getAllTasks } from "../firebase/firebaseTasks.js";
import { getContacts } from "../firebase/firebaseContacts.js";
import { showPopup } from "../ui/feedback.js";
import { renderTasks, setBoardContacts } from "./boardRender.js";
import { checkColumnVisibility } from "./boardColumns.js";
import { handleTaskCardClick, closeOverlayOnBtn } from "./boardDetail.js";
import { initDragAndDrop } from "./dragDrop/boardDragDrop.js";
import {
  initAddTaskOverlay,
  openAddTaskOverlay,
  closeAddTaskOverlay,
  populateOverlayContacts,
} from "./addOverlay/boardAddOverlay.js";
import { openEditTaskOverlay, closeEditOverlay } from "./editTask/boardEditTask.js";

const overlay = document.getElementById("taskDetailOverlay");

/**
 * Sets up the board, loads tasks and contacts and renders the cards.
 */
async function initBoard() {
  initBoardInteractions();
  initAddTaskOverlay();
  const [tasksResult, contactsResult] = await Promise.allSettled([getAllTasks(), getContacts()]);
  applyContactsResult(contactsResult);
  applyTasksResult(tasksResult);
  initDragAndDrop();
  checkColumnVisibility();
}

/**
 * Connects card clicks, keyboard, overlays and search.
 */
function initBoardInteractions() {
  initTaskCardClicks();
  initTaskCardKeyboard();
  initEscapeKeyClose();
  initOverlayClose();
  initEditButtonClicks();
  initSearch();
}

/**
 * Stores the loaded contacts or reports that they could not be loaded.
 * @param {PromiseSettledResult<Object[]>} result - Result of loading the contacts.
 */
function applyContactsResult(result) {
  if (result.status === "fulfilled") {
    setBoardContacts(result.value);
    populateOverlayContacts();
  } else {
    setBoardContacts([]);
    showPopup("Contacts could not be loaded for the board.", "info");
  }
}

/**
 * Renders the loaded tasks or reports that they could not be loaded.
 * @param {PromiseSettledResult<Object[]>} result - Result of loading the tasks.
 */
function applyTasksResult(result) {
  if (result.status === "fulfilled") {
    renderTasks(result.value);
  } else {
    showPopup("Tasks could not be loaded for the board.", "info");
  }
}

/**
 * Opens the detail view when a card is clicked.
 */
function initTaskCardClicks() {
  document.addEventListener("click", (event) => {
    const card = event.target.closest(".task-card");
    if (!card) return;
    handleTaskCardClick(event, card);
  });
}

/**
 * Opens the detail view of a focused card with Enter or Space.
 */
function initTaskCardKeyboard() {
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    const card = event.target.closest?.(".task-card");
    if (!card || event.target !== card) return;
    event.preventDefault();
    handleTaskCardClick(event, card);
  });
}

/**
 * Closes the open overlay with the Escape key.
 */
function initEscapeKeyClose() {
  document.addEventListener("keydown", handleEscapeKey);
}

/**
 * Closes the add overlay, the edit form or the detail view, in this order.
 * @param {KeyboardEvent} event - The keydown event.
 */
function handleEscapeKey(event) {
  if (event.key !== "Escape") return;
  if (document.getElementById("addTaskOverlay")?.classList.contains("active")) {
    closeAddTaskOverlay();
    return;
  }
  if (!overlay?.classList.contains("active")) return;
  if (overlay.querySelector(".edit-overlay-card")) {
    closeEditOverlay();
    return;
  }
  closeOverlayOnBtn();
}

/**
 * Closes the detail view on a click on the dark background.
 */
function initOverlayClose() {
  overlay?.addEventListener("click", (event) => {
    if (event.target === overlay) closeOverlayOnBtn();
  });
}

/**
 * Opens the edit form when the edit button of the detail view is clicked.
 */
function initEditButtonClicks() {
  overlay?.addEventListener("click", (event) => {
    const editButton = event.target.closest(".btn-edit");
    if (editButton) openEditTaskOverlay(editButton.id.replace("editTaskBtn-", ""));
  });
}

/**
 * Filters the cards while the user types into the search field.
 */
function initSearch() {
  const searchInput = document.getElementById("searchInput");
  if (!searchInput) return;
  searchInput.addEventListener("input", (event) => {
    filterTasks(event.target.value.toLowerCase());
  });
}

/**
 * Shows only the cards whose title or description contains the search text.
 * @param {string} searchText - Lowercase search text.
 */
function filterTasks(searchText) {
  document.querySelectorAll(".task-card").forEach((card) => {
    card.style.display = cardMatchesSearch(card, searchText) ? "" : "none";
  });
  checkColumnVisibility();
}

/**
 * Checks whether a card matches the search text.
 * @param {HTMLElement} card - The task card.
 * @param {string} searchText - Lowercase search text.
 * @returns {boolean} True if the card should be visible.
 */
function cardMatchesSearch(card, searchText) {
  const title = card.querySelector(".task-title")?.textContent.toLowerCase() || "";
  const description = card.querySelector(".task-description")?.textContent.toLowerCase() || "";
  return searchText === "" || title.includes(searchText) || description.includes(searchText);
}

window.openAddTaskOverlay = openAddTaskOverlay;
document.addEventListener("DOMContentLoaded", initBoard);
