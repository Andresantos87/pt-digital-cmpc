# Portal PT Digital (CMPC — Guaíba & Santa Fe)

Sistema web 100% gratuito (**custo zero**) para treinamento, avaliação e emissão de certificado em PDF da **Permissão de Trabalho Digital (PT Digital)**.

## Arquitetura Custo Zero

| Camada | Tecnologia Gratuita | Custo |
|---|---|---|
| **Hospedagem do Portal** | GitHub Pages (repositório público gratuito) | R\$ 0 |
| **Login** | Google Identity Services (Sign-In com Google) + fallback por e-mail | R\$ 0 |
| **Consulta BigQuery + Banco de Cadastros/Progresso** | Google Apps Script (Web App) + Google Sheets | R\$ 0 |
| **Repositório de Vídeos** | YouTube (vídeos **Não Listados**), Google Drive ou MP4 externo | R\$ 0 |
| **Geração do Certificado PDF** | `jsPDF` rodando direto no navegador do usuário | R\$ 0 |

---

## Fluxo do Usuário

1. **Planta & Idioma automático**:
   - **Guaíba** -> Português (`pt-BR`), validação de **CPF**.
   - **Santa Fe** -> Espanhol Chileno (`es-CL`), validação de **RUT** (Módulo 11).
2. **Login**: Botão **Entrar com Google** (Gmail, conta corporativa Google ou terceiros) ou entrada direta por e-mail.
3. **Identificação (CPF / RUT) + BigQuery**:
   - Busca o documento no **BigQuery** (via Apps Script).
   - Se encontrar, mostra o nome e empresa para o usuário confirmar (*"Sim, sou eu"*).
   - Se não encontrar (ou clicar em *"Não sou eu"*), abre um cadastro rápido de **Nome Completo** e **Empresa Prestadora de Serviço**.
4. **Módulos & Vídeos**:
   - Cada módulo pode conter 1 ou vários vídeos.
   - Ao assistir cada vídeo (≥ 90% ou até o fim), o vídeo e o módulo recebem **Check ✓**.
5. **Prova Final (10 Perguntas)**:
   - Liberada somente após todos os módulos estarem com **Check ✓**.
   - Mínimo padrão de acerto: **70% (7/10)**.
6. **Certificado PDF**:
   - Gerado e baixado na hora em A4 paisagem com nome, CPF/RUT, empresa, unidade, nota e código único de validação.

---

## Como Publicar em Produção (Passo a Passo Gratuito)

### 1. Publicar no GitHub Pages (Gratuito)
1. Crie um repositório gratuito no GitHub (ex.: `pt-digital-treinamento`).
2. Envie o conteúdo da pasta `portal-pt-digital/` para a raiz do repositório (onde `index.html` fique na raiz).
3. No GitHub, acesse **Settings → Pages → Build and deployment**:
   - **Source**: `Deploy from a branch`
   - **Branch**: `main` / `/ (root)`
4. Em ~1 minuto seu site estará no ar em `https://SEU-USUARIO.github.io/pt-digital-treinamento/`.

### 2. Ativar o Login com Google (Gratuito)
1. Acesse [Google Cloud Console → APIs e Serviços → Credenciais](https://console.cloud.google.com/apis/credentials).
2. Clique em **Criar Credenciais → ID do cliente OAuth → Aplicativo da Web**.
3. Em **Origens JavaScript autorizadas**, adicione:
   - `https://SEU-USUARIO.github.io`
   - `http://localhost:8080` (se quiser testar localmente)
4. Copie o **Client ID** gerado e cole em `js/config.js` na variável `GOOGLE_CLIENT_ID`.

### 3. Conectar ao BigQuery + Planilha Google (via Apps Script — Gratuito)
1. Crie uma **Planilha Google** no seu Google Drive (ex.: `Base_Treinamento_PT_Digital`).
2. Na planilha, clique em **Extensões → Apps Script**.
3. Cole todo o código de `backend-apps-script/Code.gs`.
4. No menu esquerdo do Apps Script, clique em **Serviços (+)** e adicione **BigQuery API**.
5. No topo do `Code.gs`, ajuste `BQ_PROJECT_ID`, `BQ_DATASET`, `BQ_TABLE` e os nomes das colunas da sua tabela de credenciais (veja também `tools/bigquery_setup.sql`).
6. Clique em **Implantar → Nova implantação → App da Web**:
   - **Executar como**: `Eu`
   - **Quem pode acessar**: `Qualquer pessoa`
7. Copie a **URL do App da Web** (`/exec`) e cole em `js/config.js` na variável `APPS_SCRIPT_URL`.

### 4. Subir os Vídeos e Configurar os Módulos
1. Suba os vídeos de treinamento no **YouTube** como **Não Listado** (Unlisted) — banda ilimitada, sem custo e carrega bem mesmo no 4G da planta.
2. Abra o próprio portal e clique em **"Gerenciar Módulos"** no rodapé (ou edite diretamente `js/data-modules.js`), cole o ID de cada vídeo do YouTube e copie a configuração gerada para `js/data-modules.js`.
3. Para ajustar as 10 perguntas da prova, edite `js/data-quiz.js`.

---

## Testar Localmente Agora

Você pode abrir `portal-pt-digital/index.html` diretamente no navegador (ou rodar `python -m http.server 8080` dentro de `portal-pt-digital/`).
Enquanto `GOOGLE_CLIENT_ID` e `APPS_SCRIPT_URL` estiverem vazios, o **Modo Demo** fica ativo automaticamente com CPFs e RUTs de teste para validar todo o fluxo ponta a ponta.
