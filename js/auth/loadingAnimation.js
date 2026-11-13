/**
 * Hides the loader overlay as soon as its fade-out animation has finished.
 * @param {AnimationEvent} event - The animationend event of the loader or its logo.
 */
function handleLoaderAnimationEnd(event) {
  if (event.animationName === "loaderFadeOut") {
    event.currentTarget.style.display = "none";
  }
}

/**
 * Waits for the end of the loader animation.
 */
function initLoadingAnimation() {
  document.getElementById("loader")?.addEventListener("animationend", handleLoaderAnimationEnd);
}

document.addEventListener("DOMContentLoaded", initLoadingAnimation);
