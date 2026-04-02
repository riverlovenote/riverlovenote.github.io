// ===== CONFIG =====
const START_DATE = new Date("2024-01-01"); // change if needed
const IMAGE_PATH = "notes/"; // folder where images live
const EXT = ".png"; // change if using png/webp

// ===== ELEMENTS =====
const dateTitle = document.getElementById("dateTitle");
const status = document.getElementById("status");
const noteImg = document.getElementById("noteImg");
const archiveList = document.getElementById("archiveList");

const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const jumpToday = document.getElementById("jumpToday");

// ===== STATE =====
let currentDate = new Date();
let availableDates = [];

// ===== HELPERS =====
function formatDate(date){
  return date.toISOString().split("T")[0];
}

function displayDate(date){
  return date.toDateString();
}

// Check if image exists
function checkImage(dateStr){
  return new Promise((resolve)=>{
    const img = new Image();
    img.src = `${IMAGE_PATH}${dateStr}${EXT}`;

    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
  });
}

// ===== LOAD ALL AVAILABLE NOTES =====
async function loadAvailableDates(){
  const today = new Date();
  let temp = new Date(START_DATE);

  availableDates = [];

  while(temp <= today){
    const dStr = formatDate(temp);
    const exists = await checkImage(dStr);

    if(exists){
      availableDates.push(dStr);
    }

    temp.setDate(temp.getDate() + 1);
  }

  buildArchive();
}

// ===== BUILD ARCHIVE =====
function buildArchive(){
  archiveList.innerHTML = "";

  availableDates.forEach(dateStr=>{
    const btn = document.createElement("button");
    btn.textContent = dateStr;

    btn.onclick = ()=>{
      currentDate = new Date(dateStr);
      render();
    };

    archiveList.appendChild(btn);
  });
}

// ===== RENDER NOTE =====
async function render(){
  const dStr = formatDate(currentDate);

  dateTitle.textContent = displayDate(currentDate);

  const exists = await checkImage(dStr);

  if(exists){
    noteImg.src = `${IMAGE_PATH}${dStr}${EXT}`;
    noteImg.style.display = "block";

    status.textContent = "Uploaded 💌";
  } else {
    noteImg.style.display = "none";

    status.textContent = "No note uploaded yet for " + dStr;
  }
}

// ===== NAVIGATION =====
prevBtn.onclick = ()=>{
  currentDate.setDate(currentDate.getDate() - 1);
  render();
};

nextBtn.onclick = ()=>{
  currentDate.setDate(currentDate.getDate() + 1);
  render();
};

jumpToday.onclick = ()=>{
  currentDate = new Date();
  render();
};

// ===== INIT =====
(async function(){
  await loadAvailableDates();
  render();
})();
