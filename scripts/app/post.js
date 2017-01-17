document.getElementById('like-button').addEventListener('click', function() {
  cmb.event('vote', 1);
  this.style.backgroundColor = '#e6f277';
});
