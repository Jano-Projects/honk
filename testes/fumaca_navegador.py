#!/usr/bin/env python3
"""Teste de fumaça no navegador: abre o jogo montado (dist/) DIRETO DO DISCO, como os
instaladores fazem, e confere que o motor DuckDB-WASM carrega e uma partida começa.

Pega o que os testes das regras (Python) não veem: módulo do motor quebrado, import
que só funciona com internet ou servidor, erro de JavaScript na abertura.

Precisa do Playwright para Python (pip install playwright) e de um Chrome ou Chromium
instalado. Não baixa navegador: usa o do sistema (HONK_NAVEGADOR=/caminho para escolher).

Uso:  python3 ferramentas/montar.py && python3 testes/fumaca_navegador.py
      HONK_PAGINA=/usr/share/honk/index.html python3 testes/fumaca_navegador.py   (jogo instalado)
"""
import asyncio
import os
import pathlib
import shutil
import sys

from playwright.async_api import async_playwright

RAIZ = pathlib.Path(__file__).resolve().parent.parent
PAGINA = pathlib.Path(os.environ.get("HONK_PAGINA", RAIZ / "dist" / "index.html")).resolve().as_uri()


def navegador() -> str:
    for c in [os.environ.get("HONK_NAVEGADOR"), "google-chrome", "google-chrome-stable",
              "chromium", "chromium-browser", "microsoft-edge"]:
        if c and (shutil.which(c) or os.path.exists(c)):
            return shutil.which(c) or c
    sys.exit("Nenhum Chrome/Chromium encontrado (defina HONK_NAVEGADOR).")


async def main() -> int:
    erros = []
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=navegador(),
                                    args=["--no-sandbox", "--allow-file-access-from-files"])
        pg = await b.new_page(viewport={"width": 960, "height": 600})
        pg.on("pageerror", lambda e: erros.append(f"erro de página: {e}"))
        pg.on("console", lambda m: m.type == "error" and erros.append(f"console: {m.text}"))
        await pg.goto(PAGINA)
        try:
            # o motor pronto expõe a conexão e o estado do jogador
            await pg.wait_for_function("window.__honkP !== undefined", timeout=120000)
        except Exception:
            msg = await pg.evaluate("document.body.innerText.slice(0, 400)")
            print("FALHOU: o motor não carregou.\nTela:", msg, *erros, sep="\n  ")
            await b.close()
            return 1
        await pg.click("#btnComecar")
        await pg.wait_for_timeout(2500)
        ondas = await pg.evaluate(
            "async () => (await window.__honkConn.query('SELECT onda, vida FROM jogador')).toArray()[0].toJSON()")
        await b.close()
    erros = [e for e in erros if "favicon" not in e]
    if erros:
        print("FALHOU: erros durante a partida:", *erros, sep="\n  ")
        return 1
    print(f"ok: {PAGINA} — motor carregado do disco, partida em andamento ({ondas})")
    return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
