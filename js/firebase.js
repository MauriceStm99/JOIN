import { initializeApp } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";

import {
  getFirestore,
  doc,
  setDoc,
  deleteDoc,
  serverTimestamp,
  getDoc,
  collection,
  getDocs,
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";

import { demoContacts, demoTasks } from "./demoData.js";

export const firebaseConfig = {
  apiKey: "AIzaSyCgMFf3jcbG-pl3II5aRK9r4XxfF4ysc1c",
  authDomain: "join-44e84.firebaseapp.com",
  projectId: "join-44e84",
  storageBucket: "join-44e84.firebasestorage.app",
  messagingSenderId: "80172784787",
  appId: "1:80172784787:web:2922fbb80429f90e34c166",
  measurementId: "G-TC3XZWJL58",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

export function createUser(email, password, username) {
  return createUserWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      const uid = userCredential.user.uid;

      return createOrUpdateUserProfile(uid, username, email)
        .then(() => {
          return editOrAddContact(
            uid,
            username,
            email,
            "",
            generateRandomColor()
          );
        })
        .then(() => userCredential.user);
    })
    .catch((error) => {
      let message = "Registration failed.";
      if (error.code === "auth/email-already-in-use") {
        message = "This email is already in use.";
      } else if (error.code === "auth/weak-password") {
        message = "The password is too weak.";
      } else if (error.code === "auth/invalid-email") {
        message = "Invalid email address.";
      }
      throw new Error(message);
    });
}

export function loginWithEmail(email, password) {
  return signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => userCredential.user)
    .catch((error) => {
      let message = "Login failed, check email and password.";
      if (error.code === "auth/user-not-found") {
        message = "User not found.";
      } else if (error.code === "auth/wrong-password") {
        message = "Incorrect password.";
      } else if (error.code === "auth/invalid-credential") {
        message = "Invalid email address or password.";
      } else if (error.code === "auth/invalid-email") {
        message = "Invalid email address or password.";
      }
      throw new Error(message);
    });
}

export async function createOrUpdateUserProfile(uid, username, email) {
  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    await setDoc(userRef, {
      username,
      email,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      color: generateRandomColor(),
    });
    return;
  }

  await setDoc(
    userRef,
    {
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

function generateRandomColor() {
  const colors = [
    "#FF5733",
    "#33FF57",
    "#3357FF",
    "#FF33A1",
    "#A133FF",
    "#33FFF5",
    "#F5FF33",
    "#FF8C33",
    "#8C33FF",
    "#33FF8C",
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

export async function deleteUserProfile(uid) {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("No user is currently logged in.");
  }

  await user.delete();
  await deleteDoc(doc(db, "users", uid));
}

export function logout() {
  localStorage.removeItem("currentUser");
  return auth.signOut();
}

export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}

export async function getUsername(uid) {
  const myRef = doc(db, "users", uid);
  const snapshot = await getDoc(myRef);
  const data = snapshot.data();
  return data?.username || "";
}

export async function editOrAddContact(docIdOrName, name, email, phoneNumber, color, vacationDays) {
  const docId = docIdOrName ?? name.replace(/\s+/g, "");
  const userRef = doc(db, "contacts", docId);

  const contactData = {
    name,
    email,
    phoneNumber,
    color,
    updatedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
  };

  if (vacationDays) {
    contactData.vacationDaysTaken = vacationDays.taken;
    contactData.vacationDaysTotal = vacationDays.total;
  }

  await setDoc(userRef, contactData, { merge: true });

  return docId;
}

export async function deleteContact(uuid) {
  const tasksRef = collection(db, "tasks");
  const snapshot = await getDocs(tasksRef);

  const updates = [];
  snapshot.forEach((taskDoc) => {
    const taskData = taskDoc.data();
    const assignedTo = Array.isArray(taskData.assignedTo) ? taskData.assignedTo : [];
    if (!assignedTo.includes(uuid)) return;

    const filteredAssignedTo = assignedTo.filter((entry) => entry !== uuid);
    updates.push(
      setDoc(
        doc(db, "tasks", taskDoc.id),
        { assignedTo: filteredAssignedTo, updatedAt: serverTimestamp() },
        { merge: true }
      )
    );
  });

  await Promise.all(updates);
  await deleteDoc(doc(db, "contacts", uuid));
}

let seedingPromise = null;

async function seedDemoDataIfEmpty() {
  if (seedingPromise) return seedingPromise;

  seedingPromise = (async () => {
    try {
      const contactsRef = collection(db, "contacts");
      const contactsSnap = await getDocs(contactsRef);

      const tasksRef = collection(db, "tasks");
      const tasksSnap = await getDocs(tasksRef);

      if (contactsSnap.empty && tasksSnap.empty) {
        for (const contact of demoContacts) {
          await setDoc(doc(db, "contacts", contact.id), {
            name: contact.name,
            email: contact.email,
            phoneNumber: contact.phoneNumber,
            color: contact.color,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        }

        for (const task of demoTasks) {
          await setDoc(doc(db, "tasks", task.id), {
            title: task.title,
            description: task.description,
            dueDate: task.dueDate,
            priority: task.priority,
            category: task.category,
            assignedTo: task.assignedTo,
            progress: task.progress,
            subtasks: task.subtasks,
            createdBy: "demo_user",
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        }
        console.log("Demo data successfully seeded to Firebase Firestore.");
      }
    } catch (e) {
      console.error("Error seeding demo data:", e);
    }
  })();

  return seedingPromise;
}

export async function getContacts() {
  await seedDemoDataIfEmpty();
  const contactsRef = collection(db, "contacts");
  const snapshot = await getDocs(contactsRef);

  const contacts = [];
  snapshot.forEach((contactDoc) => {
    contacts.push({ id: contactDoc.id, ...contactDoc.data() });
  });

  return contacts;
}

export async function createTask(task) {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("Please log in again to create tasks.");
  }

  const taskRef = doc(collection(db, "tasks"));
  const createData = {
    title: task.title,
    description: task.description,
    dueDate: task.dueDate,
    priority: task.priority,
    subtasks: task.subtasks,
    assignedTo: task.assignedTo,
    category: task.category,
    createdBy: user.uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    progress: "toDo",
  };

  await setDoc(taskRef, createData);
  return taskRef.id;
}

export async function updateTask(taskId, updateData) {
  const taskRef = doc(db, "tasks", taskId);
  await setDoc(taskRef, updateData, { merge: true });
  return taskRef.id;
}

export async function addEditTask(task) {
  return createTask(task);
}

export function deleteTask(taskId) {
  const taskRef = doc(db, "tasks", taskId);
  return deleteDoc(taskRef);
}

export function changeTaskProgress(taskId, newProgress) {
  if (!["toDo", "inProgress", "awaitFeedback", "done"].includes(newProgress)) {
    throw new Error("Invalid progress status");
  }

  const taskRef = doc(db, "tasks", taskId);
  return setDoc(
    taskRef,
    { progress: newProgress, updatedAt: serverTimestamp() },
    { merge: true }
  );
}

export async function getTask(taskId) {
  const taskRef = doc(db, "tasks", taskId);
  const taskSnap = await getDoc(taskRef);
  if (taskSnap.exists()) {
    return { id: taskSnap.id, ...taskSnap.data() };
  }
  throw new Error("Task not found");
}

export async function getAllTasks() {
  await seedDemoDataIfEmpty();
  const tasksRef = collection(db, "tasks");
  const snapshot = await getDocs(tasksRef);
  const tasks = [];
  snapshot.forEach((taskDoc) => {
    tasks.push({ id: taskDoc.id, ...taskDoc.data() });
  });
  return tasks;
}

export async function getTaskIds() {
  const tasksRef = collection(db, "tasks");
  const snapshot = await getDocs(tasksRef);
  const taskIds = [];
  snapshot.forEach((taskDoc) => {
    taskIds.push(taskDoc.id);
  });
  return taskIds;
}

export async function getSubtasksCompletionState(taskId) {
  const taskRef = doc(db, "tasks", taskId);
  const taskSnap = await getDoc(taskRef);

  if (!taskSnap.exists()) {
    throw new Error("Task not found");
  }

  const subtasks = taskSnap.data().subtasks || [];
  const totalSubtasks = subtasks.length;
  const completedSubtasks = subtasks.filter((subtask) => subtask.completed).length;
  return { totalSubtasks, completedSubtasks };
}

export async function getContact(uid) {
  const contactRef = doc(db, "contacts", uid);
  const contactSnap = await getDoc(contactRef);
  if (contactSnap.exists()) {
    return { id: contactSnap.id, ...contactSnap.data() };
  }
  throw new Error("Contact not found");
}

export async function changeSubtaskCompletion(taskId, subtaskIndex, completed) {
  const taskRef = doc(db, "tasks", taskId);
  const taskSnap = await getDoc(taskRef);

  if (!taskSnap.exists()) {
    throw new Error("Task not found");
  }

  const taskData = taskSnap.data();
  const subtasks = taskData.subtasks || [];

  if (subtaskIndex < 0 || subtaskIndex >= subtasks.length) {
    throw new Error("Invalid subtask index");
  }

  subtasks[subtaskIndex].completed = completed;
  await setDoc(taskRef, { subtasks, updatedAt: serverTimestamp() }, { merge: true });
}

export async function getUserById(uid) {
  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);
  if (userSnap.exists()) {
    return { id: userSnap.id, ...userSnap.data() };
  }
  throw new Error("User not found");
}

