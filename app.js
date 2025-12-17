const audio = document.getElementById("audio");
const playlistEl = document.getElementById("playlist");
const canvas = document.getElementById("visualizer");
const ctx = canvas.getContext("2d");

let songs = [];
let current = -1;
let bars = new Array(24).fill(0);
let drawInterval;

/* --- LOAD PLAYLIST --- */
fetch("playlist.json")
  .then(r => r.json())
  .then(data => {
    songs = data;
    renderList();
  });

/* --- HELPERS --- */
function nameFromUrl(url) {
  return decodeURIComponent(url.split("/").pop().replace(".mp3", ""));
}

function updateActiveSong() {
  [...playlistEl.children].forEach((li, i) => {
    li.classList.toggle("active", i === current);
  });
}

function renderList() {
  playlistEl.innerHTML = "";
  songs.forEach((s, i) => {
    const li = document.createElement("li");
    li.textContent = nameFromUrl(s.url);
    li.onclick = () => play(i);
    playlistEl.appendChild(li);
  });
  updateActiveSong();
}

/* --- PLAYER CORE (FIXED) --- */
function play(i) {
  if (i < 0 || i >= songs.length) return;

  current = i;

  audio.pause();
  audio.src = songs[i].url + "?download=1"; // 🔥 FIX STREAM PUTUS
  audio.load();                              // 🔥 WAJIB
  audio.play().catch(() => {});

  updateActiveSong();
}

function togglePlay() {
  if (current === -1) {
    play(0);
    return;
  }
  audio.paused ? audio.play() : audio.pause();
}

function stopAudio() {
  audio.pause();
  audio.currentTime = 0;
}

function nextSong() {
  if (songs.length === 0) return;
  const nextIndex = (current + 1) % songs.length;
  play(nextIndex);
}

function prevSong() {
  if (songs.length === 0) return;

  if (audio.currentTime > 1) {
    audio.currentTime = 0;
    return;
  }

  const prevIndex = (current - 1 + songs.length) % songs.length;
  play(prevIndex);
}

function shuffle() {
  songs.sort(() => Math.random() - 0.5);
  current = -1;
  renderList();
  play(0);
}

/* --- AUTO NEXT (ANTI BUG ARCHIVE) --- */
audio.addEventListener("ended", () => {
  if (!isNaN(audio.duration) && audio.duration > 10) {
    nextSong();
  }
});

/* --- VISUALIZER --- */
function drawBars() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const w = canvas.width / bars.length;

  for (let i = 0; i < bars.length; i++) {
    if (!audio.paused) {
      bars[i] = Math.random() * canvas.height;
    } else {
      bars[i] *= 0.85;
    }

    ctx.fillStyle = "#ccff00";
    ctx.fillRect(i * w, canvas.height - bars[i], w - 2, bars[i]);
  }
}

drawInterval = setInterval(drawBars, 100);

/* --- MOBILE UNLOCK FIX (AMAN) --- */
document.addEventListener(
  "click",
  () => {
    if (current !== -1) {
      audio.play().catch(() => {});
    }
  },
  { once: true }
);
