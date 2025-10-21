import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

export const app = initializeApp({
  apiKey: "AIzaSyBexxAzdyVtthakeOVfTf-PxnlQ5rNynRQ",
  authDomain: "cbsaudecooperados.firebaseapp.com",
  projectId: "cbsaudecooperados",
  storageBucket: "cbsaudecooperados.firebasestorage.app",
  messagingSenderId: "558244165893",
  appId: "1:558244165893:web:2e10e9560c896f43e6df6c"
});

export const db = getFirestore(app);

export async function getData(name) {
  const snap = await getDoc(doc(db, "data", name));
  return snap.exists() ? snap.data().list || [] : [];
}

export async function setData(name, list) {
  await setDoc(doc(db, "data", name), { list });
}