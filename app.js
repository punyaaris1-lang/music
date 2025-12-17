const audio = document.getElementById("audio");
const playlistEl = document.getElementById("playlist");
const canvas = document.getElementById("visualizer");
const ctx = canvas.getContext("2d");

let songs = [];
let current = -1;
let bars = new Array(24).fill(0);

/* LOAD PLAYLIST */
fetch("playlist.json")
  .then(r => r.json())
  .then(data => {
    songs = data;
    renderList();
  });

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

/* PLAYER */
function play(i) {
  current = i;
  audio.src = songs[i].url;
  audio.play();
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

function shuffle() {
  songs.sort(() => Math.random() - 0.5);
  renderList();
}

/* FAKE WINAMP VISUALIZER */
function drawBars() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const w = canvas.width / bars.length;

  for (let i = 0; i < bars.length; i++) {
    if (!audio.paused) {
      bars[i] = Math.random() * canvas.height;
    } else {
      bars[i] *= 0.9;
    }
    ctx.fillStyle = "#ccff00";
    ctx.fillRect(i * w, canvas.height - bars[i], w - 2, bars[i]);
  }
  requestAnimationFrame(drawBars);
}
drawBars();

/* MOBILE + IFRAME UNLOCK */
document.addEventListener("click", () => {
  audio.play().then(() => audio.pause()).catch(()=>{});
}, { once: true });
