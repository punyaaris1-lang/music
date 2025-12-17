const audio = document.getElementById("audio");
const playlistEl = document.getElementById("playlist");
const canvas = document.getElementById("visualizer");
const ctx = canvas.getContext("2d");

const CACHE_NAME = "mlu-mp3-cache-v1";

let songs = [];
let current = -1;
let bars = new Array(24).fill(0);
let currentObjectUrl = null;
let isLoading = false;

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

/* ================= CORE PLAYER (CACHE) ================= */

async function play(i) {
  if (i < 0 || i >= songs.length || isLoading) return;

  isLoading = true;
  current = i;
  updateActiveSong();

  audio.pause();
  audio.currentTime = 0;

  if (currentObjectUrl) {
    URL.revokeObjectURL(currentObjectUrl);
    currentObjectUrl = null;
  }

  const url = songs[i].url;

  try {
    const cache = await caches.open(CACHE_NAME);
    let response = await cache.match(url);

    if (!response) {
      // ⬇️ belum ada → download & cache
      response = await fetch(url, { cache: "no-store" });
      await cache.put(url, response.clone());
    }

    const blob = await response.blob();
    currentObjectUrl = URL.createObjectURL(blob);
    audio.src = currentObjectUrl;

    await audio.play();
  } catch (err) {
    console.error("Gagal play:", err);
  } finally {
    isLoading = false;
  }
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
  if (songs.length === 0) return;
  play((current + 1) % songs.length);
}

function prevSong() {
  if (songs.length === 0) return;

  if (audio.currentTime > 1) {
    audio.currentTime = 0;
    return;
  }

  play((current - 1 + songs.length) % songs.length);
}

function shuffle() {
  songs.sort(() => Math.random() - 0.5);
  current = -1;
  renderList();
  play(0);
}

/* ================= AUTO NEXT ================= */

audio.addEventListener("ended", nextSong);

/* ================= VISUALIZER ================= */

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
