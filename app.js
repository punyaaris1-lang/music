const audio = document.getElementById("audio");
const playlistEl = document.getElementById("playlist");
const canvas = document.getElementById("visualizer");
let songs = [];
let current = 0;
let audioCtx, analyser, source, dataArray, bufferLength;

// Muat Playlist
fetch("playlist.json")
  .then(res => res.json())
  .then(data => {
    songs = data;
    renderPlaylist();
  });

function renderPlaylist() {
  playlistEl.innerHTML = "";
  songs.forEach((song, index) => {
    const li = document.createElement("li");
    const fileName = song.url.split('/').pop().replaceAll('%20', ' ');
    li.textContent = fileName.replace('.mp3', '');
    li.onclick = () => playSong(index);
    playlistEl.appendChild(li);
  });
}

function playSong(index) {
  current = index;
  audio.crossOrigin = "anonymous"; // Penting agar soundbar bisa baca data
  audio.src = songs[index].url;
  audio.load();
  audio.play();
  
  document.querySelectorAll('li').forEach((li, i) => {
    li.style.color = (i === index) ? "#ccff00" : "white";
  });
  setupVisualizer();
}

audio.onended = () => {
  current = (current + 1) % songs.length;
  playSong(current);
};

function setupVisualizer() {
  if (audioCtx) return;
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  analyser = audioCtx.createAnalyser();
  source = audioCtx.createMediaElementSource(audio);
  source.connect(analyser);
  analyser.connect(audioCtx.destination);
  analyser.fftSize = 64;
  bufferLength = analyser.frequencyBinCount;
  dataArray = new Uint8Array(bufferLength);
  const ctx = canvas.getContext("2d");
  function draw() {
    requestAnimationFrame(draw);
    analyser.getByteFrequencyData(dataArray);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const barWidth = (canvas.width / bufferLength) * 2;
    let x = 0;
    for (let i = 0; i < bufferLength; i++) {
      let barHeight = dataArray[i] / 2;
      ctx.fillStyle = "#ccff00";
      ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
      x += barWidth + 2;
    }
  }
  draw();
}
