const audio = document.getElementById("audio");
const playlistEl = document.getElementById("playlist");
let songs = [];
let current = -1;

// Memuat daftar lagu
fetch("playlist.json")
  .then(r => r.json())
  .then(data => {
    songs = data;
    renderList();
    audio.addEventListener('ended', nextSong); 
  });

function renderList() {
  playlistEl.innerHTML = "";
  songs.forEach((s, i) => {
    const li = document.createElement("li");
    // Mengambil nama file saja untuk tampilan
    const name = s.url.split('/').pop().replaceAll('%20', ' ');
    li.textContent = name;
    li.onclick = () => play(i);
    playlistEl.appendChild(li);
  });
}

function play(i) {
  if (i < 0 || i >= songs.length) return;
  current = i;
  
  // Paksa reset total sebelum ganti lagu
  audio.pause();
  audio.src = ""; 
  audio.load();
  
  // Masukkan URL baru dari Netlify
  audio.src = songs[i].url;
  audio.load();
  
  // Jalankan dengan interaksi user
  audio.play().catch(e => {
    alert("Klik layar sekali lagi lalu coba lagi");
  });

  // Tandai lagu aktif
  [...playlistEl.children].forEach((li, idx) => {
    li.style.color = (idx === i) ? "#ccff00" : "white";
    li.style.fontWeight = (idx === i) ? "bold" : "normal";
  });
}

function nextSong() {
  play((current + 1) % songs.length);
}

/* --- KRUSIAL: Membuka kunci audio browser --- */
document.addEventListener("click", () => {
  // Hanya memicu mesin audio agar 'bangun' tanpa mematikan lagu
  if (audio.paused && current === -1) {
    audio.play().then(() => audio.pause()).catch(()=>{});
  }
}, { once: true });
