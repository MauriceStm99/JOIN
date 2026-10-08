const logo = document.querySelector('.logo img');
const loginBox = document.querySelector('.login-box');

function checkOverlap() {
  const logoRect = logo.getBoundingClientRect();
  const loginRect = loginBox.getBoundingClientRect();


  const isOverlapping = !(
    logoRect.right < loginRect.left ||
    logoRect.left > loginRect.right ||
    logoRect.bottom < loginRect.top ||
    logoRect.top > loginRect.bottom
  );


  logo.style.opacity = isOverlapping ? '0' : '1';
}

window.addEventListener('load', checkOverlap);

window.addEventListener('resize', checkOverlap);


