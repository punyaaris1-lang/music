const audio = document.getElementById("audio");
const playlistEl = document.getElementById("playlist");

// Tambahkan elemen status untuk melihat error tanpa buka console log
const statusLog = document.createElement("div");
statusLog.style = "color: red; background: #000; padding: 10px; font-size: 12px; margin: 10px; border: 1px solid red;";
statusLog.innerHTML = "Status: Mencoba memuat playlist...";
document.body.prepend(statusLog);

fetch("playlist.json")
  .then(res => {
    if (!res.ok) throw new Error("File playlist.json tidak ditemukan di GitHub!");
    return res.json();
  })
  .then(songs => {
    statusLog.style.color = "lime";
    statusLog.innerHTML = "Status: Playlist terunduh. Klik lagu untuk tes.";
    
    playlistEl.innerHTML = "";
    songs.forEach((song) => {
      const li = document.createElement("li");
      li.textContent = song.url.split('/').pop().replaceAll('%20', ' ');
      
      li.onclick = () => {
        statusLog.style.color = "yellow";
        statusLog.innerHTML = "Mencoba memutar: " + song.url;

        // Reset Audio
        audio.pause();
        audio.removeAttribute("src");
        audio.load();

        // Tes 1: Apakah link bisa dijangkau?
        fetch(song.url, { method: 'HEAD' })
          .then(response => {
            if (!response.ok) {
              statusLog.style.color = "red";
              statusLog.innerHTML = `ERROR: Link Netlify Mati (404). Pastikan nama file di Netlify sama persis dengan di playlist.json.`;
            } else {
              // Tes 2: Jalankan Audio
              audio.crossOrigin = "anonymous";
              audio.src = song.url;
              
              audio.play()
                .then(() => {
                  statusLog.style.color = "lime";
                  statusLog.innerHTML = "Status: BERHASIL! Lagu sedang berputar.";
                })
                .catch(err => {
                  statusLog.style.color = "red";
                  if (err.name === "NotAllowedError") {
                    statusLog.innerHTML = "ERROR: Browser memblokir suara otomatis. Tap layar di mana saja lalu klik lagu lagi.";
                  } else {
                    statusLog.innerHTML = "ERROR AUDIO: " + err.message;
                  }
                });
            }
          })
          .catch(err => {
            statusLog.style.color = "red";
            statusLog.innerHTML = "ERROR KONEKSI: Browser memblokir akses ke Netlify (Masalah CORS). Tambahkan izin di Netlify.";
          });
      };
      playlistEl.appendChild(li);
    });
  })
  .catch(err => {
    statusLog.style.color = "red";
    statusLog.innerHTML = "ERROR FATAL: " + err.message;
  });
