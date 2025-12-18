const audio = document.getElementById("audio");
const playlistEl = document.getElementById("playlist");
const songTitle = document.getElementById("songTitle");
const canvas = document.getElementById("visualizer");
const ctx = canvas.getContext("2d");

let songs = [];
let currentIndex = 0;
let audioCtx, analyser, source, dataArray;

// Ambil Playlist
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

function playSong(index) {
    currentIndex = index;
    const name = songs[index].url.split('/').pop().replaceAll('%20', ' ').replace('.mp3', '');
    
    // Update Teks Berjalan
    songTitle.textContent = "Playing: " + name;

    audio.crossOrigin = "anonymous";
    audio.src = songs[index].url;
    audio.play();
    
    // Update Tampilan Aktif & Scroll Otomatis
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

audio.onended = () => {
    currentIndex = (currentIndex + 1) % songs.length;
    playSong(currentIndex);
};

function startVisualizer() {
    if (audioCtx) return;
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
}
