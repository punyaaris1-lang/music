const audio = document.getElementById("audio");
const playlistEl = document.getElementById("playlist");
const canvas = document.getElementById("visualizer");
const ctx = canvas.getContext("2d");

let songs = [];
let current = -1;
let bars = new Array(24).fill(0);
let readyToPlay = false;

/* ================= SETUP AUDIO ================= */

audio.preload = "auto";
audio.crossOrigin = "anonymous";

/* ================= LOAD PLAYLIST ================= */

fetch("playlist.json")
  .then(r => r.json())
  .then(data => {
    songs = data;
    renderList();
  });

/* ================= HELPERS ================= */

function nameFromUrl(url) {
  return decodeURIComponent(url.split("/").pop().replace(".mp3", ""));
}

function renderList() {
  playlistEl.innerHTML = "";
  songs.forEach((s, i) => {
    const li = document.createElement("li");
    li.textContent = nameFromUrl(s.url);
    li.onclick = () => play(i);
    playlistEl.appendChild(li);
  });
}

function updateActive() {
  [...playlistEl.children].forEach((li, i) => {
    li.classList.toggle("active", i === current);
  });
}

/* ================= PLAYER CORE (AMAN) ================= */

function play(i) {
  if (i < 0 || i >= songs.length) return;

  readyToPlay = false;
  current = i;
  updateActive();

  audio.pause();
  audio.src = songs[i].url;
  audio.load();

  audio.oncanplaythrough = () => {
    if (readyToPlay) return;
    readyToPlay = true;
    audio.play();
  };
}

/* ================= CONTROLS ================= */

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
  if (!songs.length) return;
  play((current + 1) % songs.length);
}

function prevSong() {
  if (!songs.length) return;

  if (audio.currentTime > 1) {
    audio.currentTime = 0;
    return;
  }
  play((current - 1 + songs.length) % songs.length);
}

/* ================= AUTO NEXT ================= */

audio.addEventListener("ended", () => {
  // VALIDASI BENERAN HABIS
  if (audio.duration && audio.currentTime >= audio.duration - 0.5) {
    nextSong();
  }
});

/* ================= VISUALIZER (FAKE, AMAN) ================= */

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

setInterval(drawBars, 100);
