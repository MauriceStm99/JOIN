const logo = document.querySelector(".logo img");
const loginBox = document.querySelector(".login-box");

/**
 * Checks whether two rectangles overlap.
 * @param {DOMRect} a - First rectangle.
 * @param {DOMRect} b - Second rectangle.
 * @returns {boolean} True if they overlap.
 */
function rectsOverlap(a, b) {
  return !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom);
}

/**
 * Hides the logo while it overlaps the login box.
 */
function checkOverlap() {
  const isOverlapping = rectsOverlap(logo.getBoundingClientRect(), loginBox.getBoundingClientRect());
  logo.style.opacity = isOverlapping ? "0" : "1";
}

window.addEventListener("load", checkOverlap);
window.addEventListener("resize", checkOverlap);
