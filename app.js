const audio = document.getElementById("audio");
const playlistEl = document.getElementById("playlist");
const canvas = document.getElementById("visualizer");
const ctx = canvas.getContext("2d");

let songs = [];
let current = -1; // -1 berarti belum ada lagu yang diputar
let bars = new Array(24).fill(0);
let drawInterval; // Variabel untuk mengontrol kecepatan visualizer

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
  // Fungsi yang mengambil nama lagu dari URL file MP3
  return decodeURIComponent(url.split("/").pop().replace(".mp3", ""));
}

function updateActiveSong() {
  // Tandai lagu yang sedang aktif dengan class 'active'
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
  if (i < 0 || i >= songs.length) return;
  
  current = i;
  audio.src = songs[i].url;
  
  // Menggunakan play().catch() untuk menangani potensi error pemblokiran browser
  audio.play().catch(error => {
      console.log("Pemutaran diblokir oleh browser. Coba lagi.", error);
  });
  updateActiveSong();
}

function togglePlay() {
  if (current === -1) {
    play(0);
    return;
  }
  
  if (audio.paused) {
    // Jika dijeda, coba putar. Menggunakan catch untuk mengatasi pemblokiran.
    audio.play().catch(error => {
        console.log("Tidak bisa memutar setelah jeda. Error:", error);
    });
  } else {
    audio.pause();
  }
}

function stopAudio() {
  audio.pause();
  audio.currentTime = 0;
}

function nextSong() {
  if (songs.length === 0) return;
  const nextIndex = (current + 1) % songs.length; // Loop ke awal
  play(nextIndex);
}

function prevSong() {
  if (songs.length === 0) return;
  // Jika lagu sudah berjalan lebih dari 1 detik, mulai ulang lagu saat ini
  if (audio.currentTime > 1) { 
    audio.currentTime = 0;
    return;
  }
  // Jika tidak, putar lagu sebelumnya (Loop ke akhir jika current = 0)
  const prevIndex = (current - 1 + songs.length) % songs.length;
  play(prevIndex);
}

function shuffle() {
  songs.sort(() => Math.random() - 0.5);
  current = -1; // Reset current karena index berubah
  renderList();
  play(0);
}

/* --- VISUALIZER (Diperbaiki agar tidak terlalu cepat) --- */
function drawBars() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const w = canvas.width / bars.length;

  for (let i = 0; i < bars.length; i++) {
    if (!audio.paused) {
      // Menggunakan nilai acak yang diperbarui pada interval yang lebih lambat
      bars[i] = Math.random() * canvas.height;
    } else {
      // Biarkan bar turun perlahan saat di-pause
      bars[i] *= 0.85; 
    }
    ctx.fillStyle = "#ccff00";
    ctx.fillRect(i * w, canvas.height - bars[i], w - 2, bars[i]);
  }
}
// Panggil visualizer setiap 100 milidetik (10 kali per detik)
drawInterval = setInterval(drawBars, 100); 

/* --- MOBILE UNLOCK FIX (KODE LAMA DIHAPUS TOTAL) --- */
// Tidak ada kode di sini, karena fungsi UNLOCK digabungkan ke togglePlay() dan play(i)
