/**
 * Backend 100% Gratuito via Google Apps Script
 * ============================================
 * 1. Consulta colaboradores próprios (Mi Fibra / CSOD) no BigQuery (`cmpc-all-mof-prod`)
 *    respeitando as Policy Tags de PII (sem SELECT *).
 * 2. Fallback opcional para terceiros (Rainbow BR / SAT CL) e para a Planilha Google ("Cadastros").
 * 3. Grava novos cadastros, progresso de módulos e certificados em abas da Planilha Google.
 */

const CONFIG = {
  BQ_PROJECT_ID: "cmpc-all-mof-prod",
  BQ_DATASET_MIFIBRA: "00_personas_corp_datalake_transform",
  BQ_TABLE_MIFIBRA: "vw_csod_vwrptuser",

  // Tabelas de Terceiros (Rainbow BR / SAT CL) - ajuste nomes de colunas se necessário
  BQ_DATASET_PT: "cmpc_all_data_integration_pt_digital",
  BQ_TABLE_RAINBOW_BR: "cmpc_all_pt_digital_rainbow_workers",
  BQ_TABLE_SAT_CL: "cmpc_all_pt_digital_sat_contratista",

  // ID da Planilha Google (vazio = usa a planilha vinculada ao script)
  SPREADSHEET_ID: "",
};

function doGet() {
  return jsonResponse({
    ok: true,
    service: "CMPC PT Digital Backend (Apps Script + Mi Fibra BQ)",
    project: CONFIG.BQ_PROJECT_ID,
    timestamp: new Date().toISOString(),
  });
}

function doPost(e) {
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    const action = body.action;

    if (action === "lookup") {
      return jsonResponse(handleLookup(body.plant, body.doc));
    }
    if (action === "register") {
      return jsonResponse(handleRegister(body));
    }
    if (action === "progress") {
      return jsonResponse(handleProgress(body));
    }
    if (action === "certificate") {
      return jsonResponse(handleCertificate(body));
    }
    if (action === "seedBaseBQ") {
      return jsonResponse(handleSeedBaseBQ(body));
    }
    if (action === "inspectBaseBQ") {
      const sheet = ensureSheet("BaseBQ", ["docNormalized", "name", "company", "country"]);
      const lastRow = sheet.getLastRow();
      const sample = lastRow > 1 ? sheet.getRange(2, 1, Math.min(5, lastRow - 1), 4).getValues() : [];
      return jsonResponse({
        sheetName: sheet.getName(),
        lastRow: lastRow,
        sample: sample
      });
    }

    return jsonResponse({ ok: false, error: "Ação inválida" });
  } catch (err) {
    return jsonResponse({ ok: false, error: err.message || String(err) });
  }
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}

function getSpreadsheet() {
  if (CONFIG.SPREADSHEET_ID) {
    return SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  }
  return SpreadsheetApp.getActiveSpreadsheet();
}

function ensureSheet(name, headers) {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
  }
  return sheet;
}

function normalizeDoc(doc) {
  const digits = String(doc || "").replace(/[^0-9kK]/g, "").toUpperCase();
  // Se for numérico, remove zeros à esquerda para casar com números no Sheets
  // ex: '01074575040' vira '1074575040'
  if (/^\d+$/.test(digits)) {
    return String(BigInt(digits));
  }
  return digits;
}

function handleLookup(plant, doc) {
  const cleanDoc = normalizeDoc(doc);
  if (!cleanDoc) return { found: false };

  // 1. Verifica se o usuário já possui cadastro/atualização na aba "Cadastros"
  const regSheet = ensureSheet("Cadastros", [
    "updatedAt",
    "plant",
    "docNormalized",
    "docFormatted",
    "email",
    "name",
    "company",
  ]);
  const regRows = regSheet.getDataRange().getValues();
  for (let i = regRows.length - 1; i >= 1; i--) {
    if (
      String(regRows[i][1]) === String(plant) &&
      normalizeDoc(regRows[i][2]) === cleanDoc
    ) {
      return {
        found: true,
        name: String(regRows[i][5] || ""),
        company: String(regRows[i][6] || ""),
        plant,
        source: "sheets-cadastro",
      };
    }
  }

  // 1b. Verifica na aba "BaseBQ" (cópia sincronizada do BigQuery CMPC)
  const bqSheet = ensureSheet("BaseBQ", ["docNormalized", "name", "company", "country"]);
  const lastRow = bqSheet.getLastRow();
  if (lastRow > 1) {
    const dataRange = bqSheet.getRange(2, 1, lastRow - 1, 4).getValues();
    for (let i = 0; i < dataRange.length; i++) {
      const rowDoc = normalizeDoc(dataRange[i][0]);
      if (rowDoc === cleanDoc) {
        return {
          found: true,
          name: String(dataRange[i][1] || ""),
          company: String(dataRange[i][2] || "CMPC Celulose"),
          plant,
          source: "sheets-basebq",
        };
      }
    }
  }

  // 2. Consulta Colaboradores Próprios (Mi Fibra / CSOD) no BigQuery
  //    IMPORTANTE: Não usar SELECT * por conta das Policy Tags de PII do Data Catalog.
  if (CONFIG.BQ_PROJECT_ID) {
    try {
      const countryCode = plant === "santafe" ? "CHL" : "BRA";
      const miFibraTable = `\`${CONFIG.BQ_PROJECT_ID}.${CONFIG.BQ_DATASET_MIFIBRA}.${CONFIG.BQ_TABLE_MIFIBRA}\``;
      const sqlMiFibra = `
        SELECT
          TRIM(CONCAT(COALESCE(u.user_name_first, ''), ' ', COALESCE(u.user_name_last, ''))) AS nome_completo,
          CAST(u.user_company_no AS STRING) AS empresa_cmpc,
          CAST(u.user_country AS STRING) AS pais,
          CAST(u.user_local_system_id AS STRING) AS matricula
        FROM ${miFibraTable} u
        WHERE u.user_status_id = 1
          AND u.user_country = @country
          AND UPPER(REGEXP_REPLACE(CAST(u.user_vat_number AS STRING), r'[^0-9kK]', '')) = @doc
        LIMIT 1
      `;

      const resMiFibra = runBigQuery(sqlMiFibra, [
        { name: "country", type: "STRING", value: countryCode },
        { name: "doc", type: "STRING", value: cleanDoc },
      ]);

      if (resMiFibra.length > 0) {
        const row = resMiFibra[0];
        const compCode = row[1] ? ` (${row[1]})` : "";
        return {
          found: true,
          name: row[0] || "",
          company: `CMPC Celulose${compCode}`,
          plant,
          source: "bigquery-mifibra",
        };
      }
    } catch (err) {
      Logger.log("Aviso consulta Mi Fibra BQ: " + err.message);
      return {
        found: false,
        bqWarning: err.message,
      };
    }
  }

  return { found: false };
}

function runBigQuery(sql, params) {
  const request = {
    query: sql,
    useLegacySql: false,
    parameterMode: "NAMED",
    queryParameters: params.map((p) => ({
      name: p.name,
      parameterType: { type: p.type },
      parameterValue: { value: p.value },
    })),
  };

  const queryResults = BigQuery.Jobs.query(request, CONFIG.BQ_PROJECT_ID);
  const rows = queryResults.rows || [];
  return rows.map((r) => (r.f || []).map((cell) => (cell ? cell.v : "")));
}

function handleSeedBaseBQ(body) {
  const sheet = ensureSheet("BaseBQ", ["docNormalized", "name", "company", "country"]);
  if (body.clear) {
    const last = sheet.getLastRow();
    if (last > 1) {
      sheet.getRange(2, 1, last - 1, 4).clearContent();
    }
  }
  const rows = Array.isArray(body.rows) ? body.rows : [];
  if (rows.length > 0) {
    const startRow = Math.max(2, sheet.getLastRow() + 1);
    sheet.getRange(startRow, 1, rows.length, 4).setValues(rows);
  }
  return { ok: true, inserted: rows.length };
}

function handleRegister(body) {
  const sheet = ensureSheet("Cadastros", [
    "updatedAt",
    "plant",
    "docNormalized",
    "docFormatted",
    "email",
    "name",
    "company",
  ]);
  sheet.appendRow([
    new Date().toISOString(),
    body.plant || "",
    normalizeDoc(body.docNormalized),
    body.docFormatted || "",
    body.email || "",
    body.name || "",
    body.company || "",
  ]);
  return { ok: true };
}

function handleProgress(body) {
  const sheet = ensureSheet("Progresso", [
    "updatedAt",
    "plant",
    "docNormalized",
    "email",
    "name",
    "company",
    "watchedVideos",
  ]);

  const cleanDoc = normalizeDoc(body.doc);
  const rows = sheet.getDataRange().getValues();
  const watchedList = Array.isArray(body.watchedVideos)
    ? body.watchedVideos.join(", ")
    : String(body.watchedVideos || "");

  for (let i = 1; i < rows.length; i++) {
    if (
      String(rows[i][1]) === String(body.plant) &&
      normalizeDoc(rows[i][2]) === cleanDoc
    ) {
      sheet
        .getRange(i + 1, 1, 1, 7)
        .setValues([
          [
            new Date().toISOString(),
            body.plant || "",
            cleanDoc,
            body.email || "",
            body.name || "",
            body.company || "",
            watchedList,
          ],
        ]);
      return { ok: true, updated: true };
    }
  }

  sheet.appendRow([
    new Date().toISOString(),
    body.plant || "",
    cleanDoc,
    body.email || "",
    body.name || "",
    body.company || "",
    watchedList,
  ]);
  return { ok: true, created: true };
}

function handleCertificate(body) {
  const sheet = ensureSheet("Certificados", [
    "code",
    "issuedAt",
    "plant",
    "docNormalized",
    "docFormatted",
    "name",
    "company",
    "email",
    "score",
    "total",
    "percent",
  ]);
  sheet.appendRow([
    body.code || "",
    body.issuedAt || new Date().toISOString(),
    body.plant || "",
    normalizeDoc(body.docNormalized),
    body.docFormatted || "",
    body.name || "",
    body.company || "",
    body.email || "",
    body.score || 0,
    body.total || 10,
    body.percent || 0,
  ]);
  return { ok: true };
}
