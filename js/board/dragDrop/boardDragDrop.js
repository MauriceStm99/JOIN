import { initTouchDrag } from "./boardTouchDrag.js";
import { checkColumnVisibility, clearDropHighlights, moveCardToContainer } from "../boardColumns.js";

let dragActivateTimer = null;

/**
 * Makes all cards draggable and all columns drop zones.
 */
export function initDragAndDrop() {
  document.querySelectorAll('[draggable="true"]').forEach((card) => attachDragHandlers(card));
  document.querySelectorAll(".kanban-column").forEach((zone) => {
    zone.addEventListener("dragover", handleDragOver);
    zone.addEventListener("dragenter", handleDragEnter);
    zone.addEventListener("dragleave", handleDragLeave);
    zone.addEventListener("drop", handleDrop);
  });
  document.addEventListener("dragend", handleDragEnd);
}

/**
 * Makes a card draggable with mouse and finger.
 * @param {HTMLElement} card - The task card.
 */
export function attachDragHandlers(card) {
  card.addEventListener("dragstart", handleDragStart);
  initTouchDrag(card);
}

/**
 * Stores the dragged card and marks the board as dragging.
 * @param {DragEvent} event - The dragstart event.
 */
function handleDragStart(event) {
  const card = event.target.closest('[draggable="true"]');
  event.dataTransfer.setData("text/plain", card.id);
  card.classList.add("dragging");
  dragActivateTimer = setTimeout(() => document.body.classList.add("drag-active"), 0);
}

/**
 * Removes all drag markers when the drag ends.
 * @param {DragEvent} event - The dragend event.
 */
function handleDragEnd(event) {
  const card = event.target.closest('[draggable="true"]');
  if (card) card.classList.remove("dragging");
  clearTimeout(dragActivateTimer);
  document.body.classList.remove("drag-active");
  clearDropHighlights();
}

/**
 * Allows dropping on a column.
 * @param {DragEvent} event - The dragover event.
 */
function handleDragOver(event) {
  event.preventDefault();
  event.dataTransfer.dropEffect = "move";
}

/**
 * Highlights the column the card is dragged into.
 * @param {DragEvent} event - The dragenter event.
 */
function handleDragEnter(event) {
  event.preventDefault();
  event.currentTarget.querySelector(".tasks-container")?.classList.add("dragover-highlight");
}

/**
 * Checks whether the pointer is inside a rectangle.
 * @param {DragEvent} event - The drag event.
 * @param {DOMRect} rect - The rectangle.
 * @returns {boolean} True if the pointer is inside.
 */
function isPointerInside(event, rect) {
  const { clientX: x, clientY: y } = event;
  return x >= rect.left && x < rect.right && y >= rect.top && y < rect.bottom;
}

/**
 * Removes the highlight once the pointer really left the column.
 * @param {DragEvent} event - The dragleave event.
 */
function handleDragLeave(event) {
  const zone = event.currentTarget;
  if (isPointerInside(event, zone.getBoundingClientRect())) return;
  zone.querySelector(".tasks-container")?.classList.remove("dragover-highlight");
}

/**
 * Moves the dropped card into the column and saves its new state.
 * @param {DragEvent} event - The drop event.
 */
function handleDrop(event) {
  event.preventDefault();
  const movedCard = document.getElementById(event.dataTransfer.getData("text/plain"));
  const container = event.currentTarget.querySelector(".tasks-container");
  if (!movedCard || !container) return;
  movedCard.classList.remove("dragging");
  container.classList.remove("dragover-highlight");
  moveCardToContainer(movedCard, container);
  checkColumnVisibility();
}
