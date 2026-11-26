#!/bin/sh
# ==========================================================================
#  HONK! — gera ferramentas/motor/duckdb-browser.mjs, o módulo do DuckDB-WASM
#  com tudo dentro (inclusive o apache-arrow), para rodar sem internet.
#
#  Por que existe: o duckdb-browser.mjs publicado no npm importa o pacote
#  "apache-arrow" pelo nome, e um navegador abrindo o jogo do disco não sabe
#  resolver esse nome. O esbuild junta as duas coisas num arquivo só.
#
#  Só precisa rodar de novo ao trocar a versão do DuckDB-WASM (e, junto, a
#  versão em ferramentas/baixar-motor.sh). Precisa do Node.js (npm/npx).
#  Uso: sh ferramentas/motor/gerar.sh
# ==========================================================================
set -e
VERSAO_DUCKDB="1.32.0"
AQUI="$(cd "$(dirname "$0")" && pwd)"
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
cd "$TMP"
npm init -y >/dev/null
npm install --silent "@duckdb/duckdb-wasm@$VERSAO_DUCKDB" esbuild@0.24
npx esbuild node_modules/@duckdb/duckdb-wasm/dist/duckdb-browser.mjs \
  --bundle --format=esm --platform=browser --log-level=warning \
  --outfile="$AQUI/duckdb-browser.mjs"
# não pode sobrar nenhum import por nome de pacote
if grep -Eq '(^|[;}])\s*import[^(]*from\s*"[a-z@]' "$AQUI/duckdb-browser.mjs"; then
  echo "ERRO: o módulo ainda importa pacotes por nome"; exit 1
fi
echo "pronto: ferramentas/motor/duckdb-browser.mjs (DuckDB-WASM $VERSAO_DUCKDB + apache-arrow)"
