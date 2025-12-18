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

// FUNGSI PLAY UTAMA
function playSong(index) {
    currentIndex = index;
    const name = songs[index].url.split('/').pop().replaceAll('%20', ' ').replace('.mp3', '');
    
    // Update Judul
    songTitle.textContent = "Playing: " + name;

    // PENTING: Bersihkan state audio agar tidak macet
    audio.pause();
    audio.removeAttribute('src'); 
    audio.load();
    
    // Masukkan URL baru
    audio.crossOrigin = "anonymous"; 
    audio.src = songs[index].url;

    // Jalankan play dengan interaksi user
    const playPromise = audio.play();
    
    if (playPromise !== undefined) {
        playPromise.then(_ => {
            console.log("Playback started");
            startVisualizer();
        }).catch(error => {
            console.log("Playback failed: " + error);
            // Jika autoplay gagal, user harus tekan tombol play manual
        });
    }

    // Update Tampilan List
    document.querySelectorAll('li').forEach((li, i) => {
        li.classList.toggle("active", i === index);
        if (i === index) li.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
}

audio.onended = () => {
    currentIndex = (currentIndex + 1) % songs.length;
    playSong(currentIndex);
};

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
                let barHeight = dataArray[i] / 5;
                ctx.fillStyle = "#ccff00";
                ctx.fillRect(x, canvas.height - barHeight, barWidth - 2, barHeight);
                x += barWidth;
            }
        }
        draw();
    } catch (e) { console.log("Visualizer blocked"); }
    }
                    
