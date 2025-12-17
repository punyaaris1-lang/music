const audio = document.getElementById("audio");
audio.crossOrigin = "anonymous";

const canvas = document.getElementById("visualizer");
const ctx = canvas.getContext("2d");

const playlistEl = document.getElementById("playlist");

let songs = [];
let current = -1;

/* === AUDIO CONTEXT === */
const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContext();

const source = audioCtx.createMediaElementSource(audio);
const analyser = audioCtx.createAnalyser();
analyser.fftSize = 64;

source.connect(analyser);
analyser.connect(audioCtx.destination);

const bufferLength = analyser.frequencyBinCount;
const dataArray = new Uint8Array(bufferLength);

/* === LOAD PLAYLIST === */
fetch("playlist.json")
  .then(r => r.json())
  .then(data => {
    songs = data;
    renderList();
  });

function getName(url) {
  return decodeURIComponent(url.split("/").pop().replace(".mp3", ""));
}

function renderList() {
  playlistEl.innerHTML = "";
  songs.forEach((s, i) => {
    const li = document.createElement("li");
    li.textContent = getName(s.url);
    li.onclick = () => play(i);
    playlistEl.appendChild(li);
  });
}

/* === PLAY === */
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

/* === USER GESTURE FIX (WAJIB IFRAME) === */
document.addEventListener("click", () => {
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
}, { once: true });

/* === VISUALIZER === */
function draw() {
  requestAnimationFrame(draw);
  analyser.getByteFrequencyData(dataArray);

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const barWidth = canvas.width / bufferLength;

  for (let i = 0; i < bufferLength; i++) {
    const barHeight = dataArray[i] / 2;
    ctx.fillStyle = "#ccff00";
    ctx.fillRect(
      i * barWidth,
      canvas.height - barHeight,
      barWidth - 2,
      barHeight
    );
  }
}

draw();
