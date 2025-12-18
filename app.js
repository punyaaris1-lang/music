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
        li.onclick = () => playSong(index);
        playlistEl.appendChild(li);
    });
}

function playSong(index) {
    currentIndex = index;
    const rawName = songs[index].url.split('/').pop().replace('.mp3', '');
    const cleanName = decodeURI(rawName).replaceAll('%20', ' '); 
    songTitle.textContent = "Loading: " + cleanName;

    audio.pause();
    audio.src = songs[index].url;
    audio.load();
    
    btnPlay.innerHTML = "⏳";
    
    audio.play().then(() => {
        isPlaying = true;
        btnPlay.innerHTML = "⏸ PAUSE";
        songTitle.textContent = "Playing: " + cleanName;
        initAudioContext();
    }).catch(error => {
        console.log("Play error:", error);
        btnPlay.innerHTML = "▶ PLAY";
        songTitle.textContent = "Tap Play untuk memutar...";
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
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        audio.play().then(() => {
            isPlaying = true;
            btnPlay.innerHTML = "⏸ PAUSE";
            initAudioContext();
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

// VISUALIZER RGB (WARNA WARNI)
function initAudioContext() {
    if (isVisualizerInit) return;
    
    try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioCtx.createAnalyser();
        source = audioCtx.createMediaElementSource(audio);
        source.connect(analyser);
        analyser.connect(audioCtx.destination);
        
        analyser.fftSize = 64; // Jumlah batang bar
        dataArray = new Uint8Array(analyser.frequencyBinCount);
        isVisualizerInit = true;
        
        drawVisualizer();
    } catch (e) { console.log(e); }
}

function drawVisualizer() {
    if (!isVisualizerInit) return;
    requestAnimationFrame(drawVisualizer);
    
    analyser.getByteFrequencyData(dataArray);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    let barWidth = (canvas.width / dataArray.length) * 2.5;
    let x = 0;
    
    // Kecepatan ganti warna (semakin besar angka, semakin cepat)
    hue += 2; 

    for (let i = 0; i < dataArray.length; i++) {
        let barHeight = dataArray[i] / 3.5; // Skala tinggi bar
        
        // RUMUS WARNA WARNI (Rainbow HSL)
        // i * 10 = membuat gradasi antar batang
        // hue = membuat warna bergerak terus
        ctx.fillStyle = `hsl(${i * 10 + hue}, 100%, 50%)`;
        
        // Gambar Batang
        ctx.fillRect(x, canvas.height - barHeight, barWidth - 2, barHeight);
        
        // Efek Bayangan (Opsional, biar makin glowing)
        ctx.shadowBlur = 10;
        ctx.shadowColor = `hsl(${i * 10 + hue}, 100%, 50%)`;

        x += barWidth;
    }
    // Reset shadow biar ga berat
    ctx.shadowBlur = 0; 
}
