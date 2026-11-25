# ==========================================================================
#  HONK! - preparar o modo OFFLINE (Windows)
#  Baixa o motor DuckDB (~75 MB) e as duas fontes para a pasta vendor\.
#  Depois disso o jogo roda sem internet: ele percebe a pasta sozinho.
# ==========================================================================
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'      # deixa o download bem mais rápido no PowerShell 5
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
Set-Location -LiteralPath $PSScriptRoot
New-Item -ItemType Directory -Force -Path vendor | Out-Null
$duck = 'https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm@1.32.0/dist'
$fontes = 'https://cdn.jsdelivr.net/npm/@fontsource'
$lista = @(
  @("$duck/duckdb-browser.mjs", 'duckdb-browser.mjs'),
  @("$duck/duckdb-browser-eh.worker.js", 'duckdb-browser-eh.worker.js'),
  @("$duck/duckdb-browser-mvp.worker.js", 'duckdb-browser-mvp.worker.js'),
  @("$duck/duckdb-eh.wasm", 'duckdb-eh.wasm'),
  @("$duck/duckdb-mvp.wasm", 'duckdb-mvp.wasm'),
  @("$fontes/rye@5.3.0/files/rye-latin-400-normal.woff2", 'rye.woff2'),
  @("$fontes/special-elite@5.3.0/files/special-elite-latin-400-normal.woff2", 'special-elite.woff2')
)
$falhou = $false
foreach ($item in $lista) {
  $destino = Join-Path 'vendor' $item[1]
  Write-Host "-> $($item[1])"
  try {
    Invoke-WebRequest -Uri $item[0] -OutFile "$destino.parcial" -UseBasicParsing
    Move-Item -Force "$destino.parcial" $destino
  } catch {
    Remove-Item -ErrorAction SilentlyContinue "$destino.parcial"
    Write-Host "   falhou: $($item[0])"; $falhou = $true
  }
}
if (-not $falhou) {
  Write-Host ''; Write-Host 'Pronto! O HONK! agora roda sem internet. Abra pelo JOGAR-Windows.bat.'
} else {
  Write-Host ''; Write-Host 'Alguns arquivos falharam. Confira a internet e rode de novo.'
  Write-Host 'Sem a pasta vendor completa, o jogo continua funcionando, so que online.'
  Remove-Item -ErrorAction SilentlyContinue (Join-Path 'vendor' 'duckdb-eh.wasm')
}
