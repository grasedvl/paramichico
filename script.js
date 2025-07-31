import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  serverTimestamp,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAOKCX49ywXjCzO3GLD8hd0wvo4FzSJMj0",
  authDomain: "hparamichico.firebaseapp.com",
  projectId: "hparamichico",
  storageBucket: "hparamichico.appspot.com",
  messagingSenderId: "54807329434",
  appId: "1:54807329434:web:b21a189aecc38b5349bd23",
  measurementId: "G-ZLGR1TZX40"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const form = document.querySelector("form");
const titleInput = document.getElementById("title");
const contentInput = document.getElementById("content");
const spotifyInput = document.getElementById("spotify");
const entriesContainer = document.getElementById("entries");
const savedCount = document.getElementById("savedCount");

async function saveToFirestore(title, content, spotify) {
  await addDoc(collection(db, "entries"), {
    title,
    content,
    spotify,
    createdAt: serverTimestamp()
  });
}

function createCard(entry) {
  const card = document.createElement("div");
  card.classList.add("card");

  const h2 = document.createElement("h2");
  h2.textContent = entry.title;

  const p = document.createElement("p");
  p.textContent = entry.content;

  card.appendChild(h2);
  card.appendChild(p);

  if (entry.spotify) {
    const iframe = document.createElement("iframe");
    iframe.src = entry.spotify;
    iframe.width = "100%";
    iframe.height = "80";
    iframe.frameBorder = "0";
    iframe.allow = "autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture";
    iframe.allowFullscreen = true;
    card.appendChild(iframe);
  }

  entriesContainer.appendChild(card);
}

async function loadEntries() {
  const q = query(collection(db, "entries"), orderBy("createdAt", "desc"));
  const querySnapshot = await getDocs(q);
  entriesContainer.innerHTML = "";

  let count = 0;
  querySnapshot.forEach((doc) => {
    const entry = doc.data();
    if (entry.title && entry.content) {
      createCard(entry);
      count++;
    }
  });

  savedCount.textContent = count;
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const title = titleInput.value.trim();
  const content = contentInput.value.trim();
  const spotify = spotifyInput.value.trim();

  if (!title || !content) {
    alert("Please fill in the title and content!");
    return;
  }

  await saveToFirestore(title, content, spotify);
  await loadEntries();

  titleInput.value = "";
  contentInput.value = "";
  spotifyInput.value = "";
});

window.addEventListener("DOMContentLoaded", loadEntries);
