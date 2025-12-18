const audio = document.getElementById("audio");
const playlistEl = document.getElementById("playlist");
let songs = [];

// Memuat daftar lagu dari playlist.json
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
    // Mengambil nama file agar tampilan bersih
    const fileName = song.url.split('/').pop().replaceAll('%20', ' ');
    li.textContent = fileName;
    
    // Klik langsung jalankan lagu (Interaksi User Langsung)
    li.onclick = () => {
      audio.src = song.url;
      audio.play();
      
      // Tandai lagu yang sedang diputar
      document.querySelectorAll('li').forEach(el => el.style.color = "white");
      li.style.color = "#ccff00";
    };
    playlistEl.appendChild(li);
  });
}

// Otomatis lanjut ke lagu berikutnya
audio.onended = () => {
  // Anda bisa menambahkan logika next otomatis di sini nanti
};
