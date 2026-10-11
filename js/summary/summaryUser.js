import { getStoredCurrentUser } from "../core/utility.js";
import { getUserById } from "../firebase/firebaseUsers.js";
import { getAllTasks } from "../firebase/firebaseTasks.js";

const PROGRESS = {
  TODO: "toDo",
  IN_PROGRESS: "inProgress",
  AWAIT_FEEDBACK: "awaitFeedback",
  DONE: "done",
};

const PRIORITY = {
  URGENT: "Urgent",
  HIGH: "High",
  MEDIUM: "Medium",
  LOW: "Low",
};

const DATE_FORMAT = { year: "numeric", month: "long", day: "numeric" };
const SPLASH_MAX_WIDTH = 750;

let currentUser = null;
let allTasks = [];

/**
 * Loads all tasks and then renders the summary for the logged-in user.
 */
async function loadSummary() {
  try {
    allTasks = await getAllTasks();
  } catch {
    allTasks = [];
  }
  loadUserData();
}

/**
 * Loads the profile of the stored user, without a stored user it returns to the login page.
 */
function loadUserData() {
  currentUser = getStoredCurrentUser();
  if (!currentUser) {
    window.location.href = "../../index.html";
    return;
  }
  getUserById(currentUser.uid)
    .then((user) => {
      currentUser = user;
      renderSummaryForUser(currentUser);
    })
    .catch(() => renderSummaryForUser(currentUser));
}

/**
 * Renders the greeting name and all counters of the summary.
 * @param {Object} user - The logged-in user.
 */
function renderSummaryForUser(user) {
  renderUsername(user);
  updateTaskCount("summaryUserToDoCount", allTasks, PROGRESS.TODO);
  updateTaskCount("summaryUserDoneCount", allTasks, PROGRESS.DONE);
  updateTaskCount("summaryUserInProgressCount", allTasks, PROGRESS.IN_PROGRESS);
  updateTaskCount("summaryUserAwaitFeedbackCount", allTasks, PROGRESS.AWAIT_FEEDBACK);
  updateUrgentTasksAndDeadline(allTasks);
  updateTotalTasksOnBoard();
}

/**
 * Writes the name of the user into the greeting.
 * @param {Object} user - The logged-in user.
 */
function renderUsername(user) {
  const usernameTarget = document.getElementById("shownUsernameOnSummary");
  if (usernameTarget) {
    usernameTarget.textContent = getDisplayedUsername(user);
  }
}

/**
 * Returns the name for the greeting, guests are greeted without a name.
 * @param {Object} user - The logged-in user.
 * @returns {string} The name to show.
 */
function getDisplayedUsername(user) {
  if (user.username === "Guest") return "";
  return user.username || user.name || "Unknown";
}

/**
 * Shows how many tasks are in one board column.
 * @param {string} elementId - Id of the counter element.
 * @param {Object[]} tasks - All tasks.
 * @param {string} progress - The column, for example "toDo".
 */
function updateTaskCount(elementId, tasks, progress) {
  const element = document.getElementById(elementId);
  if (element) {
    element.textContent = tasks.filter((task) => task.progress === progress).length;
  }
}

/**
 * Checks whether a task is urgent and not done yet.
 * @param {Object} task - The task.
 * @returns {boolean} True for open urgent tasks.
 */
function isOpenUrgentTask(task) {
  const isUrgent = task.priority === PRIORITY.URGENT || task.priority === PRIORITY.HIGH;
  return isUrgent && task.progress !== PROGRESS.DONE;
}

/**
 * Finds the earliest due date of the given tasks.
 * @param {Object[]} tasks - The tasks.
 * @returns {Date|null} The earliest date or null.
 */
function getNextDueDate(tasks) {
  let nextDate = null;
  tasks.forEach((task) => {
    const dueDate = new Date(task.dueDate);
    if (!nextDate || dueDate < nextDate) nextDate = dueDate;
  });
  return nextDate;
}

/**
 * Shows the number of open urgent tasks and the next urgent deadline.
 * @param {Object[]} tasks - All tasks.
 */
function updateUrgentTasksAndDeadline(tasks) {
  const urgentTasks = tasks.filter(isOpenUrgentTask);
  const countElement = document.getElementById("summaryUserUrgentCount");
  if (countElement) countElement.textContent = urgentTasks.length;
  renderNextUrgentDate(getNextDueDate(urgentTasks));
}

/**
 * Writes the next urgent deadline into the summary.
 * @param {Date|null} nextUrgentDate - The deadline or null.
 */
function renderNextUrgentDate(nextUrgentDate) {
  const dateElement = document.getElementById("summaryUserUrgentDate");
  if (!dateElement) return;
  if (nextUrgentDate) {
    dateElement.textContent = nextUrgentDate.toLocaleDateString("en-US", DATE_FORMAT);
  } else {
    dateElement.textContent = "No urgent tasks";
  }
}

/**
 * Shows the total number of tasks on the board.
 */
function updateTotalTasksOnBoard() {
  const element = document.getElementById("summaryAllTasksOnBoardCount");
  if (element) {
    element.textContent = allTasks.length;
  }
}

/**
 * Builds the greeting of the mobile splash screen.
 * @param {Object|null} user - The stored user.
 * @returns {string} The greeting.
 */
function getGreeting(user) {
  if (user?.username && user.username !== "Guest") {
    return `Good morning, ${user.username}!`;
  }
  return "Good morning!";
}

/**
 * Shows the greeting as a full screen splash on small screens before the summary appears.
 */
function showMobileSplash() {
  const splash = document.getElementById("splash-screen");
  const main = document.querySelector(".main-content-summary");
  if (!splash || !main || window.innerWidth >= SPLASH_MAX_WIDTH) {
    if (splash) splash.style.display = "none";
    return;
  }
  splash.textContent = getGreeting(getStoredCurrentUser());
  main.style.visibility = "hidden";
  splash.style.display = "flex";
  setTimeout(() => fadeOutSplash(splash, main), 2000);
}

/**
 * Fades the splash screen out and shows the summary.
 * @param {HTMLElement} splash - The splash screen.
 * @param {HTMLElement} main - The summary content.
 */
function fadeOutSplash(splash, main) {
  splash.style.opacity = 0;
  setTimeout(() => {
    splash.style.display = "none";
    main.style.visibility = "visible";
  }, 500);
}

document.addEventListener("DOMContentLoaded", loadSummary);
document.addEventListener("DOMContentLoaded", showMobileSplash);
