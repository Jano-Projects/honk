#!/bin/sh
# ==========================================================================
#  HONK! — gera o pacote .rpm (Fedora...)   ->  saida/honk-<versão>-1.noarch.rpm
#  Instalar:  sudo dnf install ./saida/honk-<versão>-1.noarch.rpm   (ou dois cliques)
#  Precisa de: rpmbuild  (Fedora: sudo dnf install rpm-build | Debian/Ubuntu: sudo apt install rpm)
# ==========================================================================
set -e
RAIZ="$(cd "$(dirname "$0")/../.." && pwd)"
VERSAO="$(cat "$RAIZ/VERSAO")"
TOP="$RAIZ/build/rpm"; rm -rf "$TOP"; mkdir -p "$TOP" "$RAIZ/saida"
rpmbuild -bb --quiet --define "_topdir $TOP" --define "versao $VERSAO" --define "raiz $RAIZ" \
  --define "dist %{nil}" --define "_binary_payload w9.xzdio" "$RAIZ/empacotar/linux/honk.spec"
cp "$TOP"/RPMS/noarch/honk-*.rpm "$RAIZ/saida/"
echo "pronto: saida/$(basename "$TOP"/RPMS/noarch/honk-*.rpm)"
