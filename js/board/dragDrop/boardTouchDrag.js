import { checkColumnVisibility, clearDropHighlights, moveCardToContainer } from "../boardColumns.js";

const TOUCH_HOLD_DELAY = 150;
const TOUCH_CANCEL_DISTANCE = 25;
const AUTO_SCROLL_ZONE = 120;
const AUTO_SCROLL_SPEED = 10;

const PLACEHOLDER_STYLES = {
  flexShrink: "0",
  marginBottom: "20px",
  borderRadius: "24px",
  border: "2px dashed #D1D1D1",
  backgroundColor: "rgba(0,0,0,0.02)",
};

const DRAGGED_CARD_STYLES = {
  position: "fixed",
  zIndex: "10000",
  pointerEvents: "none",
  transform: "rotate(4deg)",
  transition: "none",
};

const RESET_CARD_STYLES = {
  position: "",
  width: "",
  height: "",
  zIndex: "",
  pointerEvents: "",
  transform: "",
  left: "",
  top: "",
  transition: "",
};

const INITIAL_TOUCH_STATE = {
  timer: null,
  isDragging: false,
  placeholder: null,
  startX: 0,
  startY: 0,
  offsetX: 0,
  offsetY: 0,
  lastTouchX: 0,
  lastTouchY: 0,
  autoScrollFrame: null,
  currentColumn: null,
  originalParent: null,
};

const touchStates = new WeakMap();

/**
 * Returns the drag state of a card and creates it on first use.
 * @param {HTMLElement} card - The task card.
 * @returns {Object} The state of this card.
 */
function getTouchState(card) {
  if (!touchStates.has(card)) touchStates.set(card, { ...INITIAL_TOUCH_STATE });
  return touchStates.get(card);
}

/**
 * Lets a card be dragged with a finger after holding it briefly.
 * @param {HTMLElement} card - The task card.
 */
export function initTouchDrag(card) {
  card.addEventListener("touchstart", (event) => handleTouchStart(event, card), { passive: false });
  card.addEventListener("touchmove", (event) => handleTouchMove(event, card), { passive: false });
  card.addEventListener("touchend", () => handleTouchEnd(card), { passive: false });
  card.addEventListener("contextmenu", (event) => event.preventDefault());
}

/**
 * Remembers the start position and starts dragging after a short hold.
 * @param {TouchEvent} event - The touchstart event.
 * @param {HTMLElement} card - The task card.
 */
function handleTouchStart(event, card) {
  if (event.touches.length !== 1) return;
  const state = getTouchState(card);
  const touch = event.touches[0];
  const rect = card.getBoundingClientRect();
  state.startX = touch.clientX;
  state.startY = touch.clientY;
  state.offsetX = state.startX - rect.left;
  state.offsetY = state.startY - rect.top;
  state.timer = setTimeout(() => startDrag(card, touch, rect), TOUCH_HOLD_DELAY);
}

/**
 * Lifts the card, leaves a placeholder at its position and starts the auto scroll.
 * @param {HTMLElement} card - The task card.
 * @param {Touch} touch - The first touch.
 * @param {DOMRect} rect - Size and position of the card.
 */
function startDrag(card, touch, rect) {
  const state = getTouchState(card);
  state.isDragging = true;
  card.classList.add("dragging");
  document.body.classList.add("drag-active");
  state.placeholder = createPlaceholder(rect);
  state.originalParent = card.parentNode;
  state.originalParent.insertBefore(state.placeholder, card);
  Object.assign(card.style, DRAGGED_CARD_STYLES, { width: `${rect.width}px`, height: `${rect.height}px` });
  updatePosition(card, touch);
  startAutoScroll(card);
}

/**
 * Creates the dashed placeholder that keeps the space of the lifted card.
 * @param {DOMRect} rect - Size of the card.
 * @returns {HTMLDivElement} The placeholder.
 */
function createPlaceholder(rect) {
  const placeholder = document.createElement("div");
  placeholder.className = "task-card-placeholder";
  Object.assign(placeholder.style, PLACEHOLDER_STYLES, { height: `${rect.height}px`, minWidth: `${rect.width}px` });
  return placeholder;
}

/**
 * Moves the lifted card, before the drag starts a larger movement cancels it.
 * @param {TouchEvent} event - The touchmove event.
 * @param {HTMLElement} card - The task card.
 */
function handleTouchMove(event, card) {
  if (event.touches.length !== 1) return;
  const state = getTouchState(card);
  const touch = event.touches[0];
  if (!state.isDragging) {
    cancelHoldIfMoved(state, touch);
    return;
  }
  event.preventDefault();
  updatePosition(card, touch);
  updateDropTarget(card);
}

/**
 * Cancels the pending drag when the finger moved too far, the user wants to scroll.
 * @param {Object} state - The drag state.
 * @param {Touch} touch - The current touch.
 */
function cancelHoldIfMoved(state, touch) {
  const moveDistance = Math.hypot(touch.clientX - state.startX, touch.clientY - state.startY);
  if (moveDistance > TOUCH_CANCEL_DISTANCE) clearTimeout(state.timer);
}

/**
 * Highlights the column under the finger and remembers it as drop target.
 * @param {HTMLElement} card - The task card.
 */
function updateDropTarget(card) {
  const state = getTouchState(card);
  const element = document.elementFromPoint(state.lastTouchX, state.lastTouchY);
  const column = element?.closest(".kanban-column");
  clearDropHighlights();
  state.currentColumn = column || null;
  column?.querySelector(".tasks-container")?.classList.add("dragover-highlight");
}

/**
 * Moves the lifted card to the finger position.
 * @param {HTMLElement} card - The task card.
 * @param {Touch} touch - The current touch.
 */
function updatePosition(card, touch) {
  const state = getTouchState(card);
  state.lastTouchX = touch.clientX;
  state.lastTouchY = touch.clientY;
  card.style.left = `${touch.clientX - state.offsetX}px`;
  card.style.top = `${touch.clientY - state.offsetY}px`;
}

/**
 * Scrolls the page in every animation frame while the finger is near the top or bottom edge.
 * @param {HTMLElement} card - The task card.
 */
function startAutoScroll(card) {
  const state = getTouchState(card);
  /**
   * Scrolls one step and plans the next one.
   */
  function step() {
    autoScrollStep(card);
    state.autoScrollFrame = requestAnimationFrame(step);
  }
  state.autoScrollFrame = requestAnimationFrame(step);
}

/**
 * Scrolls down near the bottom edge and up near the top edge.
 * @param {HTMLElement} card - The task card.
 */
function autoScrollStep(card) {
  const { lastTouchY } = getTouchState(card);
  if (lastTouchY > window.innerHeight - AUTO_SCROLL_ZONE) {
    window.scrollBy(0, AUTO_SCROLL_SPEED);
    updateDropTarget(card);
  } else if (lastTouchY < AUTO_SCROLL_ZONE && window.scrollY > 0) {
    window.scrollBy(0, -AUTO_SCROLL_SPEED);
    updateDropTarget(card);
  }
}

/**
 * Stops the auto scroll.
 * @param {Object} state - The drag state.
 */
function stopAutoScroll(state) {
  if (state.autoScrollFrame) cancelAnimationFrame(state.autoScrollFrame);
  state.autoScrollFrame = null;
}

/**
 * Drops the card into the column under the finger or puts it back.
 * @param {HTMLElement} card - The task card.
 */
function handleTouchEnd(card) {
  const state = getTouchState(card);
  clearTimeout(state.timer);
  if (!state.isDragging) return;
  state.isDragging = false;
  stopAutoScroll(state);
  card.classList.remove("dragging");
  document.body.classList.remove("drag-active");
  Object.assign(card.style, RESET_CARD_STYLES);
  clearDropHighlights();
  dropCard(card, state);
  removePlaceholder(state);
  checkColumnVisibility();
}

/**
 * Moves the card into the target column, without a target it goes back to its old position.
 * @param {HTMLElement} card - The task card.
 * @param {Object} state - The drag state.
 */
function dropCard(card, state) {
  if (!state.currentColumn) {
    state.originalParent.insertBefore(card, state.placeholder);
    return;
  }
  const container = state.currentColumn.querySelector(".tasks-container");
  if (container) moveCardToContainer(card, container);
}

/**
 * Removes the placeholder of the lifted card.
 * @param {Object} state - The drag state.
 */
function removePlaceholder(state) {
  if (!state.placeholder) return;
  state.placeholder.remove();
  state.placeholder = null;
}
