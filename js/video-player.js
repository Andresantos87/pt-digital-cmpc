/**
 * Player Unificado de Vídeos (YouTube IFrame API, MP4, Google Drive e Modo Demo)
 */
window.PTVideoPlayer = (function () {
  let ytApiLoaded = false;
  let ytApiCallbacks = [];
  let activeTimer = null;
  let activeYtPlayer = null;

  function ensureYouTubeAPI(callback) {
    if (window.YT && window.YT.Player) {
      callback();
      return;
    }
    ytApiCallbacks.push(callback);
    if (ytApiLoaded) return;
    ytApiLoaded = true;

    const prevReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = function () {
      if (typeof prevReady === "function") prevReady();
      const cbs = ytApiCallbacks.slice();
      ytApiCallbacks = [];
      cbs.forEach((cb) => cb());
    };

    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
  }

  function cleanup() {
    if (activeTimer) {
      clearInterval(activeTimer);
      activeTimer = null;
    }
    if (activeYtPlayer && typeof activeYtPlayer.destroy === "function") {
      try {
        activeYtPlayer.destroy();
      } catch (_) {}
      activeYtPlayer = null;
    }
  }

  function mount(containerEl, video, lang, callbacks) {
    cleanup();
    containerEl.innerHTML = "";

    const threshold = window.PT_CONFIG.VIDEO_COMPLETE_THRESHOLD || 0.9;
    const preventSkip = Boolean(window.PT_CONFIG.PREVENT_FAST_FORWARD);
    let maxTimeReached = 0;

    if (video.type === "youtube" && video.src) {
      const mountDiv = document.createElement("div");
      mountDiv.id = "yt-player-mount";
      containerEl.appendChild(mountDiv);

      ensureYouTubeAPI(() => {
        activeYtPlayer = new window.YT.Player("yt-player-mount", {
          videoId: video.src,
          width: "100%",
          height: "100%",
          playerVars: {
            rel: 0,
            modestbranding: 1,
            playsinline: 1,
          },
          events: {
            onStateChange: function (event) {
              if (event.data === window.YT.PlayerState.ENDED) {
                callbacks.onProgress(1, true);
              }
            },
          },
        });

        activeTimer = setInterval(() => {
          if (!activeYtPlayer || typeof activeYtPlayer.getCurrentTime !== "function") return;
          const duration = activeYtPlayer.getDuration() || 0;
          const current = activeYtPlayer.getCurrentTime() || 0;
          if (duration <= 0) return;

          if (preventSkip && current > maxTimeReached + 3) {
            activeYtPlayer.seekTo(maxTimeReached, true);
            return;
          }
          if (current > maxTimeReached) maxTimeReached = current;

          const ratio = Math.min(1, maxTimeReached / duration);
          callbacks.onProgress(ratio, ratio >= threshold);
        }, 1000);
      });
      return;
    }

    if (video.type === "mp4" && video.src) {
      const videoEl = document.createElement("video");
      videoEl.src = video.src;
      videoEl.controls = true;
      videoEl.playsInline = true;
      videoEl.preload = "metadata";
      containerEl.appendChild(videoEl);

      videoEl.addEventListener("timeupdate", () => {
        const duration = videoEl.duration || 0;
        const current = videoEl.currentTime || 0;
        if (duration <= 0) return;

        if (preventSkip && current > maxTimeReached + 2) {
          videoEl.currentTime = maxTimeReached;
          return;
        }
        if (current > maxTimeReached) maxTimeReached = current;
        const ratio = Math.min(1, maxTimeReached / duration);
        callbacks.onProgress(ratio, ratio >= threshold);
      });

      videoEl.addEventListener("ended", () => {
        callbacks.onProgress(1, true);
      });
      return;
    }

    if (video.type === "gdrive" && video.src) {
      const iframe = document.createElement("iframe");
      iframe.src = `https://drive.google.com/file/d/${video.src}/preview`;
      iframe.allow = "autoplay";
      containerEl.appendChild(iframe);

      // Google Drive iframe não expõe eventos de tempo; acompanha tempo em tela
      let secondsWatched = 0;
      const targetSeconds = 20;
      activeTimer = setInterval(() => {
        secondsWatched += 1;
        const ratio = Math.min(1, secondsWatched / targetSeconds);
        callbacks.onProgress(ratio, ratio >= 1);
      }, 1000);
      return;
    }

    // Modo Demo / Preview interativo (quando ainda não foi vinculado YouTube/MP4)
    const t = window.PT_I18N[lang];
    const overlay = document.createElement("div");
    overlay.className = "demo-player-overlay";
    overlay.innerHTML = `
      <h3>▶ ${video.title[lang] || video.title.pt}</h3>
      <p>${video.summary?.[lang] || ""}</p>
      <p style="font-size:0.8rem; color:#9ca3af;">
        ${
          lang === "pt"
            ? "Modo Simulação: configure o ID do YouTube Não Listado ou link MP4 em js/data-modules.js quando publicar os vídeos."
            : "Modo Simulación: configura el ID de YouTube Oculto o enlace MP4 en js/data-modules.js al publicar los videos."
        }
      </p>
      <button type="button" class="btn btn-primary" id="btn-demo-complete">${t.markDemoWatched}</button>
    `;
    containerEl.appendChild(overlay);

    overlay.querySelector("#btn-demo-complete").addEventListener("click", () => {
      callbacks.onProgress(1, true);
    });
  }

  return {
    mount,
    cleanup,
  };
})();
