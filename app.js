const audio = document.getElementById("audio");
const playlistEl = document.getElementById("playlist");
const canvas = document.getElementById("visualizer");
const ctx = canvas.getContext("2d");

let songs = [];
let currentIndex = 0;
let audioCtx, analyser, source, dataArray;

// 1. Muat Playlist dari GitHub
fetch("playlist.json")
    .then(res => res.json())
    .then(data => {
        songs = data;
        renderPlaylist();
    })
    .catch(err => console.error("Gagal memuat playlist:", err));

// 2. Tampilkan Daftar Lagu
function renderPlaylist() {
    playlistEl.innerHTML = "";
    songs.forEach((song, index) => {
        const li = document.createElement("li");
        // Mengambil nama file dan membersihkan format teks
        const name = song.url.split('/').pop().replaceAll('%20', ' ').replace('.mp3', '');
        li.textContent = name;
        li.onclick = () => playSong(index);
        playlistEl.appendChild(li);
    });
}

// 3. Fungsi Putar Lagu
function playSong(index) {
    currentIndex = index;
    
    // Bypass keamanan CORS agar soundbar bisa membaca data dari Netlify
    audio.crossOrigin = "anonymous"; 
    audio.src = songs[index].url;
    audio.load();
    audio.play();
    
    // Update tampilan list (efek mewah highlight)
    document.querySelectorAll('li').forEach((li, i) => {
        if (i === index) {
            li.classList.add("active");
            li.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } else {
            li.classList.remove("active");
        }
    });

    // Jalankan visualizer setelah interaksi pertama
    startVisualizer();
}

// 4. Fitur Otomatis Lanjut Lagu (Auto Next)
audio.onended = () => {
    currentIndex = (currentIndex + 1) % songs.length;
    playSong(currentIndex);
};

// 5. Script Soundbar (Visualizer)
function startVisualizer() {
    // Mencegah pembuatan context ganda yang bisa bikin lag
    if (audioCtx) return;

    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioCtx.createAnalyser();
    
    // Hubungkan audio ke analyser
    source = audioCtx.createMediaElementSource(audio);
    source.connect(analyser);
    analyser.connect(audioCtx.destination);
    
    analyser.fftSize = 64; // Jumlah batang soundbar
    const bufferLength = analyser.frequencyBinCount;
    dataArray = new Uint8Array(bufferLength);

    function draw() {
        requestAnimationFrame(draw);
        analyser.getByteFrequencyData(dataArray);
        
        // Bersihkan canvas setiap frame
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        let barWidth = (canvas.width / bufferLength) * 2.5;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
            // Skala tinggi bar disesuaikan agar tidak menutupi timer audio
            let barHeight = dataArray[i] / 5; 
            
            ctx.fillStyle = "#ccff00"; // Warna aksen hijau neon
            // Menggambar bar dari bawah ke atas
            ctx.fillRect(x, canvas.height - barHeight, barWidth - 2, barHeight);
            
            x += barWidth;
        }
    }
    draw();
}
