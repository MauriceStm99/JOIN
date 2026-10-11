const loader = document.getElementById("loader");

/**
 * Hides the loader overlay as soon as its fade-out animation has finished.
 * @param {AnimationEvent} event - The animationend event.
 */
function handleLoaderAnimationEnd(event) {
  if (event.animationName === "loaderFadeOut") {
    loader.style.display = "none";
  }
}

loader.addEventListener("animationend", handleLoaderAnimationEnd);
