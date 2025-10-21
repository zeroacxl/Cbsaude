import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Funções de acesso ao Firestore
export async function getData(name) {
  try {
    const snap = await getDoc(doc(db, "data", name));
    return snap.exists() ? snap.data().list || [] : [];
  } catch (error) {
    console.error(`Erro ao buscar ${name}:`, error);
    return [];
  }
}

export async function setData(name, list) {
  try {
    await setDoc(doc(db, "data", name), { list });
  } catch (error) {
    console.error(`Erro ao salvar ${name}:`, error);
  }
}