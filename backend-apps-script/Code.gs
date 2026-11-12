/**
 * Backend 100% Gratuito via Google Apps Script
 * ============================================
 * 1. Consulta credenciais (CPF / RUT) diretamente no BigQuery.
 * 2. Salva novos cadastros, progresso de módulos e certificados em uma Planilha Google (Google Sheets).
 *
 * Pré-requisitos no editor do Apps Script (script.google.com):
 * - Criar uma Planilha Google e copiar o ID dela para SPREADSHEET_ID (ou vincular o script à planilha).
 * - Em "Serviços (+)" no menu esquerdo do Apps Script, adicionar "BigQuery API".
 * - Preencher BQ_PROJECT_ID, BQ_DATASET e BQ_TABLE com os dados da sua tabela de credenciais.
 * - Clicar em "Implantar" -> "Nova implantação" -> "App da Web":
 *     Executar como: "Eu" (quem tem acesso ao BigQuery e à Planilha)
 *     Quem pode acessar: "Qualquer pessoa"
 */

const CONFIG = {
  BQ_PROJECT_ID: "SEU-PROJETO-GCP",
  BQ_DATASET: "SEU_DATASET",
  BQ_TABLE: "SUA_TABELA_CREDENCIAIS",

  // Nomes das colunas na sua tabela do BigQuery (ajuste conforme seu schema)
  COL_DOC: "cpf_rut",       // CPF (BR) ou RUT (CL)
  COL_NAME: "nome_completo",
  COL_COMPANY: "empresa",
  COL_PLANT: "planta",      // Opcional: "guaiba" / "santafe" (se não existir, deixe "")

  // ID da Planilha Google usada como banco gratuito de cadastros/progresso/certificados
  // Se o script foi criado dentro da própria planilha (Extensões -> Apps Script), pode deixar ""
  SPREADSHEET_ID: "",
};

function doGet() {
  return jsonResponse({
    ok: true,
    service: "CMPC PT Digital Backend (Apps Script)",
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
  return String(doc || "").replace(/[^0-9kK]/g, "").toUpperCase();
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

  // 2. Consulta no BigQuery usando query parametrizada (segura)
  if (CONFIG.BQ_PROJECT_ID && CONFIG.BQ_PROJECT_ID !== "SEU-PROJETO-GCP") {
    const fullTable = `\`${CONFIG.BQ_PROJECT_ID}.${CONFIG.BQ_DATASET}.${CONFIG.BQ_TABLE}\``;
    const plantSelect = CONFIG.COL_PLANT ? `, CAST(${CONFIG.COL_PLANT} AS STRING) AS planta` : "";
    const sql = `
      SELECT
        CAST(${CONFIG.COL_NAME} AS STRING) AS nome,
        CAST(${CONFIG.COL_COMPANY} AS STRING) AS empresa
        ${plantSelect}
      FROM ${fullTable}
      WHERE UPPER(REGEXP_REPLACE(CAST(${CONFIG.COL_DOC} AS STRING), r'[^0-9kK]', '')) = @doc
      LIMIT 1
    `;

    const request = {
      query: sql,
      useLegacySql: false,
      parameterMode: "NAMED",
      queryParameters: [
        {
          name: "doc",
          parameterType: { type: "STRING" },
          parameterValue: { value: cleanDoc },
        },
      ],
    };

    const queryResults = BigQuery.Jobs.query(request, CONFIG.BQ_PROJECT_ID);
    const rows = queryResults.rows || [];
    if (rows.length > 0) {
      const f = rows[0].f;
      return {
        found: true,
        name: f[0] ? f[0].v : "",
        company: f[1] ? f[1].v : "",
        plant: f[2] ? f[2].v : plant,
        source: "bigquery",
      };
    }
  }

  return { found: false };
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
