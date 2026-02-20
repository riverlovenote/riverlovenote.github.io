// app.js

// ---- SETTINGS YOU EDIT ----
// Earliest day you want accessible in the archive (your first uploaded note):
const START_DATE = "2026-02-19"; // YYYY-MM-DD

// File type you export from Canva:
const EXT = "png"; // "png" or "jpg"

// Folder where notes are stored:
const NOTES_FOLDER = "notes";


// ---- HELPERS ----
function pad(n){ return String(n).padStart(2, "0"); }

function toKey(d){
  // returns YYYY-MM-DD (local time)
  const y = d.getFullYear();
  const m = pad(d.getMonth()+1);
  const day = pad(d.getDate());
  return `${y}-${m}-${day}`;
}

function parseKey(key){
  // key = YYYY-MM-DD -> Date (local)
  const [y,m,d] = key.split("-").map(Number);
  return new Date(y, m-1, d);
}

function addDays(date, days){
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatPretty(d){
  return d.toLocaleDateString(undefined, {
    weekday:"long", year:"numeric", month:"long", day:"numeric"
  });
}


// ---- STATE ----
let current = new Date(); // local today
const start = parseKey(START_DATE);
const todayKey = toKey(new Date());


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


// ---- CORE: load note for a date ----
function loadNote(dateObj){
  // clamp to start date (don’t go earlier)
  if (dateObj < start) dateObj = new Date(start);

  current = dateObj;

  const key = toKey(current);
  const pretty = formatPretty(current);

  dateTitle.textContent = pretty;
  statusEl.textContent = (key === todayKey) ? "Today" : "";

  const src = `${NOTES_FOLDER}/${key}.${EXT}`;
  helperEl.style.display = "none";
  imgEl.src = src;

  // If image missing, auto-fallback to previous day until START_DATE
  imgEl.onerror = () => {
    const startKey = toKey(start);

    if (key !== startKey) {
      loadNote(addDays(current, -1));
      return;
    }

    helperEl.style.display = "block";
    helperEl.textContent = `No note uploaded for ${key} yet.`;
    imgEl.removeAttribute("src");
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
});


// ---- ARCHIVE ----
toggleArchiveBtn.addEventListener("click", () => {
  const isOpen = archivePanel.style.display !== "none";
  archivePanel.style.display = isOpen ? "none" : "block";
});

function buildArchive(){
  archiveList.innerHTML = "";

  const end = new Date(); // today
  let d = new Date(start);

  while (d <= end){
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
