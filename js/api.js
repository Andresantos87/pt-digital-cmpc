/**
 * Camada de Integração (BigQuery via Google Apps Script + Cache Local)
 * =====================================================================
 * Funciona com 0 custo usando Google Apps Script como ponte segura para
 * BigQuery (consulta de CPF/RUT) e Google Sheets (gravação de cadastros,
 * progresso de módulos e certificados emitidos).
 */
window.PTApi = (function () {
  const DEMO_BQ_RECORDS = {
    guaiba: {
      "52998224725": {
        found: true,
        name: "Carlos Eduardo Menezes",
        company: "CMPC Celulose Riograndense",
        plant: "guaiba",
        source: "bigquery-demo",
      },
    },
    santafe: {
      "123456785": {
        found: true,
        name: "Rodrigo Alejandro Muñoz Silva",
        company: "Servicios Industriales Biobío SpA",
        plant: "santafe",
        source: "bigquery-demo",
      },
    },
  };

  function getProgressKey(plant, docNormalized) {
    return `pt_digital_progress_${plant}_${docNormalized}`;
  }

  function getRegKey(plant, docNormalized) {
    return `pt_digital_reg_${plant}_${docNormalized}`;
  }

  function decodeGoogleJwt(credential) {
    try {
      const payload = credential.split(".")[1];
      const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
      const jsonStr = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
      return JSON.parse(jsonStr);
    } catch (e) {
      return null;
    }
  }

  async function callAppsScript(params) {
    const url = (window.PT_CONFIG.APPS_SCRIPT_URL || "").trim();
    if (!url) return null;

    // Usamos POST com text/plain para evitar preflight CORS no Google Apps Script
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      throw new Error(`Erro HTTP ${res.status}`);
    }
    return await res.json();
  }

  async function lookupWorkerInBQ(plant, docNormalized) {
    // 1. Tenta buscar na API real do Apps Script -> BigQuery
    const url = (window.PT_CONFIG.APPS_SCRIPT_URL || "").trim();
    if (url) {
      try {
        const data = await callAppsScript({
          action: "lookup",
          plant,
          doc: docNormalized,
        });
        if (data && typeof data.found === "boolean") {
          return data;
        }
      } catch (err) {
        console.warn("Falha ao consultar Apps Script, verificando fallback local:", err);
      }
    }

    // 2. Verifica se já existe cadastro local salvo anteriormente
    const savedReg = localStorage.getItem(getRegKey(plant, docNormalized));
    if (savedReg) {
      try {
        const parsed = JSON.parse(savedReg);
        return {
          found: true,
          name: parsed.name,
          company: parsed.company,
          plant,
          source: "local-cache",
        };
      } catch (_) {}
    }

    // 3. Fallback Demonstração
    if (window.PT_CONFIG.ALLOW_DEMO_MODE) {
      const plantRecords = DEMO_BQ_RECORDS[plant] || {};
      if (plantRecords[docNormalized]) {
        return plantRecords[docNormalized];
      }
    }

    return { found: false };
  }

  async function saveRegistration(payload) {
    // Salva localmente sempre
    localStorage.setItem(
      getRegKey(payload.plant, payload.docNormalized),
      JSON.stringify({
        name: payload.name,
        company: payload.company,
        email: payload.email,
        updatedAt: new Date().toISOString(),
      })
    );

    if ((window.PT_CONFIG.APPS_SCRIPT_URL || "").trim()) {
      try {
        await callAppsScript({ action: "register", ...payload });
      } catch (err) {
        console.warn("Erro ao sincronizar cadastro com Apps Script:", err);
      }
    }
    return { ok: true };
  }

  function loadLocalProgress(plant, docNormalized) {
    const raw = localStorage.getItem(getProgressKey(plant, docNormalized));
    if (!raw) {
      return {
        watchedVideos: {}, // { [videoId]: { percent: number, completed: boolean } }
        exam: null, // { score: number, total: number, percent: number, passed: boolean, date: string, code: string }
      };
    }
    try {
      return JSON.parse(raw);
    } catch (_) {
      return { watchedVideos: {}, exam: null };
    }
  }

  async function saveProgress(plant, docNormalized, progressData, meta) {
    localStorage.setItem(getProgressKey(plant, docNormalized), JSON.stringify(progressData));

    if ((window.PT_CONFIG.APPS_SCRIPT_URL || "").trim()) {
      try {
        await callAppsScript({
          action: "progress",
          plant,
          doc: docNormalized,
          email: meta?.email || "",
          name: meta?.name || "",
          company: meta?.company || "",
          watchedVideos: Object.keys(progressData.watchedVideos || {}).filter(
            (k) => progressData.watchedVideos[k]?.completed
          ),
        });
      } catch (err) {
        console.warn("Erro ao sincronizar progresso com Apps Script:", err);
      }
    }
  }

  async function saveCertificate(payload) {
    if ((window.PT_CONFIG.APPS_SCRIPT_URL || "").trim()) {
      try {
        await callAppsScript({ action: "certificate", ...payload });
      } catch (err) {
        console.warn("Erro ao registrar certificado no Apps Script:", err);
      }
    }
    return { ok: true };
  }

  return {
    decodeGoogleJwt,
    lookupWorkerInBQ,
    saveRegistration,
    loadLocalProgress,
    saveProgress,
    saveCertificate,
  };
})();
