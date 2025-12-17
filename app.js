const audio = document.getElementById("audio");
const playlistEl = document.getElementById("playlist");
const canvas = document.getElementById("visualizer");
const ctx = canvas.getContext("2d");

let songs = [];
let current = -1; // -1 berarti belum ada lagu yang diputar
let bars = new Array(24).fill(0);

/* --- UTILITIES & LOAD PLAYLIST --- */

fetch("playlist.json")
  .then(r => r.json())
  .then(data => {
    songs = data;
    renderList();
    // Tambahkan event listener untuk memutar lagu berikutnya secara otomatis saat lagu selesai
    audio.addEventListener('ended', nextSong); 
  });

function nameFromUrl(url) {
  return decodeURIComponent(url.split("/").pop().replace(".mp3", ""));
}

function updateActiveSong() {
  // Hapus kelas 'active' dari semua item
  [...playlistEl.children].forEach((li, i) => {
    li.classList.toggle('active', i === current);
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

/* --- PLAYER CONTROLS --- */

function play(i) {
  if (i < 0 || i >= songs.length) return; // Batasan agar tidak error
  
  current = i;
  audio.src = songs[i].url;
  audio.play();
  updateActiveSong(); // Tandai lagu yang sedang diputar
}

function togglePlay() {
  if (current === -1) {
    play(0); // Putar lagu pertama jika belum ada yang diputar
    return;
  }
  audio.paused ? audio.play() : audio.pause();
}

function stopAudio() {
  audio.pause();
  audio.currentTime = 0;
  // Catatan: Biarkan current tetap, hanya hentikan pemutaran
}

function nextSong() {
  if (songs.length === 0) return;
  const nextIndex = (current + 1) % songs.length; // Loop ke awal
  play(nextIndex);
}

function prevSong() {
  if (songs.length === 0) return;
  // Jika lagu sedang berjalan, kembali ke awal lagu, jika tidak, putar lagu sebelumnya
  if (audio.currentTime > 1) { 
    audio.currentTime = 0;
    return;
  }
  const prevIndex = (current - 1 + songs.length) % songs.length; // Loop ke akhir
  play(prevIndex);
}

function shuffle() {
  songs.sort(() => Math.random() - 0.5);
  // Reset current karena indexnya berubah, lalu putar lagu pertama dari playlist baru
  current = -1; 
  renderList();
  play(0);
}

/* --- VISUALIZER --- */
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

/* --- MOBILE UNLOCK FIX (Perbaikan dari sesi sebelumnya) --- */
document.addEventListener("click", () => {
  // Hanya panggil play() untuk mendapatkan izin browser, JANGAN pause
  audio.play().catch(()=>{});
}, { once: true });
