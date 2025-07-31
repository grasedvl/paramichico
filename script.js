
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-firestore.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAOKCX49ywXjCzO3GLD8hd0wvo4FzSJMj0",
  authDomain: "hparamichico.firebaseapp.com",
  projectId: "hparamichico",
  storageBucket: "hparamichico.firebasestorage.app",
  messagingSenderId: "54807329434",
  appId: "1:54807329434:web:b21a189aecc38b5349bd23",
  measurementId: "G-ZLGR1TZX40"
};

// Init Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// HTML elements
const form = document.getElementById("diaryForm");
const entriesContainer = document.getElementById("entriesContainer");
const imageUpload = document.getElementById("imageUpload");
const savedCountEl = document.getElementById("savedCount");

document.addEventListener("DOMContentLoaded", () => {
  loadEntries();
});

form.addEventListener("submit", async function (e) {
  e.preventDefault();

  const titleRaw = document.getElementById("title").value.trim();
  const content = document.getElementById("content").value.trim();
  const spotifyLinkRaw = document.getElementById("spotifyLink").value.trim();
  const title = sanitizeTitle(titleRaw);
  const date = new Date().toLocaleDateString("id-ID", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  let imageData = null;
  if (imageUpload.files[0]) {
    imageData = await readFileAsDataURL(imageUpload.files[0]);
  }

  const spotify = parseSpotify(spotifyLinkRaw);

  const entry = {
    title: title || "Untitled",
    content,
    date,
    imageData,
    spotify,
    createdAt: Date.now()
  };

  try {
    await addDoc(collection(db, "entries"), entry);
    prependEntry(entry);
    form.reset();
    updateSavedCount();
  } catch (err) {
    alert("Error saving entry: " + err.message);
  }
});

function sanitizeTitle(t) {
  return t.replace(/\p{Emoji_Presentation}/gu, "").trim();
}

function readFileAsDataURL(file) {
  return new Promise((res) => {
    const reader = new FileReader();
    reader.onload = () => res(reader.result);
    reader.readAsDataURL(file);
  });
}

function parseSpotify(link) {
  try {
    if (!link) return null;
    const u = new URL(link);
    if (!/spotify\.com/.test(u.hostname)) return null;
    const parts = u.pathname.split("/");
    if (parts[1] === "track" && parts[2]) {
      return {
        type: "track",
        id: parts[2].split("?")[0],
        raw: link,
      };
    }
    return null;
  } catch (e) {
    return null;
  }
}

async function loadEntries() {
  entriesContainer.innerHTML = "";
  const q = query(collection(db, "entries"), orderBy("createdAt", "desc"));
  const querySnapshot = await getDocs(q);
  const entries = [];
  querySnapshot.forEach((doc) => {
    entries.push(doc.data());
  });
  entries.forEach(prependEntry);
  updateSavedCount(entries.length);
}

function prependEntry(entry) {
  const card = document.createElement("div");
  card.classList.add("entry-card");
  card.innerHTML = \`
    <div class="entry-meta">
      <div class="entry-title">\${escapeHtml(entry.title)}</div>
      <div class="entry-date">\${entry.date}</div>
    </div>
    <div class="entry-body">\${escapeHtml(entry.content)}</div>
    <div class="entry-media"></div>
  \`;

  const mediaWrapper = card.querySelector(".entry-media");

  if (entry.imageData) {
    const img = document.createElement("img");
    img.src = entry.imageData;
    img.alt = "Foto kenangan";
    mediaWrapper.appendChild(img);
  }

  if (entry.spotify && entry.spotify.type === "track") {
    const iframe = document.createElement("iframe");
    iframe.src = \`https://open.spotify.com/embed/track/\${entry.spotify.id}\`;
    iframe.width = "100%";
    iframe.height = "80";
    iframe.allow = "encrypted-media";
    iframe.frameBorder = "0";
    iframe.allowFullscreen = true;
    iframe.style.borderRadius = "8px";
    mediaWrapper.appendChild(iframe);
  }

  entriesContainer.appendChild(card);
}

function updateSavedCount(count = 0) {
  savedCountEl.textContent = \`\${count} entr\${count === 1 ? "y" : "ies"}\`;
}

function escapeHtml(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
