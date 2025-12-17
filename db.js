let db;
const request = indexedDB.open('mlu-player-db', 1);

request.onupgradeneeded = e => {
  db = e.target.result;
  db.createObjectStore('songs', { keyPath: 'id', autoIncrement: true });
};

request.onsuccess = e => {
  db = e.target.result;
  loadSongs();
};

function saveSong(song) {
  const tx = db.transaction('songs', 'readwrite');
  tx.objectStore('songs').add(song);
}

function loadSongs() {
  const tx = db.transaction('songs', 'readonly');
  const store = tx.objectStore('songs');
  store.getAll().onsuccess = e => {
    songs = e.target.result.concat(songs);
    render();
  };
}
