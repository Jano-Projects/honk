#!/bin/sh
# ==========================================================================
#  HONK! — monta o HONK.app (funciona em qualquer sistema) e, no macOS, o .dmg
#    saida/HONK.app                           o aplicativo
#    saida/HONK-<versão>-macos.dmg            imagem de disco "arraste para Aplicativos" (só no macOS)
#  O app não é assinado pela Apple: na primeira vez, botão direito > Abrir.
# ==========================================================================
set -e
RAIZ="$(cd "$(dirname "$0")/../.." && pwd)"
VERSAO="$(cat "$RAIZ/VERSAO")"
[ -f "$RAIZ/dist/vendor/duckdb-eh.wasm" ] || { echo "falta dist/ com o motor: baixe o motor e monte"; exit 1; }
APP="$RAIZ/saida/HONK.app"
rm -rf "$APP"; mkdir -p "$APP/Contents/MacOS" "$APP/Contents/Resources/jogo/vendor"
sed "s/@VERSAO@/$VERSAO/g" "$RAIZ/empacotar/macos/Info.plist" > "$APP/Contents/Info.plist"
install -m 755 "$RAIZ/empacotar/macos/HONK" "$APP/Contents/MacOS/HONK"
cp "$RAIZ/empacotar/icone/honk.icns" "$APP/Contents/Resources/honk.icns"
cp "$RAIZ/dist/index.html" "$APP/Contents/Resources/jogo/"
cp "$RAIZ/dist/vendor/"* "$APP/Contents/Resources/jogo/vendor/"
cp "$RAIZ/empacotar/comum/servidor.pl" "$APP/Contents/Resources/jogo/"
echo "pronto: saida/HONK.app"
if command -v hdiutil >/dev/null 2>&1; then
  PALCO="$RAIZ/build/dmg"; rm -rf "$PALCO"; mkdir -p "$PALCO"
  cp -R "$APP" "$PALCO/"; ln -s /Applications "$PALCO/Aplicativos"
  hdiutil create -volname "HONK!" -srcfolder "$PALCO" -ov -format UDZO "$RAIZ/saida/HONK-$VERSAO-macos.dmg"
  echo "pronto: saida/HONK-$VERSAO-macos.dmg"
fi
