const audio = document.getElementById("audio");
const playlistEl = document.getElementById("playlist");
const songTitle = document.getElementById("songTitle");
const canvas = document.getElementById("visualizer");
const ctx = canvas.getContext("2d");

let songs = [];
let currentIndex = 0;
let audioCtx, analyser, source, dataArray;

// Ambil data playlist dengan penanganan error
fetch("playlist.json")
    .then(res => {
        if (!res.ok) throw new Error("Gagal load playlist.json");
        return res.json();
    })
    .then(data => {
        songs = data;
        renderPlaylist();
    })
    .catch(err => {
        console.error(err);
        songTitle.textContent = "Error: Playlist tidak ditemukan";
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

async function playSong(index) {
    try {
        currentIndex = index;
        const name = songs[index].url.split('/').pop().replaceAll('%20', ' ').replace('.mp3', '');
        songTitle.textContent = "Playing: " + name;

        // Reset audio sebelum putar yang baru
        audio.pause();
        audio.src = ""; 
        audio.crossOrigin = "anonymous";
        audio.src = songs[index].url;
        
        await audio.play(); // Menggunakan await untuk memastikan browser mengizinkan play
        
        document.querySelectorAll('li').forEach((li, i) => {
            li.classList.toggle("active", i === index);
            if (i === index) li.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        });

        startVisualizer();
    } catch (err) {
        console.error("Play failed:", err);
        songTitle.textContent = "Klik lagi untuk memutar...";
    }
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
        const bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);

        function draw() {
            requestAnimationFrame(draw);
            analyser.getByteFrequencyData(dataArray);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            let barWidth = (canvas.width / bufferLength) * 2.5;
            let x = 0;
            for (let i = 0; i < bufferLength; i++) {
                let barHeight = dataArray[i] / 5;
                ctx.fillStyle = "#ccff00";
                ctx.fillRect(x, canvas.height - barHeight, barWidth - 2, barHeight);
                x += barWidth;
            }
        }
        draw();
    } catch (e) {
        console.log("Visualizer blocked by browser");
    }
}
