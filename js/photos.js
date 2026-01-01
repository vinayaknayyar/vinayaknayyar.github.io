let currentAlbum = Object.keys(albums)[0]; // default to first album
let currentIndex = 0;

function updateView() {
  const photo = albums[currentAlbum][currentIndex];
  document.getElementById('photo').src = photo.src;
  document.getElementById('description').textContent = photo.description;
  document.getElementById('counter').textContent = `${currentIndex + 1}/${albums[currentAlbum].length}`;
}


function nextPhoto() {
  const total = albums[currentAlbum].length;
  currentIndex = (currentIndex + 1) % total;
  updateView();

}

function prevPhoto() {
   const total = albums[currentAlbum].length;
   currentIndex = (currentIndex - 1 + total) % total;
   updateView();
}

function selectAlbum(albumName) {
  if (albums.hasOwnProperty(albumName)) {
    // Remove active class from all album links
    document.querySelectorAll('.album-link').forEach(link => {
      link.classList.remove('active');
    });

    // Add active class to the selected album link
    const selectedLink = document.querySelector(`.album-link[data-album="${albumName}"]`);
    if (selectedLink) {
          selectedLink.classList.add('active');
          console.log(`Activated album: ${albumName}`, selectedLink); // DEBUG
        } else {
          console.warn(`No album link found for: ${albumName}`); // DEBUG
        }

    currentAlbum = albumName;
    currentIndex = 0;
    updateView();
  }
}

// Keyboard navigation
document.addEventListener('keydown', function (e) {
  if (e.key === 'ArrowRight') {
    nextPhoto();
  } else if (e.key === 'ArrowLeft') {
    prevPhoto();
  }
});

document.querySelectorAll('.album-link').forEach(link => {
  link.addEventListener('click', function() {
    const albumName = this.getAttribute('data-album');
    selectAlbum(albumName);
  });
});

window.onload = function () {
  updateView();
  // Set first album as active initially
  const firstAlbumLink = document.querySelector('#albums li:first-child a');
  if (firstAlbumLink) {
    firstAlbumLink.classList.add('active');
  }
};

