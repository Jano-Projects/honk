#!/bin/sh
# =====================================================================
#  HONK! - lançador para Linux (Debian, Ubuntu, Fedora...)
#  Não precisa instalar nada: usa o Perl, que já vem no sistema.
#
#  Para rodar:  sh jogar-linux.sh
#
#  Desempenho: se houver um navegador baseado em Chromium (Chromium,
#  Chrome, Brave, Edge, Vivaldi), o jogo abre numa JANELA PRÓPRIA, em modo
#  aplicativo, com um perfil limpo (sem extensões) e opções que aceleram o
#  desenho. Sem nenhum deles, abre no navegador padrão.
# =====================================================================
cd "$(dirname "$0")" || exit 1

NAV=""
for b in chromium chromium-browser google-chrome google-chrome-stable brave-browser brave microsoft-edge microsoft-edge-stable vivaldi; do
  if command -v "$b" >/dev/null 2>&1; then NAV="$(command -v "$b")"; break; fi
done

if [ -n "$NAV" ]; then
  # perfil separado só para o jogo (o Chromium do snap só enxerga pastas dentro de ~/snap)
  case "$NAV" in
    /snap/*) PERFIL="$HOME/snap/$(basename "$NAV")/common/honk3d-navegador" ;;
    *)       PERFIL="${XDG_CACHE_HOME:-$HOME/.cache}/honk3d-navegador" ;;
  esac
  mkdir -p "$PERFIL"
  OPCOES="--app=%URL% --user-data-dir='$PERFIL' --no-first-run --no-default-browser-check --disable-extensions"
  OPCOES="$OPCOES --start-maximized --ignore-gpu-blocklist --enable-gpu-rasterization --enable-zero-copy"
  OPCOES="$OPCOES --disable-background-timer-throttling --disable-renderer-backgrounding --disable-backgrounding-occluded-windows"
  OPCOES="$OPCOES --autoplay-policy=no-user-gesture-required"
  ABRIR="'$NAV' $OPCOES"
  echo "Abrindo o jogo numa janela própria do $(basename "$NAV")."
else
  ABRIR=""
  for cmd in xdg-open sensible-browser x-www-browser firefox; do
    if command -v "$cmd" >/dev/null 2>&1; then ABRIR="$cmd"; break; fi
  done
  echo "Dica de desempenho: instale um navegador leve baseado em Chromium e rode de novo:"
  echo "   Debian:  sudo apt install chromium"
  echo "   Ubuntu:  sudo apt install chromium-browser"
  echo "   Fedora:  sudo dnf install chromium"
fi

if command -v perl >/dev/null 2>&1; then
  exec perl servidor.pl 8642 "$ABRIR"
elif command -v python3 >/dev/null 2>&1; then
  echo "Abrindo em http://localhost:8642/  (Ctrl+C para sair)"
  URL="http://localhost:8642/"
  if [ -n "$ABRIR" ]; then
    case "$ABRIR" in *%URL%*) CMD=$(printf '%s' "$ABRIR" | sed "s#%URL%#$URL#g") ;; *) CMD="$ABRIR '$URL'" ;; esac
    (sleep 1; sh -c "$CMD" >/dev/null 2>&1) &
  fi
  exec python3 -m http.server 8642 --bind 127.0.0.1
else
  echo "Sem Perl nem Python: abrindo o arquivo direto no navegador."
  [ -n "$ABRIR" ] && sh -c "$(printf '%s' "$ABRIR" | sed "s#%URL%#index.html#g") 'index.html'"
fi
