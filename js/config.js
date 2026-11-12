/**
 * Configuração Central do Portal PT Digital (CMPC)
 * =================================================
 * Sistema 100% gratuito (GitHub Pages + Google Sign-In + Google Apps Script + BigQuery/Sheets).
 *
 * Para ativar em produção:
 * 1. Preencha GOOGLE_CLIENT_ID com seu OAuth 2.0 Client ID gratuito do Google Cloud.
 * 2. Preencha APPS_SCRIPT_URL com a URL da Web App do Google Apps Script (backend-apps-script/Code.gs).
 * 3. Opcional: defina ALLOW_DEMO_MODE = false em produção quando o backend estiver ativo.
 */
window.PT_CONFIG = {
  // OAuth 2.0 Client ID (Google Identity Services) - ex: "123456-abc.apps.googleusercontent.com"
  GOOGLE_CLIENT_ID: "",

  // URL do Web App do Google Apps Script (faz a consulta no BigQuery e grava progresso no Google Sheets)
  APPS_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbyqcnFVF5FqUy-IS8sBVJKcQZT-G1h_qiJsv70GjCbXjvu6HfHYmGzzA7uWRlhVI4_I/exec",

  // Permite testar tudo localmente/no GitHub Pages mesmo antes de configurar o OAuth e o Apps Script
  ALLOW_DEMO_MODE: true,

  // Critérios de aprovação
  PASSING_SCORE_PERCENT: 70, // 70% = mínimo 7 de 10 perguntas corretas
  VIDEO_COMPLETE_THRESHOLD: 0.9, // 90% assistido já marca o vídeo como concluído
  PREVENT_FAST_FORWARD: false, // Se true, impede o usuário de pular para frente no vídeo

  // Identificação institucional no certificado
  ORGANIZATION_NAME: "CMPC Celulose",
  PROGRAM_CODE: "PT-DIGITAL",
};
