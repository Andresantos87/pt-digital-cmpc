/**
 * Aplicação Principal do Portal PT Digital (CMPC)
 */
(function () {
  const state = {
    step: "plant", // 'plant' | 'login' | 'identity' | 'modules' | 'exam' | 'certificate'
    plant: null, // 'guaiba' | 'santafe'
    lang: "pt", // 'pt' | 'es'
    auth: null, // { email, name, provider }
    worker: {
      docRaw: "",
      docNormalized: "",
      docFormatted: "",
      name: "",
      company: "",
      bqLookupDone: false,
      bqResult: null,
      showRegForm: false,
      confirmed: false,
    },
    progress: {
      watchedVideos: {},
      exam: null,
    },
    activeModuleId: null,
    activeVideoId: null,
    examAnswers: {},
    examSubmitted: false,
    googleInitialized: false,
    modulesData: JSON.parse(JSON.stringify(window.PT_MODULES || [])),
  };

  function t(key, vars) {
    const dict = window.PT_I18N[state.lang] || window.PT_I18N.pt;
    let str = dict[key] !== undefined ? dict[key] : key;
    if (vars && typeof str === "string") {
      Object.keys(vars).forEach((k) => {
        str = str.replace(new RegExp(`\\{${k}\\}`, "g"), vars[k]);
      });
    }
    return str;
  }

  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function getPlantModules() {
    return state.modulesData
      .filter((m) => !m.plant || m.plant === "all" || m.plant === state.plant)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  function isVideoCompleted(videoId) {
    return Boolean(state.progress.watchedVideos?.[videoId]?.completed);
  }

  function getVideoPercent(videoId) {
    return Math.round(((state.progress.watchedVideos?.[videoId]?.percent) || 0) * 100);
  }

  function isModuleCompleted(mod) {
    if (!mod.videos || mod.videos.length === 0) return false;
    return mod.videos.every((v) => isVideoCompleted(v.id));
  }

  function areAllModulesCompleted() {
    const mods = getPlantModules();
    return mods.length > 0 && mods.every(isModuleCompleted);
  }

  function countCompletedModules() {
    return getPlantModules().filter(isModuleCompleted).length;
  }

  function setPlant(plant) {
    state.plant = plant;
    state.lang = plant === "santafe" ? "es" : "pt";
    document.documentElement.lang = state.lang === "es" ? "es-CL" : "pt-BR";
    state.step = "login";
    render();
  }

  function resetAll() {
    window.PTVideoPlayer.cleanup();
    state.step = "plant";
    state.plant = null;
    state.lang = "pt";
    state.auth = null;
    state.worker = {
      docRaw: "",
      docNormalized: "",
      docFormatted: "",
      name: "",
      company: "",
      bqLookupDone: false,
      bqResult: null,
      showRegForm: false,
      confirmed: false,
    };
    state.progress = { watchedVideos: {}, exam: null };
    state.activeModuleId = null;
    state.activeVideoId = null;
    state.examAnswers = {};
    state.examSubmitted = false;
    render();
  }

  function renderTopbar() {
    const brandTitle = document.getElementById("brand-title");
    const brandSub = document.getElementById("brand-subtitle");
    const metaEl = document.getElementById("topbar-meta");

    brandTitle.textContent = t("brandTitle");
    brandSub.textContent = t("brandSubtitle");

    let pills = "";
    if (state.plant) {
      const flag = state.plant === "santafe" ? "🇨🇱 Santa Fe" : "🇧🇷 Guaíba";
      pills += `<span class="pill">${flag}</span>`;
      pills += `<button type="button" class="pill pill-btn" id="btn-change-plant">${t("changePlant")}</button>`;
    }
    if (state.auth?.email) {
      pills += `<span class="pill">✉️ ${escapeHtml(state.auth.email)}</span>`;
      pills += `<button type="button" class="pill pill-btn" id="btn-logout">${t("logout")}</button>`;
    }
    metaEl.innerHTML = pills;

    const btnChangePlant = document.getElementById("btn-change-plant");
    if (btnChangePlant) {
      btnChangePlant.addEventListener("click", () => {
        window.PTVideoPlayer.cleanup();
        state.step = "plant";
        render();
      });
    }
    const btnLogout = document.getElementById("btn-logout");
    if (btnLogout) {
      btnLogout.addEventListener("click", resetAll);
    }
  }

  function renderStepper() {
    const stepperEl = document.getElementById("stepper");
    const stepKeys = ["plant", "login", "identity", "modules", "exam"];
    const labels = t("steps");

    const currentIdx =
      state.step === "certificate" ? 4 : stepKeys.indexOf(state.step);

    stepperEl.innerHTML = labels
      .map((label, idx) => {
        const isDone =
          idx < currentIdx ||
          (idx === 4 && state.progress.exam?.passed);
        const isActive = idx === currentIdx && !(idx === 4 && state.step === "certificate");
        const canClick =
          (idx === 0) ||
          (idx === 1 && state.plant) ||
          (idx === 2 && state.auth) ||
          (idx === 3 && state.worker.confirmed) ||
          (idx === 4 && state.worker.confirmed && areAllModulesCompleted());

        return `
          <div class="step-item ${isActive ? "active" : ""} ${isDone ? "done" : ""} ${canClick ? "clickable" : ""}" data-step-idx="${idx}">
            <span class="step-num">${isDone ? "✓" : idx + 1}</span>
            <span>${escapeHtml(label)}</span>
          </div>
        `;
      })
      .join("");

    stepperEl.querySelectorAll(".step-item.clickable").forEach((el) => {
      el.addEventListener("click", () => {
        const idx = Number(el.getAttribute("data-step-idx"));
        if (idx === 0) state.step = "plant";
        else if (idx === 1 && state.plant) state.step = "login";
        else if (idx === 2 && state.auth) state.step = "identity";
        else if (idx === 3 && state.worker.confirmed) state.step = "modules";
        else if (idx === 4 && state.worker.confirmed && areAllModulesCompleted()) {
          state.step = state.progress.exam?.passed ? "certificate" : "exam";
        }
        render();
      });
    });
  }

  function renderPlantStep(root) {
    root.innerHTML = `
      <div class="card card-narrow">
        <div class="card-header">
          <h2>${t("plantTitle")}</h2>
          <p>${t("plantSubtitle")}</p>
        </div>
        <div class="plant-grid">
          <div class="plant-card ${state.plant === "guaiba" ? "selected" : ""}" id="select-guaiba">
            <div class="plant-flag">🇧🇷</div>
            <div class="plant-name">${t("guaibaName")}</div>
            <div class="plant-sub">${t("guaibaSub")}</div>
            <span class="plant-lang-badge">${t("guaibaLang")}</span>
          </div>
          <div class="plant-card ${state.plant === "santafe" ? "selected" : ""}" id="select-santafe">
            <div class="plant-flag">🇨🇱</div>
            <div class="plant-name">${t("santafeName")}</div>
            <div class="plant-sub">${t("santafeSub")}</div>
            <span class="plant-lang-badge">${t("santafeLang")}</span>
          </div>
        </div>
      </div>
    `;

    document.getElementById("select-guaiba").addEventListener("click", () => setPlant("guaiba"));
    document.getElementById("select-santafe").addEventListener("click", () => setPlant("santafe"));
  }

  function renderLoginStep(root) {
    const hasGoogleClientId = Boolean((window.PT_CONFIG.GOOGLE_CLIENT_ID || "").trim());

    root.innerHTML = `
      <div class="card card-narrow">
        <div class="card-header">
          <h2>${t("loginTitle")}</h2>
          <p>${t("loginSubtitle")}</p>
        </div>

        ${
          hasGoogleClientId
            ? `<div id="google-signin-btn" style="display:flex; justify-content:center; margin-bottom:12px;"></div>`
            : `
              <div class="alert alert-info">${t("googleSetupHint")}</div>
              <button type="button" class="btn btn-google" id="btn-google-demo">
                <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
                ${t("googleBtnDemo")}
              </button>
            `
        }

        <div class="divider">${t("orEmail")}</div>

        <form id="email-login-form">
          <div class="form-group">
            <label for="login-email">${t("emailLabel")}</label>
            <input type="email" id="login-email" class="input" placeholder="${t("emailPlaceholder")}" value="${escapeHtml(state.auth?.email || "")}" required />
            <div id="email-error" class="helper-text" style="color:var(--danger);"></div>
          </div>
          <div class="btn-row">
            <button type="button" class="btn btn-secondary" id="btn-back-plant">${t("backBtn")}</button>
            <button type="submit" class="btn btn-primary" style="flex:1;">${t("emailContinue")}</button>
          </div>
        </form>
      </div>
    `;

    document.getElementById("btn-back-plant").addEventListener("click", () => {
      state.step = "plant";
      render();
    });

    if (hasGoogleClientId && window.google?.accounts?.id) {
      window.google.accounts.id.initialize({
        client_id: window.PT_CONFIG.GOOGLE_CLIENT_ID,
        callback: (response) => {
          const profile = window.PTApi.decodeGoogleJwt(response.credential);
          if (profile && profile.email) {
            state.auth = {
              email: profile.email,
              name: profile.name || "",
              provider: "google",
            };
            state.step = "identity";
            render();
          }
        },
      });
      window.google.accounts.id.renderButton(document.getElementById("google-signin-btn"), {
        theme: "outline",
        size: "large",
        width: 340,
      });
    } else {
      const demoBtn = document.getElementById("btn-google-demo");
      if (demoBtn) {
        demoBtn.addEventListener("click", () => {
          state.auth = {
            email: state.plant === "santafe" ? "usuario.santafe@gmail.com" : "usuario.guaiba@gmail.com",
            name: "",
            provider: "google-demo",
          };
          state.step = "identity";
          render();
        });
      }
    }

    document.getElementById("email-login-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const email = document.getElementById("login-email").value.trim();
      const errEl = document.getElementById("email-error");
      if (!window.PTValidators.isValidEmail(email)) {
        errEl.textContent = t("emailInvalid");
        return;
      }
      state.auth = {
        email,
        name: "",
        provider: "email",
      };
      state.step = "identity";
      render();
    });
  }

  function renderIdentityStep(root) {
    const isDemo = !(window.PT_CONFIG.APPS_SCRIPT_URL || "").trim() && window.PT_CONFIG.ALLOW_DEMO_MODE;
    const demoChips =
      state.plant === "santafe"
        ? `
          <button type="button" class="chip" data-demo-doc="12.345.678-5">12.345.678-5 (Encontrado BQ)</button>
          <button type="button" class="chip" data-demo-doc="16.987.456-5">16.987.456-5 (Novo Cadastro)</button>
        `
        : `
          <button type="button" class="chip" data-demo-doc="529.982.247-25">529.982.247-25 (Encontrado BQ)</button>
          <button type="button" class="chip" data-demo-doc="111.444.777-35">111.444.777-35 (Novo Cadastro)</button>
        `;

    const w = state.worker;
    let bqSectionHtml = "";

    if (w.bqLookupDone && w.bqResult?.found && !w.showRegForm) {
      const plantLabel = state.plant === "santafe" ? t("santafeName") : t("guaibaName");
      bqSectionHtml = `
        <div class="identity-box">
          <h3>✓ ${t("bqFoundTitle")}</h3>
          <div class="identity-detail">
            <div><strong>${t("bqFoundName")}:</strong> ${escapeHtml(w.bqResult.name)}</div>
            <div><strong>${t("bqFoundCompany")}:</strong> ${escapeHtml(w.bqResult.company || "-")}</div>
            <div><strong>${t("bqFoundPlant")}:</strong> ${escapeHtml(plantLabel)}</div>
          </div>
          <div class="btn-row">
            <button type="button" class="btn btn-primary" id="btn-confirm-identity">${t("confirmMeBtn")}</button>
            <button type="button" class="btn btn-secondary" id="btn-not-me">${t("notMeBtn")}</button>
          </div>
        </div>
      `;
    } else if (w.bqLookupDone && (!w.bqResult?.found || w.showRegForm)) {
      bqSectionHtml = `
        <div class="card" style="background:var(--surface-alt); margin-top:18px; padding:20px;">
          <h3 style="margin-bottom:6px; color:var(--cmpc-green);">${t("regTitle")}</h3>
          ${!w.bqResult?.found ? `<div class="alert alert-warning">${t("regNotFoundAlert")}</div>` : `<p class="helper-text" style="margin-bottom:12px;">${t("regSubtitle")}</p>`}
          <form id="reg-form">
            <div class="form-group">
              <label for="reg-name">${t("fullNameLabel")}</label>
              <input type="text" id="reg-name" class="input" placeholder="${t("fullNamePlaceholder")}" value="${escapeHtml(w.name || state.auth?.name || "")}" required />
            </div>
            <div class="form-group">
              <label for="reg-company">${t("companyLabel")}</label>
              <input type="text" id="reg-company" class="input" placeholder="${t("companyPlaceholder")}" value="${escapeHtml(w.company || "")}" required />
            </div>
            <div id="reg-error" class="helper-text" style="color:var(--danger); margin-bottom:10px;"></div>
            <button type="submit" class="btn btn-primary btn-block">${t("regSaveBtn")}</button>
          </form>
        </div>
      `;
    }

    root.innerHTML = `
      <div class="card card-narrow">
        <div class="card-header">
          <h2>${t("docTitle")}</h2>
          <p>${t("docSubtitle")}</p>
        </div>

        <form id="doc-lookup-form">
          <div class="form-group">
            <label for="doc-input">${t("docLabel")}</label>
            <input type="text" id="doc-input" class="input" placeholder="${t("docPlaceholder")}" value="${escapeHtml(w.docFormatted)}" autocomplete="off" required />
            <div id="doc-error" class="helper-text" style="color:var(--danger);"></div>
          </div>
          ${
            isDemo
              ? `
                <div class="helper-text">${t("demoDocsHint")}</div>
                <div class="demo-chips">${demoChips}</div>
              `
              : ""
          }
          <div class="btn-row">
            <button type="button" class="btn btn-secondary" id="btn-back-login">${t("backBtn")}</button>
            <button type="submit" class="btn btn-primary" id="btn-lookup-submit" style="flex:1;">${t("docSearchBtn")}</button>
          </div>
        </form>

        <div id="lookup-status"></div>
        ${bqSectionHtml}
      </div>
    `;

    const docInput = document.getElementById("doc-input");
    docInput.addEventListener("input", () => {
      docInput.value = window.PTValidators.formatDocument(state.plant, docInput.value);
    });

    root.querySelectorAll("[data-demo-doc]").forEach((btn) => {
      btn.addEventListener("click", () => {
        docInput.value = btn.getAttribute("data-demo-doc");
      });
    });

    document.getElementById("btn-back-login").addEventListener("click", () => {
      state.step = "login";
      render();
    });

    document.getElementById("doc-lookup-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const raw = docInput.value.trim();
      const errEl = document.getElementById("doc-error");
      if (!window.PTValidators.isValidDocument(state.plant, raw)) {
        errEl.textContent = t("docInvalid");
        return;
      }
      errEl.textContent = "";

      const normalized = window.PTValidators.normalizeDocument(state.plant, raw);
      const formatted = window.PTValidators.formatDocument(state.plant, raw);
      const statusEl = document.getElementById("lookup-status");
      statusEl.innerHTML = `<div class="alert alert-info" style="margin-top:14px;">${t("searchingBQ")}</div>`;

      const result = await window.PTApi.lookupWorkerInBQ(state.plant, normalized);
      state.worker.docRaw = raw;
      state.worker.docNormalized = normalized;
      state.worker.docFormatted = formatted;
      state.worker.bqLookupDone = true;
      state.worker.bqResult = result;
      state.worker.showRegForm = !result.found;
      if (result.found) {
        state.worker.name = result.name || "";
        state.worker.company = result.company || "";
      }
      render();
    });

    const confirmBtn = document.getElementById("btn-confirm-identity");
    if (confirmBtn) {
      confirmBtn.addEventListener("click", () => {
        enterTrainingWithWorker();
      });
    }

    const notMeBtn = document.getElementById("btn-not-me");
    if (notMeBtn) {
      notMeBtn.addEventListener("click", () => {
        state.worker.showRegForm = true;
        state.worker.name = "";
        state.worker.company = "";
        render();
      });
    }

    const regForm = document.getElementById("reg-form");
    if (regForm) {
      regForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const name = document.getElementById("reg-name").value.trim();
        const company = document.getElementById("reg-company").value.trim();
        if (!name || !company) {
          document.getElementById("reg-error").textContent = t("regRequiredError");
          return;
        }
        state.worker.name = name;
        state.worker.company = company;
        await window.PTApi.saveRegistration({
          plant: state.plant,
          docNormalized: state.worker.docNormalized,
          docFormatted: state.worker.docFormatted,
          email: state.auth.email,
          name,
          company,
        });
        enterTrainingWithWorker();
      });
    }
  }

  function enterTrainingWithWorker() {
    state.worker.confirmed = true;
    state.progress = window.PTApi.loadLocalProgress(state.plant, state.worker.docNormalized);
    const mods = getPlantModules();
    if (mods.length > 0 && mods[0].videos?.length > 0) {
      state.activeModuleId = mods[0].id;
      state.activeVideoId = mods[0].videos[0].id;
    }
    state.step = "modules";
    render();
  }

  function findVideoById(videoId) {
    for (const mod of getPlantModules()) {
      const vid = (mod.videos || []).find((v) => v.id === videoId);
      if (vid) return { module: mod, video: vid };
    }
    return null;
  }

  function getNextVideo(currentVideoId) {
    const flat = [];
    getPlantModules().forEach((mod) => {
      (mod.videos || []).forEach((v) => flat.push({ module: mod, video: v }));
    });
    const idx = flat.findIndex((item) => item.video.id === currentVideoId);
    if (idx >= 0 && idx + 1 < flat.length) {
      return flat[idx + 1];
    }
    return null;
  }

  function renderModulesStep(root) {
    const prevScrollEl = root.querySelector(".module-list-scroll");
    const savedScrollTop = prevScrollEl ? prevScrollEl.scrollTop : 0;

    const mods = getPlantModules();
    const totalMods = mods.length;
    const doneMods = countCompletedModules();
    const overallPct = totalMods > 0 ? Math.round((doneMods / totalMods) * 100) : 0;
    const allDone = areAllModulesCompleted();
    const activePair = state.activeVideoId ? findVideoById(state.activeVideoId) : null;

    root.innerHTML = `
      <div class="card">
        <div class="card-header" style="margin-bottom:12px;">
          <h2>${t("trainingTitle")}</h2>
          <p>${t("trainingSubtitle")}</p>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.9rem; font-weight:600;">
          <span>${t("overallProgress")}: ${doneMods}/${totalMods} ${t("modulesCompletedLabel")}</span>
          <span>${overallPct}%</span>
        </div>
        <div class="progress-wrap"><div class="progress-fill" style="width:${overallPct}%"></div></div>
      </div>

      <div class="training-layout">
        <aside class="module-sidebar">
          <div class="module-sidebar-inner">
            <div class="module-list-scroll">
              ${mods
                .map((mod) => {
                  const modDone = isModuleCompleted(mod);
                  return `
                    <div class="module-card ${modDone ? "completed" : ""}">
                      <div class="module-header">
                        <div class="module-title">${escapeHtml(mod.title[state.lang] || mod.title.pt)}</div>
                        <span class="check-badge ${modDone ? "done" : "pending"}">${modDone ? t("doneBadge") : t("pendingBadge")}</span>
                      </div>
                      <div class="module-desc">${escapeHtml(mod.description[state.lang] || mod.description.pt)}</div>
                      <div>
                        ${(mod.videos || [])
                          .map((vid) => {
                            const vDone = isVideoCompleted(vid.id);
                            const isActive = state.activeVideoId === vid.id;
                            return `
                              <div class="video-item ${isActive ? "active" : ""}" data-video-id="${vid.id}" data-module-id="${mod.id}">
                                <div class="video-item-left">
                                  <span class="video-status-dot ${vDone ? "done" : "pending"}">${vDone ? "✓" : "▶"}</span>
                                  <span class="video-item-title">${escapeHtml(vid.title[state.lang] || vid.title.pt)}</span>
                                </div>
                                <span style="font-size:0.75rem; color:var(--text-muted);">${escapeHtml(vid.durationLabel || "")}</span>
                              </div>
                            `;
                          })
                          .join("")}
                      </div>
                    </div>
                  `;
                })
                .join("")}
            </div>

            <div class="card exam-cta-card">
              ${
                allDone
                  ? `<button type="button" class="btn btn-primary btn-block" id="btn-go-exam">${t("goToExamBtn")}</button>`
                  : `<div class="helper-text" style="margin-bottom:10px; margin-top:0;">🔒 ${t("examLockedHint")}</div>
                     <button type="button" class="btn btn-secondary btn-block" disabled>${t("goToExamBtn")}</button>`
              }
            </div>
          </div>
        </aside>

        <div class="player-card">
          ${
            activePair
              ? `
                <div style="display:flex; justify-content:space-between; align-items:center; gap:10px; margin-bottom:10px; flex-wrap:wrap;">
                  <div>
                    <div style="font-size:0.8rem; color:var(--cmpc-green); font-weight:700;">${escapeHtml(activePair.module.title[state.lang] || activePair.module.title.pt)}</div>
                    <h3 style="font-size:1.15rem;">${escapeHtml(activePair.video.title[state.lang] || activePair.video.title.pt)}</h3>
                  </div>
                  <span class="check-badge ${isVideoCompleted(activePair.video.id) ? "done" : "pending"}" id="active-video-badge">
                    ${isVideoCompleted(activePair.video.id) ? t("videoWatched") : t("videoPending")}
                  </span>
                </div>
                <div class="player-stage" id="video-player-stage"></div>
                <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.85rem; margin-bottom:6px;">
                  <span id="watch-percent-label">${t("watchPercent")} ${getVideoPercent(activePair.video.id)}%</span>
                  ${window.PT_CONFIG.PREVENT_FAST_FORWARD ? `<span style="color:var(--warning);">${t("antiSkipNotice")}</span>` : ""}
                </div>
                <div class="progress-wrap"><div class="progress-fill" id="video-progress-fill" style="width:${getVideoPercent(activePair.video.id)}%"></div></div>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:14px; gap:10px; flex-wrap:wrap;">
                  <p style="font-size:0.88rem; color:var(--text-muted); flex:1;">${escapeHtml(activePair.video.summary?.[state.lang] || "")}</p>
                  ${
                    getNextVideo(activePair.video.id)
                      ? `<button type="button" class="btn btn-outline" id="btn-next-video">${t("nextVideoBtn")}</button>`
                      : ""
                  }
                </div>
              `
              : `<div class="alert alert-info">${t("noVideoSelect")}</div>`
          }
        </div>
      </div>
    `;

    const scrollContainer = root.querySelector(".module-list-scroll");
    if (scrollContainer && savedScrollTop > 0) {
      scrollContainer.scrollTop = savedScrollTop;
    }

    root.querySelectorAll("[data-video-id]").forEach((el) => {
      el.addEventListener("click", () => {
        state.activeModuleId = el.getAttribute("data-module-id");
        state.activeVideoId = el.getAttribute("data-video-id");
        render();
      });
    });

    const btnGoExam = document.getElementById("btn-go-exam");
    if (btnGoExam) {
      btnGoExam.addEventListener("click", () => {
        window.PTVideoPlayer.cleanup();
        state.step = "exam";
        render();
      });
    }

    const btnNextVideo = document.getElementById("btn-next-video");
    if (btnNextVideo && activePair) {
      btnNextVideo.addEventListener("click", () => {
        const next = getNextVideo(activePair.video.id);
        if (next) {
          state.activeModuleId = next.module.id;
          state.activeVideoId = next.video.id;
          render();
        }
      });
    }

    if (activePair) {
      const stageEl = document.getElementById("video-player-stage");
      window.PTVideoPlayer.mount(stageEl, activePair.video, state.lang, {
        onProgress: (ratio, completedNow) => {
          const vidId = activePair.video.id;
          const prev = state.progress.watchedVideos[vidId] || { percent: 0, completed: false };
          const nextPercent = Math.max(prev.percent || 0, ratio);
          const nextCompleted = Boolean(prev.completed || completedNow);

          const changed = nextCompleted !== prev.completed || Math.floor(nextPercent * 100) !== Math.floor((prev.percent || 0) * 100);
          if (!changed) return;

          state.progress.watchedVideos[vidId] = {
            percent: nextCompleted ? 1 : nextPercent,
            completed: nextCompleted,
          };

          const pctInt = Math.round((state.progress.watchedVideos[vidId].percent || 0) * 100);
          const fillEl = document.getElementById("video-progress-fill");
          const lblEl = document.getElementById("watch-percent-label");
          if (fillEl) fillEl.style.width = `${pctInt}%`;
          if (lblEl) lblEl.textContent = `${t("watchPercent")} ${pctInt}%`;

          if (nextCompleted && !prev.completed) {
            window.PTApi.saveProgress(state.plant, state.worker.docNormalized, state.progress, {
              email: state.auth.email,
              name: state.worker.name,
              company: state.worker.company,
            });
            // Re-render to update module & video green check badges without interrupting non-active UI
            render();
          }
        },
      });
    }
  }

  function renderExamStep(root) {
    const questions = window.PT_QUIZ || [];
    const minPct = window.PT_CONFIG.PASSING_SCORE_PERCENT || 70;
    const minCount = Math.ceil((questions.length * minPct) / 100);
    const exam = state.progress.exam;

    let resultBanner = "";
    if (state.examSubmitted && exam) {
      if (exam.passed) {
        resultBanner = `
          <div class="alert alert-success">
            <strong>✓ ${t("examPassedAlert", { score: exam.score, percent: exam.percent })}</strong>
            <div class="btn-row">
              <button type="button" class="btn btn-primary" id="btn-go-cert">${t("goToCertBtn")}</button>
            </div>
          </div>
        `;
      } else {
        resultBanner = `
          <div class="alert alert-error">
            <strong>${t("examFailedAlert", { score: exam.score, percent: exam.percent, min: minPct })}</strong>
            <div class="btn-row">
              <button type="button" class="btn btn-secondary" id="btn-retry-exam">${t("retryExamBtn")}</button>
              <button type="button" class="btn btn-outline" id="btn-back-modules">${t("backToModulesBtn")}</button>
            </div>
          </div>
        `;
      }
    }

    root.innerHTML = `
      <div class="card">
        <div class="card-header">
          <h2>${t("examTitle")}</h2>
          <p>${t("examSubtitle", { min: minPct, minCount })}</p>
        </div>

        ${resultBanner}

        <form id="exam-form">
          ${questions
            .map((q, qIdx) => {
              const opts = q.options[state.lang] || q.options.pt;
              const selectedIdx = state.examAnswers[q.id];
              return `
                <div class="question-card">
                  <div class="question-title">${qIdx + 1}. ${escapeHtml(q.question[state.lang] || q.question.pt)}</div>
                  ${opts
                    .map((optText, oIdx) => {
                      let statusCls = "";
                      if (state.examSubmitted) {
                        if (oIdx === q.correctIndex) statusCls = "correct";
                        else if (selectedIdx === oIdx && oIdx !== q.correctIndex) statusCls = "wrong";
                      }
                      return `
                        <label class="option-label ${statusCls}">
                          <input type="radio" name="q_${q.id}" value="${oIdx}" ${selectedIdx === oIdx ? "checked" : ""} ${state.examSubmitted ? "disabled" : ""} />
                          <span>${escapeHtml(optText)}</span>
                        </label>
                      `;
                    })
                    .join("")}
                </div>
              `;
            })
            .join("")}

          <div id="exam-validation-msg" class="helper-text" style="color:var(--danger); margin-bottom:10px;"></div>

          ${
            !state.examSubmitted
              ? `
                <div class="btn-row">
                  <button type="button" class="btn btn-secondary" id="btn-exam-back">${t("backToModulesBtn")}</button>
                  <button type="submit" class="btn btn-primary" style="flex:1;">${t("submitExamBtn")}</button>
                </div>
              `
              : ""
          }
        </form>
      </div>
    `;

    root.querySelectorAll("input[type='radio']").forEach((radio) => {
      radio.addEventListener("change", (e) => {
        const qId = e.target.name.replace("q_", "");
        state.examAnswers[qId] = Number(e.target.value);
      });
    });

    const btnBack = document.getElementById("btn-exam-back") || document.getElementById("btn-back-modules");
    if (btnBack) {
      btnBack.addEventListener("click", () => {
        state.step = "modules";
        render();
      });
    }

    const btnRetry = document.getElementById("btn-retry-exam");
    if (btnRetry) {
      btnRetry.addEventListener("click", () => {
        state.examAnswers = {};
        state.examSubmitted = false;
        render();
      });
    }

    const btnGoCert = document.getElementById("btn-go-cert");
    if (btnGoCert) {
      btnGoCert.addEventListener("click", () => {
        state.step = "certificate";
        render();
      });
    }

    document.getElementById("exam-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const unanswered = questions.some((q) => state.examAnswers[q.id] === undefined);
      if (unanswered) {
        document.getElementById("exam-validation-msg").textContent = t("answerAllAlert");
        return;
      }

      let score = 0;
      questions.forEach((q) => {
        if (state.examAnswers[q.id] === q.correctIndex) score += 1;
      });
      const total = questions.length;
      const percent = Math.round((score / total) * 100);
      const passed = percent >= minPct;
      const code = passed ? window.PTCertificate.generateCode(state.plant) : "";

      state.progress.exam = {
        score,
        total,
        percent,
        passed,
        date: new Date().toISOString(),
        code,
      };
      state.examSubmitted = true;

      await window.PTApi.saveProgress(state.plant, state.worker.docNormalized, state.progress, {
        email: state.auth.email,
        name: state.worker.name,
        company: state.worker.company,
      });

      if (passed) {
        await window.PTApi.saveCertificate({
          plant: state.plant,
          docNormalized: state.worker.docNormalized,
          docFormatted: state.worker.docFormatted,
          name: state.worker.name,
          company: state.worker.company,
          email: state.auth.email,
          score,
          total,
          percent,
          code,
          issuedAt: state.progress.exam.date,
        });
      }

      render();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  function renderCertificateStep(root) {
    const exam = state.progress.exam;
    if (!exam || !exam.passed) {
      state.step = "exam";
      render();
      return;
    }

    const plantLabel = state.plant === "santafe" ? t("santafeName") : t("guaibaName");
    const dateFormatted = new Date(exam.date).toLocaleDateString(state.lang === "es" ? "es-CL" : "pt-BR");

    root.innerHTML = `
      <div class="card">
        <div class="card-header">
          <h2>${t("certTitle")}</h2>
          <p>${t("certSubtitle")}</p>
        </div>

        <div class="cert-preview">
          <div style="font-size:0.82rem; font-weight:700; color:var(--cmpc-green); letter-spacing:1px;">${escapeHtml(window.PT_CONFIG.ORGANIZATION_NAME)}</div>
          <h3>${t("certHeader")}</h3>
          <div style="color:var(--text-muted); font-size:0.92rem;">${t("certProgram")}</div>
          <div class="cert-worker-name">${escapeHtml(state.worker.name)}</div>
          <p style="max-width:640px; margin:0 auto; font-size:0.92rem; color:var(--text-muted);">${t("certBody")}</p>

          <div class="cert-meta-grid">
            <div><strong>${t("certFieldDoc")}:</strong><br/>${escapeHtml(state.worker.docFormatted)}</div>
            <div><strong>${t("certFieldCompany")}:</strong><br/>${escapeHtml(state.worker.company)}</div>
            <div><strong>${t("certFieldPlant")}:</strong><br/>${escapeHtml(plantLabel)}</div>
            <div><strong>${t("certFieldEmail")}:</strong><br/>${escapeHtml(state.auth.email)}</div>
            <div><strong>${t("certFieldScore")}:</strong><br/>${exam.score}/${exam.total} (${exam.percent}%)</div>
            <div><strong>${t("certFieldDate")}:</strong><br/>${dateFormatted}</div>
            <div><strong>${t("certFieldCode")}:</strong><br/><code>${escapeHtml(exam.code)}</code></div>
          </div>
        </div>

        <div class="btn-row" style="justify-content:center;">
          <button type="button" class="btn btn-primary" id="btn-download-pdf">📄 ${t("downloadPdfBtn")}</button>
          <button type="button" class="btn btn-secondary" id="btn-cert-back">${t("restartBtn")}</button>
        </div>
      </div>
    `;

    document.getElementById("btn-download-pdf").addEventListener("click", () => {
      window.PTCertificate.downloadPDF({
        plant: state.plant,
        name: state.worker.name,
        docFormatted: state.worker.docFormatted,
        company: state.worker.company,
        email: state.auth.email,
        score: exam.score,
        total: exam.total,
        percent: exam.percent,
        dateFormatted,
        code: exam.code,
        modules: getPlantModules(),
      });
    });

    document.getElementById("btn-cert-back").addEventListener("click", () => {
      state.step = "modules";
      render();
    });
  }

  function openAdminModal() {
    const modal = document.getElementById("admin-modal");
    const body = document.getElementById("admin-modal-body");
    modal.classList.remove("hidden");

    const renderAdminBody = () => {
      body.innerHTML = `
        <h2 style="color:var(--cmpc-green); margin-bottom:4px;">${t("adminTitle")}</h2>
        <p class="helper-text" style="margin-bottom:14px;">${t("adminSubtitle")}</p>
        <div style="display:flex; flex-direction:column; gap:12px; margin-bottom:14px;">
          ${state.modulesData
            .map(
              (m, mIdx) => `
              <div style="border:1px solid var(--border); border-radius:8px; padding:12px; background:var(--surface-alt);">
                <div style="display:flex; gap:8px; margin-bottom:8px;">
                  <input type="text" class="input" data-mod-title-pt="${mIdx}" value="${escapeHtml(m.title.pt)}" placeholder="Título PT" />
                  <input type="text" class="input" data-mod-title-es="${mIdx}" value="${escapeHtml(m.title.es)}" placeholder="Título ES" />
                </div>
                <div style="display:flex; flex-direction:column; gap:6px;">
                  ${(m.videos || [])
                    .map(
                      (v, vIdx) => `
                      <div style="display:grid; grid-template-columns:1fr 110px 1fr; gap:6px;">
                        <input type="text" class="input" data-vid-title="${mIdx}:${vIdx}" value="${escapeHtml(v.title[state.lang] || v.title.pt)}" placeholder="Título do Vídeo" />
                        <select class="input" data-vid-type="${mIdx}:${vIdx}">
                          <option value="youtube" ${v.type === "youtube" ? "selected" : ""}>YouTube ID</option>
                          <option value="mp4" ${v.type === "mp4" ? "selected" : ""}>MP4 URL</option>
                          <option value="gdrive" ${v.type === "gdrive" ? "selected" : ""}>Drive ID</option>
                          <option value="demo" ${v.type === "demo" ? "selected" : ""}>Demo</option>
                        </select>
                        <input type="text" class="input" data-vid-src="${mIdx}:${vIdx}" value="${escapeHtml(v.src || "")}" placeholder="ID ou URL do vídeo" />
                      </div>
                    `
                    )
                    .join("")}
                </div>
              </div>
            `
            )
            .join("")}
        </div>
        <div class="btn-row">
          <button type="button" class="btn btn-outline" id="btn-admin-add">${t("adminAddModule")}</button>
          <button type="button" class="btn btn-primary" id="btn-admin-copy">${t("adminCopyConfig")}</button>
          <button type="button" class="btn btn-secondary" id="btn-admin-apply">${t("adminApplyLive")}</button>
          <button type="button" class="btn btn-secondary" id="btn-admin-close">${t("adminClose")}</button>
        </div>
        <div id="admin-copy-msg" class="helper-text" style="color:var(--success); margin-top:8px;"></div>
      `;

      const syncFromInputs = () => {
        body.querySelectorAll("[data-mod-title-pt]").forEach((el) => {
          const i = Number(el.getAttribute("data-mod-title-pt"));
          state.modulesData[i].title.pt = el.value;
        });
        body.querySelectorAll("[data-mod-title-es]").forEach((el) => {
          const i = Number(el.getAttribute("data-mod-title-es"));
          state.modulesData[i].title.es = el.value;
        });
        body.querySelectorAll("[data-vid-title]").forEach((el) => {
          const [mi, vi] = el.getAttribute("data-vid-title").split(":").map(Number);
          state.modulesData[mi].videos[vi].title[state.lang] = el.value;
        });
        body.querySelectorAll("[data-vid-type]").forEach((el) => {
          const [mi, vi] = el.getAttribute("data-vid-type").split(":").map(Number);
          state.modulesData[mi].videos[vi].type = el.value;
        });
        body.querySelectorAll("[data-vid-src]").forEach((el) => {
          const [mi, vi] = el.getAttribute("data-vid-src").split(":").map(Number);
          state.modulesData[mi].videos[vi].src = el.value.trim();
        });
      };

      document.getElementById("btn-admin-add").addEventListener("click", () => {
        syncFromInputs();
        const nextNum = state.modulesData.length + 1;
        state.modulesData.push({
          id: `mod-${nextNum}`,
          order: nextNum,
          plant: "all",
          title: { pt: `Módulo ${nextNum}: Novo Módulo`, es: `Módulo ${nextNum}: Nuevo Módulo` },
          description: { pt: "Descrição do módulo", es: "Descripción del módulo" },
          videos: [
            {
              id: `vid-${nextNum}-1`,
              title: { pt: `Vídeo ${nextNum}.1`, es: `Video ${nextNum}.1` },
              durationLabel: "03:00",
              type: "youtube",
              src: "",
              summary: { pt: "", es: "" },
            },
          ],
        });
        renderAdminBody();
      });

      document.getElementById("btn-admin-copy").addEventListener("click", async () => {
        syncFromInputs();
        const code = `window.PT_MODULES = ${JSON.stringify(state.modulesData, null, 2)};\n`;
        try {
          await navigator.clipboard.writeText(code);
          document.getElementById("admin-copy-msg").textContent = t("copiedSuccess");
        } catch (_) {
          prompt("Copie o código abaixo:", code);
        }
      });

      document.getElementById("btn-admin-apply").addEventListener("click", () => {
        syncFromInputs();
        modal.classList.add("hidden");
        render();
      });

      document.getElementById("btn-admin-close").addEventListener("click", () => {
        modal.classList.add("hidden");
      });
    };

    renderAdminBody();
  }

  function render() {
    renderTopbar();
    renderStepper();

    const root = document.getElementById("app-content");
    if (state.step === "plant") renderPlantStep(root);
    else if (state.step === "login") renderLoginStep(root);
    else if (state.step === "identity") renderIdentityStep(root);
    else if (state.step === "modules") renderModulesStep(root);
    else if (state.step === "exam") renderExamStep(root);
    else if (state.step === "certificate") renderCertificateStep(root);

    document.getElementById("btn-open-admin").textContent = t("adminModulesBtn");
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("btn-open-admin").addEventListener("click", openAdminModal);
    document.getElementById("admin-modal").addEventListener("click", (e) => {
      if (e.target.id === "admin-modal") {
        e.target.classList.add("hidden");
      }
    });
    render();
  });
})();
