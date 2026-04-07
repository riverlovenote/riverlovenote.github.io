// app.js — Daily Love Notes (GitHub Pages)

// ---- SETTINGS YOU EDIT ----
const START_DATE = "2026-02-19";
const EXT = "png";
const NOTES_FOLDER = "notes";


// ---- HELPERS ----
function pad(n) {
  return String(n).padStart(2, "0");
}

function toKey(d) {
  const y = d.getFullYear();
  const m = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  return `${y}-${m}-${day}`;
}

function parseKey(key) {
  const parts = key.split("-").map(Number);
  return new Date(parts[0], parts[1] - 1, parts[2]);
}

function formatPretty(d) {
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}


// ---- STATE ----
let current = new Date();
const start = parseKey(START_DATE);
let availableNotes = [];
let showingMissingToday = false;


// ---- DOM ----
const viewerEl = document.getElementById("viewer");
const tapHintEl = document.getElementById("tapHint");

const dateTitle = document.getElementById("dateTitle");
const statusEl = document.getElementById("status");
const imgEl = document.getElementById("noteImg");
const helperEl = document.getElementById("helper");

const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");

const archivePanel = document.getElementById("archivePanel");
const archiveList = document.getElementById("archiveList");
const toggleArchiveBtn = document.getElementById("toggleArchive");
const jumpToday = document.getElementById("jumpToday");


// ---- CORE UI ----
function showImageUI() {
  imgEl.style.display = "block";
  if (tapHintEl) tapHintEl.style.display = "block";
  helperEl.style.display = "none";
}

function showMissingUI(message) {
  imgEl.removeAttribute("src");
  imgEl.style.display = "none";
  if (tapHintEl) tapHintEl.style.display = "none";
  helperEl.style.display = "block";
  helperEl.textContent = message;
}

function resetExpandedIfNeeded() {
  if (viewerEl.classList.contains("expanded")) {
    viewerEl.classList.remove("expanded");
  }
  if (tapHintEl) {
    tapHintEl.textContent = "Tap the note to expand";
  }
}

async function loadManifest() {
  try {
    const res = await fetch(`${NOTES_FOLDER}/index.json`, { cache: "no-store" });
    if (!res.ok) throw new Error("Manifest not found");

    availableNotes = await res.json();
    availableNotes = availableNotes
      .filter((key) => parseKey(key) >= start)
      .sort();
  } catch (err) {
    console.error("Could not load notes manifest:", err);
    availableNotes = [];
  }
}

function getNoteIndex(key) {
  return availableNotes.indexOf(key);
}

function getLatestNoteKey() {
  return availableNotes.length ? availableNotes[availableNotes.length - 1] : null;
}

function updateNavButtons() {
  if (showingMissingToday) {
    prevBtn.disabled = availableNotes.length === 0;
    nextBtn.disabled = true;
    prevBtn.style.opacity = prevBtn.disabled ? 0.4 : 1;
    nextBtn.style.opacity = 0.4;
    return;
  }

  const key = toKey(current);
  const idx = getNoteIndex(key);

  prevBtn.disabled = idx <= 0;
  nextBtn.disabled = idx === -1 || idx >= availableNotes.length - 1;

  prevBtn.style.opacity = prevBtn.disabled ? 0.4 : 1;
  nextBtn.style.opacity = nextBtn.disabled ? 0.4 : 1;
}

function loadNoteByKey(key) {
  resetExpandedIfNeeded();
  showingMissingToday = false;

  if (!key) {
    dateTitle.textContent = "";
    statusEl.textContent = "";
    showMissingUI("No notes uploaded yet.");
    prevBtn.disabled = true;
    nextBtn.disabled = true;
    prevBtn.style.opacity = 0.4;
    nextBtn.style.opacity = 0.4;
    return;
  }

  current = parseKey(key);
  const todayKey = toKey(new Date());

  dateTitle.textContent = formatPretty(current);
  statusEl.textContent = key === todayKey ? "Today" : "";

  showImageUI();
  imgEl.src = `${NOTES_FOLDER}/${key}.${EXT}`;

  imgEl.onerror = () => {
    showMissingUI(`Could not load note for ${key}.`);
  };

  imgEl.onload = () => {
    showImageUI();
  };

  updateNavButtons();
}

function loadToday() {
  resetExpandedIfNeeded();

  const today = new Date();
  const todayKey = toKey(today);

  current = today;
  showingMissingToday = false;

  dateTitle.textContent = formatPretty(today);
  statusEl.textContent = "Today";

  if (!availableNotes.includes(todayKey)) {
    showingMissingToday = true;
    showMissingUI("No notes have been uploaded for today yet.");
    updateNavButtons();
    return;
  }

  loadNoteByKey(todayKey);
}

function loadLatestAvailable() {
  const latestKey = getLatestNoteKey();
  loadNoteByKey(latestKey);
}


// ---- NAV ----
prevBtn.addEventListener("click", () => {
  if (showingMissingToday) {
    loadLatestAvailable();
    return;
  }

  const idx = getNoteIndex(toKey(current));
  if (idx > 0) {
    loadNoteByKey(availableNotes[idx - 1]);
  }
});

nextBtn.addEventListener("click", () => {
  if (showingMissingToday) return;

  const idx = getNoteIndex(toKey(current));
  if (idx !== -1 && idx < availableNotes.length - 1) {
    loadNoteByKey(availableNotes[idx + 1]);
  }
});

jumpToday.addEventListener("click", (e) => {
  e.preventDefault();
  loadToday();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft" && !prevBtn.disabled) {
    prevBtn.click();
  }

  if (e.key === "ArrowRight" && !nextBtn.disabled) {
    nextBtn.click();
  }

  if (e.key === "Escape" && viewerEl.classList.contains("expanded")) {
    viewerEl.classList.remove("expanded");
    if (tapHintEl) tapHintEl.textContent = "Tap the note to expand";
  }
});


// ---- In-page expand toggle ----
function toggleExpand() {
  if (imgEl.style.display === "none" || !imgEl.getAttribute("src")) return;

  viewerEl.classList.toggle("expanded");
  const isExpanded = viewerEl.classList.contains("expanded");

  if (tapHintEl) {
    tapHintEl.textContent = isExpanded
      ? "Tap again to shrink"
      : "Tap the note to expand";
  }
}

imgEl.addEventListener("click", toggleExpand);
imgEl.addEventListener(
  "touchend",
  (e) => {
    if (imgEl.style.display === "none" || !imgEl.getAttribute("src")) return;
    e.preventDefault();
    toggleExpand();
  },
  { passive: false }
);


// ---- ARCHIVE ----
toggleArchiveBtn.addEventListener("click", () => {
  const isOpen = archivePanel.style.display !== "none";
  archivePanel.style.display = isOpen ? "none" : "block";
});

function buildArchive() {
  archiveList.innerHTML = "";

  if (!availableNotes.length) {
    archiveList.textContent = "No notes uploaded yet.";
    return;
  }

  [...availableNotes].reverse().forEach((key) => {
    const btn = document.createElement("button");
    btn.textContent = key;

    btn.addEventListener("click", () => {
      loadNoteByKey(key);
      archivePanel.style.display = "none";
    });

    archiveList.appendChild(btn);
  });
}


// ---- INIT ----
(async function init() {
  await loadManifest();
  buildArchive();
  loadToday();
})();
