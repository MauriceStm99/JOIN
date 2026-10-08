import { getStoredCurrentUser } from "../core/utility.js";
import { getUserById, getAllTasks } from "../core/firebase.js";

let currentUser = null;
let allTasks = [];

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

document.addEventListener("DOMContentLoaded", async () => {
  try {
    allTasks = await getAllTasks();
  } catch {
    allTasks = [];
  }
  loadUserData();
});

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
    .catch(() => {
      renderSummaryForUser(currentUser);
    });
}

function renderSummaryForUser(user) {
  const usernameTarget = document.getElementById("shownUsernameOnSummary");

  if (user.username === "Guest") {
    if (usernameTarget) usernameTarget.textContent = "";
  } else if (usernameTarget) {
    usernameTarget.textContent = user.username || user.name || "Unknown";
  }

  updateTaskCount("summaryUserToDoCount", allTasks, (task) => task.progress === PROGRESS.TODO);
  updateTaskCount("summaryUserDoneCount", allTasks, (task) => task.progress === PROGRESS.DONE);
  updateTaskCount("summaryUserInProgressCount", allTasks, (task) => task.progress === PROGRESS.IN_PROGRESS);
  updateTaskCount(
    "summaryUserAwaitFeedbackCount",
    allTasks,
    (task) => task.progress === PROGRESS.AWAIT_FEEDBACK
  );

  updateUrgentTasksAndDeadline(allTasks);
  updateTotalTasksOnBoard();
}

function updateTaskCount(elementId, tasks, filterFn) {
  const count = tasks.filter(filterFn).length;
  const element = document.getElementById(elementId);
  if (element) {
    element.textContent = count;
  }
}

function updateUrgentTasksAndDeadline(tasks) {
  let nextUrgentDate = null;

  const urgentTasks = tasks.filter(
    (task) =>
      (task.priority === PRIORITY.URGENT || task.priority === PRIORITY.HIGH) &&
      task.progress !== PROGRESS.DONE
  );

  urgentTasks.forEach((task) => {
    const dueDate = new Date(task.dueDate);
    if (!nextUrgentDate || dueDate < nextUrgentDate) {
      nextUrgentDate = dueDate;
    }
  });

  const countElement = document.getElementById("summaryUserUrgentCount");
  if (countElement) countElement.textContent = urgentTasks.length;

  const dateElement = document.getElementById("summaryUserUrgentDate");
  if (!dateElement) return;

  if (nextUrgentDate) {
    const options = { year: "numeric", month: "long", day: "numeric" };
    dateElement.textContent = nextUrgentDate.toLocaleDateString("en-US", options);
  } else {
    dateElement.textContent = "No urgent tasks";
  }
}

function updateTotalTasksOnBoard() {
  const element = document.getElementById("summaryAllTasksOnBoardCount");
  if (element) {
    element.textContent = allTasks.length;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const splash = document.getElementById("splash-screen");
  const main = document.querySelector(".main-content-summary");

  if (!splash || !main || window.innerWidth >= 750) {
    if (splash) splash.style.display = "none";
    return;
  }

  const user = getStoredCurrentUser();
  let greeting = "Good morning!";

  if (user?.username && user.username !== "Guest") {
    greeting = `Good morning, ${user.username}!`;
  }

  splash.textContent = greeting;
  main.style.visibility = "hidden";
  splash.style.display = "flex";

  setTimeout(() => {
    splash.style.opacity = 0;
    setTimeout(() => {
      splash.style.display = "none";
      main.style.visibility = "visible";
    }, 500);
  }, 2000);
});
