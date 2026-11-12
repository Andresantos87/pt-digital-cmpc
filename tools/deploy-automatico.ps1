<#
.SYNOPSIS
  Script automatizado para publicar todo o Portal PT Digital com Custo Zero:
  1. Cria a Planilha Google + Backend Apps Script (Web App conectado ao BigQuery) via CLASP
  2. Atualiza js/config.js com a URL gerada
  3. Cria repositório público no GitHub, sobe os arquivos e ativa o GitHub Pages via GH CLI
#>

$ErrorActionPreference = "Stop"
$PortalDir = Split-Path -Parent $PSScriptRoot
$BackendDir = Join-Path $PortalDir "backend-apps-script"
$ConfigPath = Join-Path $PortalDir "js\config.js"

Write-Host "=== Deploy Automatico Portal PT Digital (CMPC) ===" -ForegroundColor Green

# 1. Garantir GitHub CLI (gh)
if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
  Write-Host "[1/6] Instalando GitHub CLI (gh)..." -ForegroundColor Cyan
  winget install --id GitHub.cli -e --accept-source-agreements --accept-package-agreements
  $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
}

# 2. Login no GitHub (abre navegador uma vez)
Write-Host "[2/6] Verificando login no GitHub..." -ForegroundColor Cyan
$ghAuth = gh auth status 2>&1
if ($LASTEXITCODE -ne 0) {
  gh auth login --web --git-protocol https
}
$ghUser = (gh api user --jq ".login").Trim()
Write-Host " -> Conectado como: $ghUser" -ForegroundColor Green

# 3. Configurar BigQuery no Code.gs (se ainda estiver com placeholder)
$codeGsPath = Join-Path $BackendDir "Code.gs"
$codeGs = Get-Content $codeGsPath -Raw -Encoding UTF8
if ($codeGs -match 'SEU-PROJETO-GCP') {
  Write-Host "`n[3/6] Configuracao do BigQuery:" -ForegroundColor Cyan
  $bqProject = Read-Host " -> ID do Projeto GCP (ex: cmpc-data-prod)"
  $bqDataset = Read-Host " -> Nome do Dataset no BigQuery"
  $bqTable   = Read-Host " -> Nome da Tabela de credenciais no BigQuery"
  $colDoc    = Read-Host " -> Nome da coluna de CPF/RUT [padrao: cpf_rut]"
  $colName   = Read-Host " -> Nome da coluna de Nome [padrao: nome_completo]"
  $colComp   = Read-Host " -> Nome da coluna de Empresa [padrao: empresa]"

  if ([string]::IsNullOrWhiteSpace($colDoc))  { $colDoc  = "cpf_rut" }
  if ([string]::IsNullOrWhiteSpace($colName)) { $colName = "nome_completo" }
  if ([string]::IsNullOrWhiteSpace($colComp)) { $colComp = "empresa" }

  if ($bqProject) { $codeGs = $codeGs.Replace('SEU-PROJETO-GCP', $bqProject) }
  if ($bqDataset) { $codeGs = $codeGs.Replace('SEU_DATASET', $bqDataset) }
  if ($bqTable)   { $codeGs = $codeGs.Replace('SUA_TABELA_CREDENCIAIS', $bqTable) }
  $codeGs = $codeGs.Replace('"cpf_rut"', "`"$colDoc`"")
  $codeGs = $codeGs.Replace('"nome_completo"', "`"$colName`"")
  $codeGs = $codeGs.Replace('"empresa"', "`"$colComp`"")
  Set-Content $codeGsPath $codeGs -Encoding UTF8
}

# 4. Instalar/usar CLASP para criar Planilha + Apps Script + Web App automaticamente
Write-Host "`n[4/6] Preparando Google Apps Script CLI (clasp)..." -ForegroundColor Cyan
if (-not (Get-Command clasp -ErrorAction SilentlyContinue)) {
  npm install -g @google/clasp
}

Write-Host " -> Se abrir o navegador, autorize sua conta Google para criar o Apps Script." -ForegroundColor Yellow
Write-Host " -> Caso apareca erro de API desativada, ative em: https://script.google.com/home/usersettings" -ForegroundColor Yellow
clasp login

Push-Location $BackendDir
try {
  if (-not (Test-Path ".clasp.json")) {
    clasp create --type sheets --title "PT_Digital_CMPC_Base" --rootDir .
  }
  clasp push -f
  $deployOut = clasp deploy -d "PT Digital WebApp" | Out-String
  Write-Host $deployOut
  if ($deployOut -match '-\s+([A-Za-z0-9_-]+)\s+@') {
    $deployId = $matches[1]
    $webAppUrl = "https://script.google.com/macros/s/$deployId/exec"
    Write-Host " -> Web App URL gerada: $webAppUrl" -ForegroundColor Green

    $cfg = Get-Content $ConfigPath -Raw -Encoding UTF8
    $cfg = [regex]::Replace($cfg, 'APPS_SCRIPT_URL:\s*"[^"]*"', "APPS_SCRIPT_URL: `"$webAppUrl`"")
    Set-Content $ConfigPath $cfg -Encoding UTF8
  }
} finally {
  Pop-Location
}

# 5. Google OAuth Client ID (opcional - pode ser preenchido depois)
$googleClientId = Read-Host "`n[5/6] Cole seu GOOGLE_CLIENT_ID (ou deixe vazio para usar entrada por e-mail / preencher depois)"
if (-not [string]::IsNullOrWhiteSpace($googleClientId)) {
  $cfg = Get-Content $ConfigPath -Raw -Encoding UTF8
  $cfg = [regex]::Replace($cfg, 'GOOGLE_CLIENT_ID:\s*"[^"]*"', "GOOGLE_CLIENT_ID: `"$googleClientId`"")
  Set-Content $ConfigPath $cfg -Encoding UTF8
}

# 6. Criar Repositorio Publico no GitHub e Ativar GitHub Pages
Write-Host "`n[6/6] Publicando no GitHub Pages..." -ForegroundColor Cyan
$repoName = Read-Host " -> Nome do repositorio no GitHub [padrao: pt-digital-cmpc]"
if ([string]::IsNullOrWhiteSpace($repoName)) { $repoName = "pt-digital-cmpc" }

Push-Location $PortalDir
try {
  if (-not (Test-Path ".git")) {
    git init -b main
  }
  git add .
  git commit -m "Deploy inicial Portal PT Digital CMPC" 2>$null

  $exists = gh repo view "$ghUser/$repoName" 2>&1
  if ($LASTEXITCODE -ne 0) {
    gh repo create $repoName --public --source=. --remote=origin --push
  } else {
    git push -u origin main
  }

  # Habilita GitHub Pages na branch main / root
  try {
    gh api -X POST "repos/$ghUser/$repoName/pages" -f "source[branch]=main" -f "source[path]=/" | Out-Null
  } catch {
    # Caso ja esteja habilitado, segue normalmente
  }

  $siteUrl = "https://$ghUser.github.io/$repoName/"
  Write-Host "`n=======================================================" -ForegroundColor Green
  Write-Host "PORTAL PUBLICADO COM SUCESSO!" -ForegroundColor Green
  Write-Host "URL do Portal: $siteUrl" -ForegroundColor White
  Write-Host "Observacao: adicione https://$ghUser.github.io nas Origens Autorizadas do Google OAuth." -ForegroundColor Yellow
  Write-Host "=======================================================" -ForegroundColor Green
} finally {
  Pop-Location
}
