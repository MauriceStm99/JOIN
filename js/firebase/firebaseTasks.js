import {
  doc,
  setDoc,
  deleteDoc,
  serverTimestamp,
  collection,
  getDocs,
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";
import { auth, db, toDataWithId, getDocumentWithId } from "./firebase.js";
import { seedDemoDataIfEmpty } from "./demoData.js";

const TASK_PROGRESS_STATES = ["toDo", "inProgress", "awaitFeedback", "done"];

/**
 * Creates a new task in the "To do" column.
 * @param {Object} task - Task data from the form.
 * @returns {Promise<string>} The id of the new task.
 */
export async function createTask(task) {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("Please log in again to create tasks.");
  }
  const taskRef = doc(collection(db, "tasks"));
  await setDoc(taskRef, buildNewTask(task, user.uid));
  return taskRef.id;
}

/**
 * Builds the document data for a new task.
 * @param {Object} task - Task data from the form.
 * @param {string} uid - Id of the creating user.
 * @returns {Object} The task data.
 */
function buildNewTask(task, uid) {
  const { title, description, dueDate, priority, subtasks, assignedTo, category } = task;
  return {
    title, description, dueDate, priority, subtasks, assignedTo, category,
    createdBy: uid,
    progress: "toDo",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}

/**
 * Merges new data into an existing task.
 * @param {string} taskId - Task id.
 * @param {Object} updateData - Fields to update.
 * @returns {Promise<string>} The task id.
 */
export async function updateTask(taskId, updateData) {
  const taskRef = doc(db, "tasks", taskId);
  await setDoc(taskRef, updateData, { merge: true });
  return taskRef.id;
}

/**
 * Creates a task from the add task page.
 * @param {Object} task - Task data from the form.
 * @returns {Promise<string>} The id of the new task.
 */
export async function addEditTask(task) {
  return createTask(task);
}

/**
 * Deletes a task.
 * @param {string} taskId - Task id.
 * @returns {Promise<void>} The delete operation.
 */
export function deleteTask(taskId) {
  return deleteDoc(doc(db, "tasks", taskId));
}

/**
 * Moves a task to another board column.
 * @param {string} taskId - Task id.
 * @param {string} newProgress - One of toDo, inProgress, awaitFeedback or done.
 * @returns {Promise<void>} The update.
 */
export function changeTaskProgress(taskId, newProgress) {
  if (!TASK_PROGRESS_STATES.includes(newProgress)) {
    throw new Error("Invalid progress status");
  }
  const taskRef = doc(db, "tasks", taskId);
  return setDoc(taskRef, { progress: newProgress, updatedAt: serverTimestamp() }, { merge: true });
}

/**
 * Loads a single task.
 * @param {string} taskId - Task id.
 * @returns {Promise<Object>} The task including its id.
 */
export function getTask(taskId) {
  return getDocumentWithId("tasks", taskId, "Task not found");
}

/**
 * Loads all tasks, seeds demo data first if the database is empty.
 * @returns {Promise<Object[]>} All tasks.
 */
export async function getAllTasks() {
  await seedDemoDataIfEmpty();
  const snapshot = await getDocs(collection(db, "tasks"));
  return snapshot.docs.map(toDataWithId);
}

/**
 * Loads the ids of all tasks.
 * @returns {Promise<string[]>} All task ids.
 */
export async function getTaskIds() {
  const snapshot = await getDocs(collection(db, "tasks"));
  return snapshot.docs.map((taskDoc) => taskDoc.id);
}

/**
 * Counts all and completed subtasks of a task.
 * @param {string} taskId - Task id.
 * @returns {Promise<{totalSubtasks: number, completedSubtasks: number}>} The counts.
 */
export async function getSubtasksCompletionState(taskId) {
  const task = await getTask(taskId);
  const subtasks = task.subtasks || [];
  const completedSubtasks = subtasks.filter((subtask) => subtask.completed).length;
  return { totalSubtasks: subtasks.length, completedSubtasks };
}

/**
 * Marks a subtask as done or not done.
 * @param {string} taskId - Task id.
 * @param {number} subtaskIndex - Position of the subtask.
 * @param {boolean} completed - New state.
 */
export async function changeSubtaskCompletion(taskId, subtaskIndex, completed) {
  const task = await getTask(taskId);
  const subtasks = task.subtasks || [];
  if (subtaskIndex < 0 || subtaskIndex >= subtasks.length) {
    throw new Error("Invalid subtask index");
  }
  subtasks[subtaskIndex].completed = completed;
  await updateTask(taskId, { subtasks, updatedAt: serverTimestamp() });
}
