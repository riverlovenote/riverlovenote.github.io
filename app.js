// app.js — Daily Love Notes (GitHub Pages)

// ---- SETTINGS YOU EDIT ----
const START_DATE = "2026-02-19"; // earliest note available (YYYY-MM-DD)
const EXT = "png";               // "png" or "jpg"
const NOTES_FOLDER = "notes";    // folder name


// ---- HELPERS ----
function pad(n) { return String(n).padStart(2, "0"); }

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

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
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
let current = new Date(); // local today
const start = parseKey(START_DATE);


// ---- DOM ----
const dateTitle = document.getElementById("dateTitle");
const statusEl  = document.getElementById("status");
const imgEl     = document.getElementById("noteImg");
const helperEl  = document.getElementById("helper");

const prevBtn   = document.getElementById("prevBtn");
const nextBtn   = document.getElementById("nextBtn");

const archivePanel = document.getElementById("archivePanel");
const archiveList  = document.getElementById("archiveList");
const toggleArchiveBtn = document.getElementById("toggleArchive");
const jumpToday = document.getElementById("jumpToday");

// Zoom modal DOM
const zoomOverlay = document.getElementById("zoomOverlay");
const zoomImg = document.getElementById("zoomImg");
const zoomClose = document.getElementById("zoomClose");


// ---- CORE ----
function setMissing(key) {
  helperEl.style.display = "block";
  helperEl.textContent = `No note uploaded for ${key} yet.`;
  imgEl.removeAttribute("src");
}

function openZoom(){
  if (!imgEl.src) return;
  zoomImg.src = imgEl.src;
  zoomOverlay.classList.add("open");
  zoomOverlay.setAttribute("aria-hidden","false");
  document.body.style.overflow = "hidden";
}

function closeZoom(){
  zoomOverlay.classList.remove("open");
  zoomOverlay.setAttribute("aria-hidden","true");
  zoomImg.removeAttribute("src");
  document.body.style.overflow = "";
}

function loadNote(dateObj) {
  if (dateObj < start) dateObj = new Date(start);
  current = dateObj;

  const key = toKey(current);
  const todayKey = toKey(new Date());

  dateTitle.textContent = formatPretty(current);
  statusEl.textContent = (key === todayKey) ? "Today" : "";

  const src = `${NOTES_FOLDER}/${key}.${EXT}`;
  helperEl.style.display = "none";
  imgEl.src = src;

  imgEl.onerror = () => {
    const startKey = toKey(start);

    // If today's note isn't uploaded yet, fall back to previous day (until START_DATE)
    if (key !== startKey) {
      loadNote(addDays(current, -1));
      return;
    }
    setMissing(key);
  };

  imgEl.onload = () => {
    helperEl.style.display = "none";
  };

  nextBtn.disabled = (key === todayKey);
  nextBtn.style.opacity = nextBtn.disabled ? 0.4 : 1;
}


// ---- NAV ----
prevBtn.addEventListener("click", () => loadNote(addDays(current, -1)));
nextBtn.addEventListener("click", () => loadNote(addDays(current,  1)));

jumpToday.addEventListener("click", (e) => {
  e.preventDefault();
  loadNote(new Date());
});

document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft")  loadNote(addDays(current, -1));
  if (e.key === "ArrowRight") loadNote(addDays(current,  1));
  if (e.key === "Escape") closeZoom();
});

// Tap image to zoom
imgEl.addEventListener("click", openZoom);

// Close zoom
zoomClose.addEventListener("click", closeZoom);
zoomOverlay.addEventListener("click", (e) => {
  if (e.target === zoomOverlay) closeZoom();
});


// ---- ARCHIVE ----
toggleArchiveBtn.addEventListener("click", () => {
  const isOpen = archivePanel.style.display !== "none";
  archivePanel.style.display = isOpen ? "none" : "block";
});

function buildArchive() {
  archiveList.innerHTML = "";

  const end = new Date(); // today
  let d = new Date(start);

  while (d <= end) {
    const key = toKey(d);

    const btn = document.createElement("button");
    btn.textContent = key;

    btn.addEventListener("click", () => {
      loadNote(parseKey(key));
      archivePanel.style.display = "none";
    });

    archiveList.appendChild(btn);
    d = addDays(d, 1);
  }
}


// ---- INIT ----
buildArchive();
loadNote(new Date());
