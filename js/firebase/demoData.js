import {
  doc,
  setDoc,
  serverTimestamp,
  collection,
  getDocs,
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";
import { db } from "./firebase.js";

export const demoContacts = [
  {
    id: "contact_ae",
    name: "Albert Einstein",
    email: "albert.einstein@join.com",
    phoneNumber: "+49 170 1234567",
    color: "#FF7A00"
  },
  {
    id: "contact_mc",
    name: "Marie Curie",
    email: "marie.curie@join.com",
    phoneNumber: "+49 171 2345678",
    color: "#FF5EB3"
  },
  {
    id: "contact_nt",
    name: "Nikola Tesla",
    email: "nikola.tesla@join.com",
    phoneNumber: "+49 172 3456789",
    color: "#6E52FF"
  },
  {
    id: "contact_al",
    name: "Ada Lovelace",
    email: "ada.lovelace@join.com",
    phoneNumber: "+49 173 4567890",
    color: "#00BEE8"
  },
  {
    id: "contact_at",
    name: "Alan Turing",
    email: "alan.turing@join.com",
    phoneNumber: "+49 174 5678901",
    color: "#1FD7C1"
  }
];

export const demoTasks = [
  {
    id: "task_demo_1",
    title: "CSS-Struktur bereinigen",
    description: "Doppelte CSS-Stile in boardAddOverlay.css und boardEditOverlayBase.css entfernen. Gemeinsame Subtask-Stile und Farbvariablen in globalStyles.css auslagern.",
    dueDate: "2026-07-20",
    priority: "Medium",
    category: "Technical Task",
    assignedTo: ["contact_ae", "contact_mc"],
    progress: "toDo",
    subtasks: [
      { text: "Doppelte CSS-Selektoren identifizieren", completed: true },
      { text: "Gemeinsame Subtask-Klassen in globalStyles überführen", completed: false },
      { text: "Layout auf mobilen Endgeräten testen", completed: false }
    ]
  },
  {
    id: "task_demo_2",
    title: "Mobile Touch-Unterstützung integrieren",
    description: "Integriere touchstart-, touchmove- und touchend-Event-Handler, um das Verschieben von Task-Karten auch auf Touch-Geräten (iOS/Android) flüssig zu ermöglichen.",
    dueDate: "2026-07-15",
    priority: "Urgent",
    category: "Technical Task",
    assignedTo: ["contact_nt"],
    progress: "inProgress",
    subtasks: [
      { text: "Touch-Listener-Wrapper schreiben", completed: true },
      { text: "Standardmäßiges Scrollen bei aktivem Drag verhindern", completed: true },
      { text: "Drag-Feedback auf einem iOS-Simulator validieren", completed: false }
    ]
  },
  {
    id: "task_demo_3",
    title: "Onboarding-Flow für neue Nutzer entwerfen",
    description: "Erstellung eines ansprechenden 3-Schritte-Onboarding-Sliders, der neuen Benutzern die Kanban-Board-Funktionen und Shortcuts erklärt.",
    dueDate: "2026-08-01",
    priority: "Low",
    category: "User Story",
    assignedTo: ["contact_al", "contact_at"],
    progress: "awaitFeedback",
    subtasks: [
      { text: "Texte und Copywriting für Folien entwerfen", completed: true },
      { text: "UI-Mockups in Figma erstellen", completed: false }
    ]
  },
  {
    id: "task_demo_4",
    title: "Password-Reset Validierung fixen",
    description: "Stelle sicher, dass der Benutzer einen klaren Validierungshinweis erhält, wenn die eingegebene E-Mail-Adresse für den Passwort-Reset nicht existiert oder ungültig ist.",
    dueDate: "2026-07-10",
    priority: "Urgent",
    category: "Technical Task",
    assignedTo: ["contact_ae"],
    progress: "toDo",
    subtasks: [
      { text: "Fehlercodes von Firebase Auth auswerten", completed: false }
    ]
  },
  {
    id: "task_demo_5",
    title: "Release v1.1.0 vorbereiten & deployen",
    description: "Deployment der neuen Kanban-Features, inklusive spaltenspezifischer Erstellung, Standard-Priorität Medium und Subtask-Inline-Editierung.",
    dueDate: "2026-07-05",
    priority: "Medium",
    category: "User Story",
    assignedTo: ["contact_mc", "contact_at"],
    progress: "done",
    subtasks: [
      { text: "Firebase Deployment-Rules überprüfen", completed: true },
      { text: "Letzten manuellen Testdurchlauf im Browser abschließen", completed: true }
    ]
  }
];

let seedingPromise = null;

/**
 * Seeds the demo data once per page load if the database is empty.
 * @returns {Promise<void>} Resolves when seeding is finished.
 */
export function seedDemoDataIfEmpty() {
  if (!seedingPromise) seedingPromise = seedDemoData();
  return seedingPromise;
}

/**
 * Writes the demo contacts and tasks if there are no contacts and no tasks yet.
 */
async function seedDemoData() {
  try {
    if (!(await isDatabaseEmpty())) return;
    await writeDemoContacts();
    await writeDemoTasks();
    console.log("Demo data successfully seeded to Firebase Firestore.");
  } catch (error) {
    console.error("Error seeding demo data:", error);
  }
}

/**
 * Checks whether there are neither contacts nor tasks in the database.
 * @returns {Promise<boolean>} True if both collections are empty.
 */
async function isDatabaseEmpty() {
  const contactsSnap = await getDocs(collection(db, "contacts"));
  const tasksSnap = await getDocs(collection(db, "tasks"));
  return contactsSnap.empty && tasksSnap.empty;
}

/**
 * Writes all demo contacts.
 */
async function writeDemoContacts() {
  for (const { id, ...contactData } of demoContacts) {
    await setDoc(doc(db, "contacts", id), {
      ...contactData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
}

/**
 * Writes all demo tasks.
 */
async function writeDemoTasks() {
  for (const { id, ...taskData } of demoTasks) {
    await setDoc(doc(db, "tasks", id), {
      ...taskData,
      createdBy: "demo_user",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
}
