#!/bin/sh
# ==========================================================================
#  HONK! — monta a árvore de arquivos instalada no Linux (usada pelo .deb e pelo .rpm)
#    /usr/bin/honk                          lançador (abre a janela do jogo, sem terminal)
#    /usr/share/honk/                       o jogo montado + motor DuckDB + fontes (offline)
#    /usr/share/applications/honk.desktop   o ícone no menu de aplicativos
#    /usr/share/icons/hicolor/*/apps/       o ícone em vários tamanhos
#  Uso: preparar-arvore.sh <pasta-destino>
# ==========================================================================
set -e
DEST="$1"; [ -n "$DEST" ] || { echo "uso: $0 <pasta-destino>"; exit 1; }
RAIZ="$(cd "$(dirname "$0")/../.." && pwd)"
[ -f "$RAIZ/dist/index.html" ] || { echo "falta dist/index.html: rode  python3 ferramentas/montar.py"; exit 1; }
[ -f "$RAIZ/dist/vendor/duckdb-eh.wasm" ] || { echo "falta o motor em dist/vendor: rode ferramentas/baixar-motor.sh e monte de novo"; exit 1; }

install -d "$DEST/usr/bin" "$DEST/usr/share/honk/vendor" "$DEST/usr/share/applications" "$DEST/usr/share/doc/honk"
install -m 755 "$RAIZ/empacotar/linux/honk" "$DEST/usr/bin/honk"
install -m 644 "$RAIZ/dist/index.html" "$DEST/usr/share/honk/index.html"
install -m 644 "$RAIZ/dist/vendor/"* "$DEST/usr/share/honk/vendor/"
install -m 644 "$RAIZ/empacotar/comum/servidor.py" "$DEST/usr/share/honk/servidor.py"
install -m 644 "$RAIZ/empacotar/linux/honk.desktop" "$DEST/usr/share/applications/honk.desktop"
for n in 16 24 32 48 64 128 256 512; do
  install -d "$DEST/usr/share/icons/hicolor/${n}x${n}/apps"
  install -m 644 "$RAIZ/empacotar/icone/png/honk-$n.png" "$DEST/usr/share/icons/hicolor/${n}x${n}/apps/honk.png"
done
install -d "$DEST/usr/share/icons/hicolor/scalable/apps"
install -m 644 "$RAIZ/empacotar/icone/honk.svg" "$DEST/usr/share/icons/hicolor/scalable/apps/honk.svg"
install -m 644 "$RAIZ/LICENSE" "$DEST/usr/share/doc/honk/copyright"
