const audio = document.getElementById("audio");
const playlistEl = document.getElementById("playlist");
const songTitle = document.getElementById("songTitle");
const canvas = document.getElementById("visualizer");
const ctx = canvas.getContext("2d");

let songs = [];
let currentIndex = 0;
let audioCtx, analyser, source, dataArray;

// 1. Ambil Data Playlist
fetch("playlist.json")
    .then(res => res.json())
    .then(data => {
        songs = data;
        renderPlaylist();
    })
    .catch(err => console.error("Gagal muat playlist:", err));

// 2. Tampilkan Daftar Lagu
function renderPlaylist() {
    playlistEl.innerHTML = "";
    songs.forEach((song, index) => {
        const li = document.createElement("li");
        const name = song.url.split('/').pop().replaceAll('%20', ' ').replace('.mp3', '');
        li.textContent = name;
        li.onclick = () => playSong(index);
        playlistEl.appendChild(li);
    });
}

// 3. Fungsi Putar Lagu (Anti Macet)
async function playSong(index) {
    currentIndex = index;
    const name = songs[index].url.split('/').pop().replaceAll('%20', ' ').replace('.mp3', '');
    
    // Update Teks Berjalan (Sistem CSS Animation)
    songTitle.textContent = "Playing: " + name;

    // Reset Audio agar tidak 'stuck' atau diam saja
    audio.pause();
    audio.src = ""; 
    audio.crossOrigin = "anonymous"; // Bypass CORS Netlify
    audio.src = songs[index].url;
    audio.load(); // Paksa browser untuk mengenali file baru

    try {
        await audio.play(); // Menjalankan play dengan metode asinkron
    } catch (err) {
        console.log("Klik tombol play manual:", err);
        songTitle.textContent = "Klik tombol Play untuk memulai musik...";
    }
    
    // Highlight list lagu dan scroll otomatis agar tidak kosong bawahnya
    document.querySelectorAll('li').forEach((li, i) => {
        if (i === index) {
            li.classList.add("active");
            li.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } else {
            li.classList.remove("active");
        }
    });

    startVisualizer();
}

// 4. Otomatis Lanjut Lagu Berikutnya
audio.onended = () => {
    currentIndex = (currentIndex + 1) % songs.length;
    playSong(currentIndex);
};

// 5. Visualizer Bar Hijau Neon
function startVisualizer() {
    if (audioCtx) return;

    try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioCtx.createAnalyser();
        source = audioCtx.createMediaElementSource(audio);
        source.connect(analyser);
        analyser.connect(audioCtx.destination);
        
        analyser.fftSize = 64;
        const bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);

        function draw() {
            requestAnimationFrame(draw);
            analyser.getByteFrequencyData(dataArray);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            let barWidth = (canvas.width / bufferLength) * 2.5;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
                let barHeight = dataArray[i] / 5; // Skala agar tidak menutupi kontrol
                ctx.fillStyle = "#ccff00"; // Hijau neon
                ctx.fillRect(x, canvas.height - barHeight, barWidth - 2, barHeight);
                x += barWidth;
            }
        }
        draw();
    } catch (e) {
        console.log("Visualizer blocked by browser browser policy");
    }
}
