const audio = document.getElementById("audio");
const playlistEl = document.getElementById("playlist");
const songTitle = document.getElementById("songTitle");
const btnPlay = document.getElementById("btnPlay");
const canvas = document.getElementById("visualizer");
const ctx = canvas.getContext("2d");

let songs = [];
let currentIndex = 0;
let isPlaying = false;
let animationId;
let hue = 0; // Warna warni

// Hapus settingan CORS yg bikin ribet, kembalikan ke standar
if (audio.hasAttribute("crossorigin")) {
    audio.removeAttribute("crossorigin");
}

// 1. AMBIL PLAYLIST
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
        const rawName = song.url.split('/').pop().replace('.mp3', '');
        const cleanName = decodeURI(rawName).replaceAll('%20', ' ');
        li.textContent = cleanName;
        
        li.onclick = () => {
            playSong(index);
        };
        playlistEl.appendChild(li);
    });
}

function playSong(index) {
    currentIndex = index;
    const rawName = songs[index].url.split('/').pop().replace('.mp3', '');
    const cleanName = decodeURI(rawName).replaceAll('%20', ' ');
    
    songTitle.textContent = "Loading: " + cleanName;
    btnPlay.innerHTML = "⏳";

    // Stop dulu
    audio.pause();
    audio.src = songs[index].url;
    audio.load();

    // Play Audio (Tanpa otak-atik AudioContext)
    audio.play().then(() => {
        isPlaying = true;
        btnPlay.innerHTML = "⏸ PAUSE";
        songTitle.textContent = "Playing: " + cleanName;
        
        // Jalankan Animasi Bar
        startAnimation();
        
    }).catch(e => {
        console.error("Play Gagal:", e);
        btnPlay.innerHTML = "▶ PLAY";
        songTitle.textContent = "Klik Play Manual...";
        isPlaying = false;
        stopAnimation();
    });

    updateActiveList();
}

function togglePlay() {
    if (!audio.src && songs.length > 0) {
        playSong(0);
        return;
    }

    if (isPlaying) {
        audio.pause();
        isPlaying = false;
        btnPlay.innerHTML = "▶ PLAY";
        stopAnimation();
    } else {
        audio.play().then(() => {
            isPlaying = true;
            btnPlay.innerHTML = "⏸ PAUSE";
            startAnimation();
        });
    }
}

function stopSong() {
    audio.pause();
    audio.currentTime = 0;
    isPlaying = false;
    btnPlay.innerHTML = "▶ PLAY";
    songTitle.textContent = "Musik Dihentikan";
    stopAnimation();
    clearCanvas(); // Bersihkan visualizer
}

function nextSong() {
    currentIndex = (currentIndex + 1) % songs.length;
    playSong(currentIndex);
}

function updateActiveList() {
    document.querySelectorAll('li').forEach((li, i) => {
        if (i === currentIndex) {
            li.classList.add("active");
            li.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } else {
            li.classList.remove("active");
        }
    });
}

audio.onended = () => nextSong();

// --- VISUALIZER SIMULASI (BIAR AUDIO AMAN) ---
// Kita buat grafik gerak sendiri tanpa mengambil data dari audio
// Ini menjamin audio tidak akan bisu karena error sistem

function startAnimation() {
    if (animationId) cancelAnimationFrame(animationId);
    drawVisualizer();
}

function stopAnimation() {
    if (animationId) cancelAnimationFrame(animationId);
}

function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function drawVisualizer() {
    if (!isPlaying) return; // Stop kalau pause

    animationId = requestAnimationFrame(drawVisualizer);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Jumlah batang
    const barCount = 40; 
    const barWidth = (canvas.width / barCount) * 1.5;
    let x = 0;
    
    hue += 3; // Kecepatan ganti warna

    for (let i = 0; i < barCount; i++) {
        // RUMUS GERAK ACAK NAMUN HALUS (Simulasi Irama)
        // Menggunakan waktu (Date.now) biar gelombang jalan
        const time = Date.now() / 150; 
        const wave = Math.sin(i * 0.5 + time) * 20; // Gelombang dasar
        const random = Math.random() * 15; // Sedikit getaran acak
        
        // Tinggi bar bervariasi (Min 5px, Max naik turun)
        let barHeight = 10 + Math.abs(wave) + random; 
        
        // Batasi tinggi biar ga keluar canvas
        if (barHeight > canvas.height) barHeight = canvas.height;

        // WARNA WARNI RGB
        ctx.fillStyle = `hsl(${i * 10 + hue}, 100%, 50%)`;
        
        // EFEK GLOWING
        ctx.shadowBlur = 15;
        ctx.shadowColor = `hsl(${i * 10 + hue}, 100%, 50%)`;

        // Gambar Bar (Posisi di tengah secara vertikal biar keren, atau bawah)
        // Kita taruh dari bawah:
        ctx.fillRect(x, canvas.height - barHeight, barWidth - 2, barHeight);
        
        x += barWidth;
    }
    // Reset shadow
    ctx.shadowBlur = 0;
}
