#!/usr/bin/env python3
"""
Gera todos os ícones do HONK! a partir de honk.svg:

    png/honk-<N>.png   16 a 1024 px (Linux usa vários tamanhos)
    honk.ico           Windows (instalador e atalhos)
    honk.icns          macOS (o .app)

Precisa de: rsvg-convert (pacote librsvg2-bin no Debian/Ubuntu, librsvg2-tools no Fedora,
`brew install librsvg` no Mac) e Pillow (pip install pillow).
Os arquivos gerados já estão no repositório: só rode de novo se mudar o desenho.
"""
import pathlib
import subprocess

from PIL import Image

AQUI = pathlib.Path(__file__).resolve().parent
SVG = AQUI / "honk.svg"
TAMANHOS = [16, 24, 32, 48, 64, 128, 256, 512, 1024]


def main() -> None:
    pasta = AQUI / "png"
    pasta.mkdir(exist_ok=True)
    for n in TAMANHOS:
        subprocess.run(["rsvg-convert", "-w", str(n), "-h", str(n), str(SVG), "-o", str(pasta / f"honk-{n}.png")], check=True)
    grande = Image.open(pasta / "honk-1024.png")
    grande.save(AQUI / "honk.ico", sizes=[(n, n) for n in (16, 24, 32, 48, 64, 128, 256)])
    grande.save(AQUI / "honk.icns")
    print("ícones gerados em", AQUI)


if __name__ == "__main__":
    main()
