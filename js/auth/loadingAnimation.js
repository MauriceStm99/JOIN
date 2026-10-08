const loader = document.getElementById("loader");

loader.addEventListener("animationend", (event) => {
  if (event.animationName === "loaderFadeOut") {
    loader.style.display = "none";
  }
});
