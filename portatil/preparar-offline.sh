#!/bin/sh
# ==========================================================================
#  HONK! - preparar o modo OFFLINE (Linux e macOS)
#  Baixa o motor DuckDB (~75 MB) e as duas fontes para a pasta vendor/.
#  Depois disso o jogo roda sem internet: ele percebe a pasta sozinho.
#  Uso:  sh preparar-offline.sh      (precisa de internet só agora)
# ==========================================================================
cd "$(dirname "$0")" || exit 1
mkdir -p vendor
DUCK="https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm@1.32.0/dist"
FONTES="https://cdn.jsdelivr.net/npm/@fontsource"

if command -v curl >/dev/null 2>&1; then BAIXA() { curl -fL --retry 2 -o "$2" "$1"; }
elif command -v wget >/dev/null 2>&1; then BAIXA() { wget -O "$2" "$1"; }
else echo "Preciso do curl ou do wget para baixar."; exit 1; fi

falhou=0
pega() {   # pega URL destino
  echo "-> $(basename "$2")"
  if BAIXA "$1" "$2.parcial" && [ -s "$2.parcial" ]; then mv "$2.parcial" "$2"
  else rm -f "$2.parcial"; echo "   falhou: $1"; falhou=1; fi
}
for f in duckdb-browser.mjs duckdb-browser-eh.worker.js duckdb-browser-mvp.worker.js duckdb-eh.wasm duckdb-mvp.wasm; do
  pega "$DUCK/$f" "vendor/$f"
done
pega "$FONTES/rye@5.3.0/files/rye-latin-400-normal.woff2" "vendor/rye.woff2"
pega "$FONTES/special-elite@5.3.0/files/special-elite-latin-400-normal.woff2" "vendor/special-elite.woff2"

if [ "$falhou" = 0 ]; then
  echo; echo "Pronto! O HONK! agora roda sem internet. Abra pelo jogar-linux.sh ou jogar-mac.command."
else
  echo; echo "Alguns arquivos falharam. Confira a internet e rode de novo (o que já baixou fica)."
  echo "Sem a pasta vendor/ completa, o jogo continua funcionando, só que online."
  rm -f vendor/duckdb-eh.wasm   # sem o motor completo, o jogo não tenta o modo offline
  exit 1
fi
