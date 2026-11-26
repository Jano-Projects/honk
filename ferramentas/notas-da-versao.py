#!/usr/bin/env python3
"""Monta o texto da página de Releases de uma versão do HONK!.

Junta três partes:
  1. o trecho da versão no CHANGELOG.md (de "## X.Y.Z" até o próximo "## ");
  2. a tabela "Como instalar", com o nome real de cada arquivo da versão;
  3. como conferir os arquivos (SHA256SUMS.txt).

Uso:  python3 ferramentas/notas-da-versao.py 1.0.0 > notas.md
O workflow de lançamento chama este script; rodar à mão serve para conferir o texto antes da tag.
"""
import pathlib
import re
import sys

RAIZ = pathlib.Path(__file__).resolve().parent.parent
REPO = "Jano-Projects/honk"


def trecho_do_changelog(versao: str) -> str:
    texto = (RAIZ / "CHANGELOG.md").read_text(encoding="utf-8")
    m = re.search(rf"^## {re.escape(versao)}\b.*?$(.*?)(?=^## |\Z)", texto, re.M | re.S)
    if not m:
        sys.exit(f"CHANGELOG.md não tem a seção '## {versao}'. Escreva as mudanças antes de criar a tag.")
    return m.group(1).strip()


def main() -> None:
    versao = sys.argv[1] if len(sys.argv) > 1 else (RAIZ / "VERSAO").read_text().strip()
    v = versao
    base = f"https://github.com/{REPO}/releases/download/v{v}"
    print(f"""**Um ganso acordou com ódio.** Roguelite em xilogravura de cordel cujo motor é SQL (DuckDB-WASM).

## Novidades

{trecho_do_changelog(versao)}

## Como instalar

| Sistema | Arquivo | Como instalar |
|---|---|---|
| **Windows 10/11** | [HONK-{v}-instalador-windows.exe]({base}/HONK-{v}-instalador-windows.exe) | Avançar, Avançar, Concluir. Cria o ícone na Área de Trabalho. Se o SmartScreen avisar: *Mais informações › Executar assim mesmo*. |
| **Debian / Ubuntu / Mint** | [honk_{v}_all.deb]({base}/honk_{v}_all.deb) | Dois cliques, ou `sudo apt install ./honk_{v}_all.deb` |
| **Fedora** | [honk-{v}-1.noarch.rpm]({base}/honk-{v}-1.noarch.rpm) | Dois cliques, ou `sudo dnf install ./honk-{v}-1.noarch.rpm` |
| **macOS** | [HONK-{v}-macos.zip]({base}/HONK-{v}-macos.zip) | Dois cliques para descompactar e arraste o **HONK.app** para Aplicativos. Na primeira vez: botão direito › Abrir (o app não é assinado pela Apple). Se a lista de arquivos tiver o `HONK-{v}-macos.dmg`, ele faz o mesmo. |
| **Sem instalar** | [HONK-{v}-portatil.zip]({base}/HONK-{v}-portatil.zip) | Descompacte e abra o lançador do seu sistema (veja o `LEIAME.txt`). |

O ícone abre o jogo numa **janela própria** do Edge, Chrome, Brave ou Chromium, sem terminal e sem barra de endereço. O jogo roda **100% offline**: o motor vai junto no instalador.

**Comandos:** `W A S D` andam · mouse ou `← →` viram · `Espaço`/clique bica · `E` HONK · `C`/`Ctrl`/botão direito esquiva · `Q` pena · `H` abre o Almanaque com tudo.

## Conferir os arquivos

O `SHA256SUMS.txt` traz a soma de cada arquivo. No Linux ou no macOS, na pasta dos downloads: `sha256sum -c --ignore-missing SHA256SUMS.txt` (no macOS, `shasum -a 256 -c`). No Windows: `Get-FileHash .\\HONK-{v}-instalador-windows.exe` no PowerShell, e compare com o arquivo.

Todos os instaladores desta versão foram instalados, conferidos e removidos automaticamente em Debian, Ubuntu, Fedora, Windows e macOS antes da publicação ([homologação](https://github.com/{REPO}/blob/main/docs/homologacao.md)).""")


if __name__ == "__main__":
    main()
