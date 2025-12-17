let audio = document.getElementById('audio');
let playlist = document.getElementById('playlist');
let fileInput = document.getElementById('fileInput');
let progress = document.getElementById('progress');
let search = document.getElementById('search');

let songs = [];
let current = 0;

/* ===== PLAYLIST LINK (ADMIN) ===== */
const linkPlaylist = [
  "https://archive.org/download/150-lagu-indonesia-terbaik/01%20-%20Padi%20-%20Kasih%20Tak%20Sampai.mp3",
  "https://archive.org/download/150-lagu-indonesia-terbaik/02%20-%20Sheila%20On%207%20-%20Sephia.mp3"
];

linkPlaylist.forEach(url=>{
  const name = decodeURIComponent(url.split('/').pop()).replace('.mp3','');
  songs.push({ name, url });
});

/* ===== UPLOAD FILE ===== */
fileInput.onchange = e => {
  [...e.target.files].forEach(file => {
    const reader = new FileReader();
    reader.onload = () => {
      saveSong({ name:file.name, data:reader.result });
    };
    reader.readAsDataURL(file);
  });
};

/* ===== CACHE FROM LINK ===== */
async function cacheFromLink(name, url){
  const res = await fetch(url);
  const blob = await res.blob();
  const reader = new FileReader();
  reader.onload = () => saveSong({ name, data: reader.result });
  reader.readAsDataURL(blob);
}

/* ===== RENDER ===== */
function render(filter='') {
  playlist.innerHTML = '';
  songs.filter(s => s.name.toLowerCase().includes(filter))
  .forEach((song,i)=>{
    let li = document.createElement('li');
    li.textContent = song.name;
    li.onclick = ()=>play(i);

    /* klik kanan / long press = cache */
    li.oncontextmenu = e => {
      e.preventDefault();
      if(song.url && !song.data){
        cacheFromLink(song.name, song.url);
        alert("Lagu dicache ke HP");
      }
    };

    if(i===current) li.classList.add('active');
    playlist.appendChild(li);
  });
}

/* ===== PLAY ===== */
function play(i){
  current=i;
  audio.src = songs[i].data || songs[i].url;
  audio.play();
  render(search.value.toLowerCase());
}

function togglePlay(){ audio.paused ? audio.play() : audio.pause(); }
function next(){ play((current+1)%songs.length); }
function prev(){ play((current-1+songs.length)%songs.length); }
function shuffle(){ songs.sort(()=>Math.random()-0.5); render(); }

audio.ontimeupdate = () =>
  progress.value = (audio.currentTime/audio.duration)*100 || 0;

progress.oninput = () =>
  audio.currentTime = (progress.value/100)*audio.duration;

search.oninput = () => render(search.value.toLowerCase());

render();
