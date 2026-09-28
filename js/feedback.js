let activePopup = null;
let hideTimeout = null;

function ensureStyles() {
  if (document.getElementById("app-popup-styles")) return;

  const style = document.createElement("style");
  style.id = "app-popup-styles";
  style.textContent = `
    dialog.app-popup {
      position: fixed;
      top: 20px;
      right: 20px;
      left: auto;
      bottom: auto;
      margin: 0;
      z-index: 12000;
      width: auto;
      height: auto;
      min-width: 280px;
      max-width: 420px;
      border: none;
      border-radius: 12px;
      padding: 14px 16px;
      color: #fff;
      font-size: 16px;
      line-height: 1.35;
      font-weight: 500;
      box-shadow: 0 10px 24px rgba(0, 0, 0, 0.24);
      opacity: 0;
      transform: translateY(-8px);
      transition: opacity 160ms ease, transform 160ms ease;
    }

    .app-popup.show {
      opacity: 1;
      transform: translateY(0);
    }

    .app-popup.error {
      background: #c62828;
    }

    .app-popup.success {
      background: #2e7d32;
    }

    .app-popup.info {
      background: #2a3647;
    }

    @media (max-width: 600px) {
      dialog.app-popup {
        right: 12px;
        left: 12px;
        top: 12px;
        min-width: auto;
        max-width: none;
      }
    }
  `;

  document.head.appendChild(style);
}

function clearPopup() {
  activePopup?.remove();
  activePopup = null;
}

function ensureBoardToastStyles() {
  if (document.getElementById("board-toast-styles")) return;

  const style = document.createElement("style");
  style.id = "board-toast-styles";
  style.textContent = `
    .board-toast {
      position: fixed;
      left: 50%;
      top: 50%;
      transform: translate(-50%, 150vh);
      background: #2a3647;
      color: #fff;
      padding: 22px 30px;
      border-radius: 20px;
      font-size: 20px;
      font-weight: 500;
      box-shadow: 0 10px 24px rgba(0, 0, 0, 0.24);
      z-index: 13000;
      white-space: nowrap;
      transition: transform 350ms ease-out;
      pointer-events: none;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .board-toast img {
      width: 28px;
      height: 28px;
    }

    .board-toast.show {
      transform: translate(-50%, -50%);
    }

    @media (max-width: 600px) {
      .board-toast {
        font-size: 17px;
        padding: 18px 24px;
      }
    }
  `;

  document.head.appendChild(style);
}

export function showBoardToast(message = "Task added to board", duration = 1000) {
  ensureBoardToastStyles();

  const toast = document.createElement("div");
  toast.className = "board-toast";
  toast.setAttribute("role", "status");

  const label = document.createElement("span");
  label.textContent = message;

  const icon = document.createElement("img");
  icon.src = "./assets/sideboardAssets/board.svg";
  icon.alt = "";

  toast.append(label, icon);

  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add("show"));

  setTimeout(() => {
    if (toast.parentElement) toast.remove();
  }, duration + 400);
}

export function showPopup(message, type = "error", duration = 3200) {
  if (!message) return;

  ensureStyles();
  clearTimeout(hideTimeout);
  clearPopup();

  const popup = document.createElement("dialog");
  popup.className = `app-popup ${type}`;
  popup.setAttribute("role", "alert");
  popup.textContent = String(message);

  document.body.appendChild(popup);
  activePopup = popup;
  popup.setAttribute("open", "");
  requestAnimationFrame(() => popup.classList.add("show"));

  hideTimeout = setTimeout(() => {
    popup.classList.remove("show");
    setTimeout(() => {
      if (activePopup === popup) clearPopup();
      else popup.remove();
    }, 180);
  }, duration);
}
