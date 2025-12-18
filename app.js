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

// 1. Ambil Playlist
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
        const name = song.url.split('/').pop().replaceAll('%20', ' ').replace('.mp3', '');
        li.textContent = name;
        li.onclick = () => playSong(index);
        playlistEl.appendChild(li);
    });
}

// 2. Fungsi Utama Play
function playSong(index) {
    currentIndex = index;
    const name = songs[index].url.split('/').pop().replaceAll('%20', ' ').replace('.mp3', '');
    songTitle.textContent = "Playing: " + name;

    audio.src = songs[index].url;
    audio.load();
    
    // Panggil fungsi togglePlay untuk mulai
    isPlaying = false; 
    togglePlay();

    updateActiveList();
    startVisualizer();
}

// 3. Tombol Play / Pause (Ganti Icon)
function togglePlay() {
    if (audio.src === "") {
        playSong(0); // Jika belum ada lagu, putar lagu pertama
        return;
    }

    if (isPlaying) {
        audio.pause();
        isPlaying = false;
        btnPlay.textContent = "▶"; // Icon Play
    } else {
        audio.play().then(() => {
            isPlaying = true;
            btnPlay.textContent = "⏸"; // Icon Pause
        }).catch(err => console.log("Perlu interaksi user"));
    }
}

// 4. Tombol Stop
function stopSong() {
    audio.pause();
    audio.currentTime = 0;
    isPlaying = false;
    btnPlay.textContent = "▶";
    songTitle.textContent = "Musik Dihentikan";
}

// 5. Tombol Next
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

// Otomatis Next saat lagu habis
audio.onended = () => nextSong();

// Visualizer
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
