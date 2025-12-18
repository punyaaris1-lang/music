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
let isAutoplayAttempted = false;

// 1. AMBIL PLAYLIST & COBA AUTO PLAY
fetch("playlist.json")
    .then(res => res.json())
    .then(data => {
        songs = data;
        renderPlaylist();
        
        // FITUR AUTO START: Coba putar lagu pertama langsung
        if (songs.length > 0) {
            // Kita set timeout dikit biar loading beres
            setTimeout(() => {
                playSong(0, true); // True artinya ini percobaan autoplay
            }, 500);
        }
    });

function renderPlaylist() {
    playlistEl.innerHTML = "";
    songs.forEach((song, index) => {
        const li = document.createElement("li");
        // Bersihkan nama file agar rapi
        const name = song.url.split('/').pop().replaceAll('%20', ' ').replace('.mp3', '');
        li.textContent = name;
        li.onclick = () => playSong(index, false);
        playlistEl.appendChild(li);
    });
}

function playSong(index, isAutoStart = false) {
    currentIndex = index;
    const name = songs[index].url.split('/').pop().replaceAll('%20', ' ').replace('.mp3', '');
    
    // Set judul dulu
    songTitle.textContent = "Loading: " + name;

    audio.src = songs[index].url;
    audio.load();
    
    isPlaying = false;
    
    // Panggil fungsi pemutar
    attemptPlay(name, isAutoStart);

    updateActiveList();
    startVisualizer();
}

function attemptPlay(songName, isAutoStart) {
    audio.play().then(() => {
        // SUKSES PLAY
        isPlaying = true;
        btnPlay.innerHTML = "⏸ PAUSE";
        songTitle.textContent = "Playing: " + songName;
    }).catch(error => {
        // GAGAL PLAY (DIBLOKIR BROWSER)
        console.log("Autoplay diblokir browser, menunggu klik user.");
        isPlaying = false;
        btnPlay.innerHTML = "▶ PLAY";
        
        if (isAutoStart) {
            // Jika ini auto start awal, kasih tahu user
            songTitle.textContent = "TAP TOMBOL PLAY UNTUK MEMULAI 🎵";
        } else {
            // Jika gagal di tengah jalan
            songTitle.textContent = "Klik Play untuk memutar...";
        }
    });
}

function togglePlay() {
    // Jika belum ada lagu, putar no 0
    if (!audio.src) { 
        playSong(0, false); 
        return; 
    }

    if (isPlaying) {
        audio.pause();
        isPlaying = false;
        btnPlay.innerHTML = "▶ PLAY";
    } else {
        // Coba play lagi saat tombol diklik
        const currentName = songs[currentIndex].url.split('/').pop().replaceAll('%20', ' ').replace('.mp3', '');
        attemptPlay(currentName, false);
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
    playSong(currentIndex, false); // False karena ini interaksi user/lanjutan
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

// Auto Next saat lagu habis
audio.onended = () => nextSong();

function startVisualizer() {
    if (audioCtx) return;
    try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioCtx.createAnalyser();
        source = audioCtx.createMediaElementSource(audio);
        source.connect(analyser);
        analyser.connect(audioCtx.destination);
        analyser.fftSize = 64;
        dataArray = new Uint8Array(analyser.frequencyBinCount);

        function draw() {
            requestAnimationFrame(draw);
            analyser.getByteFrequencyData(dataArray);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            let barWidth = (canvas.width / dataArray.length) * 2.5;
            let x = 0;
            for (let i = 0; i < dataArray.length; i++) {
                let barHeight = dataArray[i] / 4;
                ctx.fillStyle = "#ccff00";
                ctx.fillRect(x, canvas.height - barHeight, barWidth - 2, barHeight);
                x += barWidth;
            }
        }
        draw();
    } catch (e) {}
}
