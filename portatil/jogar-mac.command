#!/bin/sh
# =====================================================================
#  HONK! - lançador para macOS
#  Não precisa instalar nada: usa o Perl, que já vem no macOS.
#  Na primeira vez: clique com o botão direito > Abrir.
#
#  Se houver Chrome, Chromium, Edge ou Brave, o jogo abre numa janela
#  própria (modo aplicativo, perfil limpo). Senão, no navegador padrão.
# =====================================================================
cd "$(dirname "$0")" || exit 1
ABRIR="open"
for app in "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
           "/Applications/Chromium.app/Contents/MacOS/Chromium" \
           "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge" \
           "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser"; do
  if [ -x "$app" ]; then
    PERFIL="$HOME/Library/Caches/honk3d-navegador"; mkdir -p "$PERFIL"
    ABRIR="'$app' --app=%URL% --user-data-dir='$PERFIL' --no-first-run --no-default-browser-check --disable-extensions --start-maximized --ignore-gpu-blocklist --disable-background-timer-throttling --disable-renderer-backgrounding --autoplay-policy=no-user-gesture-required"
    break
  fi
done
exec perl servidor.pl 8642 "$ABRIR"
