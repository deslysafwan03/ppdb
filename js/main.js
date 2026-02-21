// Menu mobile toggle (opsional)
const menuToggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('nav ul');
if(menuToggle){
  menuToggle.addEventListener('click', ()=> nav.classList.toggle('active'));
}
