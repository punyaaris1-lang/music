const audio = document.getElementById('audio');
const playlistEl = document.getElementById('playlist');
const progress = document.getElementById('progress');
const trackName = document.getElementById('trackName');

const playBtn = document.getElementById('playBtn');
const stopBtn = document.getElementById('stopBtn');
const shuffleBtn = document.getElementById('shuffleBtn');

const canvas = document.getElementById('visualizer');
const ctx = canvas.getContext('2d');

canvas.width = 320;
canvas.height = 40;

let songs = [];
let current = -1;

/* ===== LOAD PLAYLIST ===== */
fetch('playlist.json')
  .then(r => r.json())
  .then(data => {
    songs = data;
    render();
  });

/* ===== AUTO TITLE FROM URL ===== */
function getName(url) {
  return decodeURIComponent(url.split('/').pop().replace('.mp3',''));
}

/* ===== RENDER ===== */
function render() {
  playlistEl.innerHTML = '';
  songs.forEach((song, i) => {
    const li = document.createElement('li');
    li.textContent = getName(song.url);
    if (i === current) li.classList.add('active');
    li.onclick = () => play(i);
    playlistEl.appendChild(li);
  });
}

/* ===== PLAYER ===== */
function play(i) {
  current = i;
  audio.src = songs[i].url;
  audio.play();
  trackName.textContent = getName(songs[i].url);
  render();
}

function togglePlay() {
  audio.paused ? audio.play() : audio.pause();
}

function stop() {
  audio.pause();
  audio.currentTime = 0;
}

function shuffle() {
  songs.sort(() => Math.random() - 0.5);
  current = -1;
  render();
}

/* ===== BUTTONS ===== */
playBtn.onclick = togglePlay;
stopBtn.onclick = stop;
shuffleBtn.onclick = shuffle;

/* ===== PROGRESS ===== */
audio.ontimeupdate = () => {
  if (audio.duration) {
    progress.value = (audio.currentTime / audio.duration) * 100;
  }
};

progress.oninput = () => {
  if (audio.duration) {
    audio.currentTime = (progress.value / 100) * audio.duration;
  }
};

/* ===== WINAMP VISUALIZER ===== */
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const analyser = audioCtx.createAnalyser();
const source = audioCtx.createMediaElementSource(audio);

source.connect(analyser);
analyser.connect(audioCtx.destination);

analyser.fftSize = 64;
const bufferLength = analyser.frequencyBinCount;
const dataArray = new Uint8Array(bufferLength);

function draw() {
  requestAnimationFrame(draw);
  analyser.getByteFrequencyData(dataArray);

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const barWidth = canvas.width / bufferLength;

  dataArray.forEach((v, i) => {
    const barHeight = v / 3;
    ctx.fillStyle = '#CCFF00';
    ctx.fillRect(
      i * barWidth,
      canvas.height - barHeight,
      barWidth - 1,
      barHeight
    );
  });
}

audio.onplay = () => {
  audioCtx.resume();
  draw();
};
