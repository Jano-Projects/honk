#!/bin/sh
# ==========================================================================
#  HONK! — gera o pacote .deb (Debian, Ubuntu, Mint...)   ->  saida/honk_<versão>_all.deb
#  Instalar:  sudo apt install ./saida/honk_<versão>_all.deb   (ou dois cliques no arquivo)
#  Precisa de: dpkg-deb (já vem no Debian/Ubuntu)
# ==========================================================================
set -e
RAIZ="$(cd "$(dirname "$0")/../.." && pwd)"
VERSAO="$(cat "$RAIZ/VERSAO")"
# quem mantém o pacote (o Debian exige nome <e-mail>): defina HONK_MANTENEDOR ou troque aqui
MANTENEDOR="${HONK_MANTENEDOR:-Victor H. Correa <voce@example.com>}"
TMP="$RAIZ/build/deb/honk_${VERSAO}_all"
rm -rf "$TMP"; mkdir -p "$TMP/DEBIAN" "$RAIZ/saida"
sh "$RAIZ/empacotar/linux/preparar-arvore.sh" "$TMP"

TAMANHO=$(du -sk "$TMP/usr" | cut -f1)
cat > "$TMP/DEBIAN/control" <<CTRL
Package: honk
Version: $VERSAO
Architecture: all
Section: games
Priority: optional
Installed-Size: $TAMANHO
Depends: python3
Recommends: chromium | google-chrome-stable | brave-browser | microsoft-edge-stable
Maintainer: $MANTENEDOR
Homepage: https://github.com/Jano-Projects/honk
Description: HONK! - um ganso acordou com odio
 Roguelite em xilogravura de cordel cujo motor e um banco de dados:
 todas as regras do jogo sao SQL rodando no DuckDB, dentro do navegador.
 Ciclos sem fim por cinco lugares, cartas de poder, combos e chefes.
CTRL
# atualiza o menu e os ícones depois de instalar/remover (se as ferramentas existirem)
for s in postinst postrm; do
  printf '#!/bin/sh\nset -e\ncommand -v update-desktop-database >/dev/null 2>&1 && update-desktop-database -q /usr/share/applications || true\ncommand -v gtk-update-icon-cache >/dev/null 2>&1 && gtk-update-icon-cache -q -t /usr/share/icons/hicolor || true\n' > "$TMP/DEBIAN/$s"
  chmod 755 "$TMP/DEBIAN/$s"
done
dpkg-deb --root-owner-group -Zxz --build "$TMP" "$RAIZ/saida/honk_${VERSAO}_all.deb"
echo "pronto: saida/honk_${VERSAO}_all.deb"
