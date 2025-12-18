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
let hue = 0;

// Hapus atribut pembawa masalah
if (audio.hasAttribute("crossorigin")) {
    audio.removeAttribute("crossorigin");
}

// 1. GLOBAL UNLOCK (Bangunkan Audio Engine saat layar disentuh dimanapun)
function unlockAudioEngine() {
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume().then(() => {
            console.log("Audio Engine Woke Up!");
        });
    }
    // Buat context kosong jika belum ada, buat mancing browser
    if (!audioCtx) {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            new AudioContext().close(); // Buka tutup cuma buat pancingan
        } catch (e) {}
    }
}
// Pasang pendengar di seluruh layar
document.body.addEventListener('touchstart', unlockAudioEngine, { passive: true });
document.body.addEventListener('click', unlockAudioEngine, { passive: true });


// 2. AMBIL PLAYLIST
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

    // Reset Audio
    audio.pause();
    // Mode aman: matikan visualizer dulu sebelum play
    disconnectVisualizer(); 
    
    audio.src = songs[index].url;
    audio.load();
    
    audio.play().then(() => {
        isPlaying = true;
        btnPlay.innerHTML = "⏸ PAUSE";
        songTitle.textContent = "Playing: " + cleanName;
        
        // Coba nyalakan visualizer (tapi siap-siap gagal)
        tryStartVisualizer();
        
    }).catch(e => {
        console.log("Play error:", e);
        btnPlay.innerHTML = "▶ PLAY";
        songTitle.textContent = "Klik Play untuk memutar...";
        isPlaying = false;
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
    } else {
        audio.play().then(() => {
            isPlaying = true;
            btnPlay.innerHTML = "⏸ PAUSE";
            tryStartVisualizer();
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


// --- SISTEM VISUALIZER AMAN (SAFE MODE) ---

function disconnectVisualizer() {
    // Putuskan sambungan visualizer biar audio langsung ke speaker
    // Ini penting buat reset kalau error
    isVisualizerInit = false;
}

function tryStartVisualizer() {
    // Kalau audio context belum ada atau suspended, coba bangunkan
    if (!audioCtx) {
        initAudioContext();
    } else if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    
    // Cek apakah beneran jalan?
    setTimeout(() => {
        if (audioCtx && audioCtx.state === 'running') {
            isVisualizerInit = true;
            drawVisualizer();
        } else {
            console.log("Visualizer gagal start di Embed, pakai mode audio biasa.");
            // Biarkan visualizer mati, jangan dipaksa connect, biar suara tetap keluar
        }
    }, 500);
}

function initAudioContext() {
    if (audioCtx) return;

    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioContext();
        analyser = audioCtx.createAnalyser();
        
        source = audioCtx.createMediaElementSource(audio);
        source.connect(analyser);
        analyser.connect(audioCtx.destination); 

        analyser.fftSize = 128; 
        dataArray = new Uint8Array(analyser.frequencyBinCount);
        
    } catch (e) {
        console.error("Gagal init visualizer:", e);
    }
}

function drawVisualizer() {
    if (!isVisualizerInit) return;
    
    requestAnimationFrame(drawVisualizer);
    analyser.getByteFrequencyData(dataArray);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const barWidth = (canvas.width / dataArray.length) * 2.5;
    let x = 0;
    hue += 2; 

    for (let i = 0; i < dataArray.length; i++) {
        let barHeight = dataArray[i] / 3;
        ctx.fillStyle = `hsl(${i * 5 + hue}, 100%, 50%)`;
        ctx.shadowBlur = 15;
        ctx.shadowColor = `hsl(${i * 5 + hue}, 100%, 50%)`;
        ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);
        x += barWidth;
    }
    ctx.shadowBlur = 0;
             }
        
