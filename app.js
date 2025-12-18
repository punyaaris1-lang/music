const audio = document.getElementById("audio");
const playlistEl = document.getElementById("playlist");

// Tambahkan ini agar browser tidak memblokir lagu dari Netlify
audio.crossOrigin = "anonymous";

fetch("playlist.json")
  .then(res => res.json())
  .then(songs => {
    playlistEl.innerHTML = "";
    songs.forEach((song) => {
      const li = document.createElement("li");
      const fileName = song.url.split('/').pop().replaceAll('%20', ' ');
      li.textContent = fileName;
      
      li.onclick = () => {
        // Reset audio sebelum putar yang baru
        audio.pause();
        audio.src = song.url;
        audio.load(); // Paksa browser muat ulang file
        
        // Coba putar
        let playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.log("Gagal putar:", error);
          });
        }
      };
      playlistEl.appendChild(li);
    });
  });

