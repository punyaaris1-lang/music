const audio = document.getElementById("audio");
const playlistEl = document.getElementById("playlist");
const songTitle = document.getElementById("songTitle");
const btnPlay = document.getElementById("btnPlay");
const canvas = document.getElementById("visualizer");
const ctx = canvas.getContext("2d");

let songs = [];
let currentIndex = 0;
let isPlaying = false;
let audioCtx, analyser, source, dataArray;
let isVisualizerInit = false;
let hue = 0; // Variabel untuk warna warni

// Hapus crossOrigin jika ada, biar ga error di Netlify
if(audio.hasAttribute("crossorigin")) {
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
        // Bersihkan nama file dari %20
        const rawName = song.url.split('/').pop().replace('.mp3', '');
        const cleanName = decodeURI(rawName).replaceAll('%20', ' '); 
        li.textContent = cleanName;
        
        li.onclick = () => {
            initAudioContext(); // PENTING: Pancing audio biar nyala
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

    // Reset Audio
    audio.pause();
    audio.src = songs[index].url;
    audio.load();
    
    // Play dengan penanganan error
    audio.play().then(() => {
        isPlaying = true;
        btnPlay.innerHTML = "⏸ PAUSE";
        songTitle.textContent = "Playing: " + cleanName;
        // Pastikan visualizer jalan
        initAudioContext();
    }).catch(e => {
        console.log("Auto-play ditahan browser:", e);
        btnPlay.innerHTML = "▶ PLAY";
        songTitle.textContent = "Tap Play untuk memutar...";
        isPlaying = false;
    });

    updateActiveList();
}

function togglePlay() {
    // Pastikan mesin audio nyala saat tombol ditekan
    initAudioContext();

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

// --- MESIN VISUALIZER RGB ---
function initAudioContext() {
    // Jika sudah init, cukup resume (bangunkan) kalau suspended
    if (audioCtx) {
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        return;
    }

    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioContext();
        analyser = audioCtx.createAnalyser();
        
        // KUNCI AGAR ADA SUARA:
        // Audio -> Analyser (Grafik) -> Destination (Speaker)
        source = audioCtx.createMediaElementSource(audio);
        source.connect(analyser);
        analyser.connect(audioCtx.destination); // <--- INI YG BIKIN BUNYI

        analyser.fftSize = 128; // Jumlah batang
        dataArray = new Uint8Array(analyser.frequencyBinCount);
        isVisualizerInit = true;
        
        drawVisualizer();
    } catch (e) {
        console.error("Gagal init visualizer:", e);
    }
}

function drawVisualizer() {
    requestAnimationFrame(drawVisualizer);
    if (!isVisualizerInit) return;

    analyser.getByteFrequencyData(dataArray);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Hitung lebar batang
    const barWidth = (canvas.width / dataArray.length) * 2.5;
    let x = 0;
    
    // Putar warna (Rainbow Effect)
    hue += 2; 

    for (let i = 0; i < dataArray.length; i++) {
        let barHeight = dataArray[i] / 3;
        
        // WARNA WARNI (HSL)
        ctx.fillStyle = `hsl(${i * 5 + hue}, 100%, 50%)`;
        
        // EFEK NEON GLOW
        ctx.shadowBlur = 10;
        ctx.shadowColor = `hsl(${i * 5 + hue}, 100%, 50%)`;

        ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);
        
        x += barWidth;
    }
    // Reset efek biar ringan
    ctx.shadowBlur = 0;
}
