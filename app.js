// app.js — Daily Love Notes (GitHub Pages)

// ---- SETTINGS YOU EDIT ----
const START_DATE = "2026-02-19"; // earliest possible note date
const EXT = "png";               // "png" or "jpg"
const NOTES_FOLDER = "notes";    // folder name


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


// ---- CORE ----
function setMissing(key) {
  helperEl.style.display = "block";
  helperEl.textContent = `No note uploaded for ${key} yet.`;
  imgEl.removeAttribute("src");
}

async function loadManifest() {
  try {
    const res = await fetch(`${NOTES_FOLDER}/index.json`, { cache: "no-store" });
    if (!res.ok) throw new Error("Manifest not found");
    availableNotes = await res.json();

    // keep only dates on/after START_DATE, sorted ascending
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

function getLatestAvailableOnOrBefore(targetDate) {
  const targetKey = toKey(targetDate);

  for (let i = availableNotes.length - 1; i >= 0; i--) {
    if (availableNotes[i] <= targetKey) {
      return availableNotes[i];
    }
  }

  return availableNotes.length ? availableNotes[0] : null;
}

function updateNavButtons() {
  const key = toKey(current);
  const idx = getNoteIndex(key);

  prevBtn.disabled = idx <= 0;
  nextBtn.disabled = idx === -1 || idx >= availableNotes.length - 1;

  prevBtn.style.opacity = prevBtn.disabled ? 0.4 : 1;
  nextBtn.style.opacity = nextBtn.disabled ? 0.4 : 1;
}

function loadNoteByKey(key) {
  if (!key) {
    setMissing("this date");
    dateTitle.textContent = "";
    statusEl.textContent = "";
    prevBtn.disabled = true;
    nextBtn.disabled = true;
    prevBtn.style.opacity = 0.4;
    nextBtn.style.opacity = 0.4;
    return;
  }

  current = parseKey(key);
  const todayKey = toKey(new Date());

  dateTitle.textContent = formatPretty(current);
  statusEl.textContent = (key === todayKey) ? "Today" : "";

  helperEl.style.display = "none";
  imgEl.src = `${NOTES_FOLDER}/${key}.${EXT}`;

  imgEl.onerror = () => {
    setMissing(key);
  };

  imgEl.onload = () => {
    helperEl.style.display = "none";
  };

  updateNavButtons();
}

function loadClosestNote(dateObj) {
  const key = getLatestAvailableOnOrBefore(dateObj);
  loadNoteByKey(key);
}


// ---- NAV ----
prevBtn.addEventListener("click", () => {
  const idx = getNoteIndex(toKey(current));
  if (idx > 0) {
    loadNoteByKey(availableNotes[idx - 1]);
  }
});

nextBtn.addEventListener("click", () => {
  const idx = getNoteIndex(toKey(current));
  if (idx !== -1 && idx < availableNotes.length - 1) {
    loadNoteByKey(availableNotes[idx + 1]);
  }
});

jumpToday.addEventListener("click", (e) => {
  e.preventDefault();
  loadClosestNote(new Date());
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
  loadClosestNote(new Date());
})();
