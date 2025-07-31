const form = document.getElementById("diaryForm");
const entriesContainer = document.getElementById("entriesContainer");
const imageUpload = document.getElementById("imageUpload");
const savedCountEl = document.getElementById("savedCount");

const STORAGE_KEY = "him_diary_entries";

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
    id: Date.now(),
    title: title || "Untitled",
    content,
    date,
    imageData,
    spotify,
  };

  saveEntry(entry);
  prependEntry(entry);
  form.reset();
  updateSavedCount();
});

function sanitizeTitle(t) {
  // strip emojis by removing characters in certain unicode ranges (basic attempt)
  return t.replace(/\p{Emoji_Presentation}/gu, "").trim();
}

function readFileAsDataURL(file) {
  return new Promise((res) => {
    const reader = new FileReader();
    reader.onload = function () {
      res(reader.result);
    };
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

function saveEntry(entry) {
  const arr = getStored();
  arr.unshift(entry);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
}

function getStored() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function loadEntries() {
  const arr = getStored();
  arr.forEach(prependEntry);
  updateSavedCount();
}

function prependEntry(entry) {
  const card = document.createElement("div");
  card.classList.add("entry-card");
  card.setAttribute("data-id", entry.id);

  // Tambahkan tombol hapus + struktur entry
  const mediaHtml = `
    <div class="entry-meta">
      <div class="entry-title">${escapeHtml(entry.title)}</div>
      <div class="entry-date">${entry.date}</div>
    </div>
    <div class="entry-body">${escapeHtml(entry.content)}</div>
    <div class="entry-media"></div>
  `;

  card.innerHTML = `<button class="remove-btn" aria-label="hapus entry">✕</button>` + mediaHtml;

  const mediaWrapper = card.querySelector(".entry-media");

  // Tambahkan gambar kalau ada
  if (entry.imageData) {
    const img = document.createElement("img");
    img.src = entry.imageData;
    img.alt = "Foto kenangan";
    mediaWrapper.appendChild(img);
  }

  // Tambahkan Spotify embed kalau ada
  if (entry.spotify && entry.spotify.type === "track") {
    const iframe = document.createElement("iframe");
    iframe.src = `https://open.spotify.com/embed/track/${entry.spotify.id}`;
    iframe.width = "100%";
    iframe.height = "80";
    iframe.allow = "encrypted-media";
    iframe.frameBorder = "0";
    iframe.allowFullscreen = true;
    iframe.style.borderRadius = "8px";
    mediaWrapper.appendChild(iframe);
  }

  // ⛔⛔⛔ DI SINI letakkan event listener delete-nya
  const removeBtn = card.querySelector(".remove-btn");
  if (removeBtn) {
    removeBtn.addEventListener("click", () => {
      const confirmDelete = confirm("Are you sure you want to delete this entry?");
      if (confirmDelete) {
        removeEntry(entry.id);
        card.remove();
        updateSavedCount();
      }
    });
  }

  entriesContainer.prepend(card);
}

function removeEntry(id) {
  const arr = getStored().filter((e) => e.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
}

function updateSavedCount() {
  const count = getStored().length;
  savedCountEl.textContent = `${count} entr${count === 1 ? "y" : "ies"}`;
}

// basic escaping to avoid injection
function escapeHtml(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

