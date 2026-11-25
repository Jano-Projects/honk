# =====================================================================
#  Servidor HTTP mínimo para o HONK! no Windows
#  Usa o PowerShell e o .NET que JÁ VÊM no Windows 10/11.
#  É chamado pelo JOGAR-Windows.bat; não precisa abrir este arquivo.
#  Só atende o próprio computador (localhost).
# =====================================================================
$ErrorActionPreference = 'Stop'
$raiz  = Split-Path -Parent $MyInvocation.MyCommand.Path
$tipos = @{
  '.html' = 'text/html; charset=utf-8'; '.js' = 'text/javascript'; '.mjs' = 'text/javascript'
  '.wasm' = 'application/wasm'; '.woff2' = 'font/woff2'; '.png' = 'image/png'; '.css' = 'text/css'; '.md' = 'text/plain; charset=utf-8'
}

# tenta a porta 8642 e as seguintes, caso alguma esteja ocupada
$porta = 8642
while ($true) {
  $ouvinte = New-Object System.Net.HttpListener
  $ouvinte.Prefixes.Add("http://localhost:$porta/")
  try { $ouvinte.Start(); break } catch { $porta++; if ($porta -gt 8662) { throw "Nenhuma porta livre." } }
}

$url = "http://localhost:$porta/"
Write-Host ""
Write-Host "  HONK! rodando em $url"
Write-Host "  (deixe esta janela aberta enquanto joga; feche-a para sair)"
Write-Host ""
# Desempenho: abre numa JANELA PRÓPRIA do Edge (já vem no Windows) ou do Chrome/Brave,
# em modo aplicativo, com perfil limpo (sem extensões) e opções que aceleram o desenho.
$navegadores = @(
  "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe",
  "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe",
  "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
  "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
  "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe",
  "$env:ProgramFiles\BraveSoftware\Brave-Browser\Application\brave.exe"
)
$nav = $navegadores | Where-Object { $_ -and (Test-Path -LiteralPath $_) } | Select-Object -First 1
if ($nav) {
  $perfil = Join-Path $env:LOCALAPPDATA 'honk3d-navegador'
  New-Item -ItemType Directory -Force -Path $perfil | Out-Null
  $opcoes = @("--app=$url", "--user-data-dir=`"$perfil`"", '--no-first-run', '--no-default-browser-check', '--disable-extensions',
              '--start-maximized', '--ignore-gpu-blocklist', '--enable-gpu-rasterization', '--enable-zero-copy',
              '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows',
              '--autoplay-policy=no-user-gesture-required')
  Write-Host "  Abrindo numa janela própria: $(Split-Path -Leaf $nav)"
  Start-Process -FilePath $nav -ArgumentList $opcoes
} else {
  Start-Process $url
}

while ($ouvinte.IsListening) {
  $ctx = $ouvinte.GetContext()
  $resp = $ctx.Response
  try {
    $caminho = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath)
    if ($caminho -eq '/') { $caminho = '/index.html' }
    $arq = Join-Path $raiz ($caminho.TrimStart('/'))
    if ($caminho -notmatch '\.\.' -and (Test-Path -LiteralPath $arq -PathType Leaf)) {
      $bytes = [IO.File]::ReadAllBytes($arq)
      $ext = [IO.Path]::GetExtension($arq).ToLower()
      if ($tipos.ContainsKey($ext)) { $resp.ContentType = $tipos[$ext] } else { $resp.ContentType = 'application/octet-stream' }
      $resp.ContentLength64 = $bytes.Length
      $resp.OutputStream.Write($bytes, 0, $bytes.Length)
    } else {
      $resp.StatusCode = 404
    }
  } catch {
    $resp.StatusCode = 500
  } finally {
    $resp.Close()
  }
}
