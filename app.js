const audio = document.getElementById("audio");
const playlistEl = document.getElementById("playlist");
const canvas = document.getElementById("visualizer");
const ctx = canvas.getContext("2d");

let songs = [];
let current = -1;

/* ===== LOAD PLAYLIST ===== */
fetch("playlist.json")
  .then(r => r.json())
  .then(data => {
    songs = data;
    renderList();
  });

function songName(url) {
  return decodeURIComponent(
    url.split("/").pop().replace(".mp3", "")
  );
}

function renderList() {
  playlistEl.innerHTML = "";
  songs.forEach((s, i) => {
    const li = document.createElement("li");
    li.textContent = songName(s.url);
    li.onclick = () => play(i);
    playlistEl.appendChild(li);
  });
}

/* ===== PLAYER ===== */
function play(i) {
  current = i;
  audio.src = songs[i].url;
  audio.play().catch(()=>{});
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

/* ===== MLU TEXT VISUALIZER ===== */
const BAR_COUNT = 90;
let bars = new Array(BAR_COUNT).fill(0);

function drawVisualizer() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // TEXT MASK
  ctx.save();
  ctx.font = "bold 46px Impact";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#fff";
  ctx.fillText("MLU", canvas.width / 2, canvas.height / 2);

  ctx.globalCompositeOperation = "source-in";

  const w = canvas.width / BAR_COUNT;

  for (let i = 0; i < BAR_COUNT; i++) {
    let target = 0;

    if (!audio.paused) {
      target =
        (Math.sin(audio.currentTime * 2 + i * 0.25) + 1) *
        0.5 *
        canvas.height;
    }

    bars[i] += (target - bars[i]) * 0.1;
    bars[i] *= 0.92;

    ctx.fillStyle = "#ccff00";
    ctx.fillRect(
      i * w,
      canvas.height - bars[i],
      w - 1,
      bars[i]
    );
  }

  ctx.restore();
  ctx.globalCompositeOperation = "source-over";

  // OUTLINE
  ctx.strokeStyle = "#ccff00";
  ctx.lineWidth = 2;
  ctx.font = "bold 46px Impact";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.strokeText("MLU", canvas.width / 2, canvas.height / 2);

  requestAnimationFrame(drawVisualizer);
}

drawVisualizer();

/* ===== MOBILE IFRAME UNLOCK ===== */
document.addEventListener("click", () => {
  audio.play().then(() => audio.pause()).catch(()=>{});
}, { once:true });
