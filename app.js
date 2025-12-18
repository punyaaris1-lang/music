const audio = document.getElementById("audio");
const playlistEl = document.getElementById("playlist");
const netlifyURL = "https://mlump3player.netlify.app/"; // Link Netlify Anda

// FUNGSI AUTO-SCAN FOLDER
fetch(netlifyURL)
  .then(res => res.text())
  .then(html => {
    // Mencari semua link yang berakhiran .mp3 di halaman Netlify
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const links = Array.from(doc.querySelectorAll('a'));
    
    const mp3Files = links
      .map(link => link.getAttribute('href'))
      .filter(href => href && href.endsWith('.mp3'));

    renderPlaylist(mp3Files);
  })
  .catch(err => alert("Gagal scan folder: " + err));

function renderPlaylist(files) {
  playlistEl.innerHTML = "";
  files.forEach((file, index) => {
    const li = document.createElement("li");
    // Bersihkan nama file untuk tampilan
    const cleanName = decodeURIComponent(file).replace('.mp3', '');
    li.textContent = cleanName;
    
    li.onclick = () => {
      audio.crossOrigin = "anonymous";
      audio.src = netlifyURL + file;
      audio.play();
      
      // Efek warna aktif
      document.querySelectorAll('li').forEach(el => el.style.color = "white");
      li.style.color = "#ccff00";
    };
    playlistEl.appendChild(li);
  });
}

// Auto Next
audio.onended = () => {
  // Logika untuk putar lagu berikutnya otomatis
};
