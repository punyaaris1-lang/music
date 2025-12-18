const audio = document.getElementById("audio");
const playlistEl = document.getElementById("playlist");
const songTitle = document.getElementById("songTitle");
const btnPlay = document.getElementById("btnPlay");
const canvas = document.getElementById("visualizer");
const ctx = canvas.getContext("2d");

let songs = [];
let currentIndex = 0;
let isPlaying = false;

// Variabel Global Audio Context (PENTING: Jangan dibuat ulang)
let audioCtx, analyser, source, dataArray;
let isVisualizerConnected = false;
let hue = 0;

// Pastikan CrossOrigin aktif untuk GitHub
audio.crossOrigin = "anonymous";

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

    // Stop & Reset
    audio.pause();
    audio.src = songs[index].url;
    audio.load();

    // Play Audio
    audio.play().then(() => {
        isPlaying = true;
        btnPlay.innerHTML = "⏸ PAUSE";
        songTitle.textContent = "Playing: " + cleanName;
        
        // Coba nyalakan visualizer SETELAH lagu bunyi
        setupVisualizer();
        
    }).catch(e => {
        console.error("Play Gagal:", e);
        btnPlay.innerHTML = "▶ PLAY";
        songTitle.textContent = "Klik Play Manual...";
        isPlaying = false;
    });

    updateActiveList();
}

function togglePlay() {
    // Pancing Visualizer saat tombol ditekan
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    if (!audio.src && songs.length > 0) {
        playSong(0);
        return;
    }

    if (isPlaying) {
        audio.pause();
        isPlaying = false;
        btnPlay.innerHTML = "▶ PLAY";
    } else {
        audio.play().then(() => {
            isPlaying = true;
            btnPlay.innerHTML = "⏸ PAUSE";
            setupVisualizer();
        });
    }
}

function stopSong() {
    audio.pause();
    audio.currentTime = 0;
    isPlaying = false;
    btnPlay.innerHTML = "▶ PLAY";
    songTitle.textContent = "Musik Dihentikan";
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

// --- VISUALIZER ENGINE (STABIL) ---
function setupVisualizer() {
    // Jika sudah pernah connect, cukup resume context-nya
    if (isVisualizerConnected) {
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        return;
    }

    try {
        // Inisialisasi SATU KALI SAJA seumur hidup page load
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioContext();
        analyser = audioCtx.createAnalyser();
        
        // Bikin Source dari Audio Element
        source = audioCtx.createMediaElementSource(audio);
        
        // Sambungkan: Audio -> Analyser -> Speaker
        source.connect(analyser);
        analyser.connect(audioCtx.destination); // Ini yg bikin bunyi

        analyser.fftSize = 128;
        dataArray = new Uint8Array(analyser.frequencyBinCount);
        
        isVisualizerConnected = true; // Tandai sudah connect
        drawVisualizer();
        
    } catch (e) {
        console.log("Visualizer Gagal (Mungkin Embed memblokir AudioContext):", e);
        // Kalau gagal, audio tetap bunyi lewat jalur native browser karena source connect gagal
    }
}

function drawVisualizer() {
    requestAnimationFrame(drawVisualizer);
    
    if (!isVisualizerConnected) return;

    analyser.getByteFrequencyData(dataArray);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const barWidth = (canvas.width / dataArray.length) * 2.5;
    let x = 0;
    
    hue += 2; // Kecepatan warna warni

    for (let i = 0; i < dataArray.length; i++) {
        let barHeight = dataArray[i] / 3;
        
        // Warna Warni RGB
        ctx.fillStyle = `hsl(${i * 5 + hue}, 100%, 50%)`;
        
        // Efek Glow
        ctx.shadowBlur = 10;
        ctx.shadowColor = `hsl(${i * 5 + hue}, 100%, 50%)`;

        ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);
        x += barWidth;
    }
    ctx.shadowBlur = 0;
}
