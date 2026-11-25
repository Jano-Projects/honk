#!/usr/bin/env python3
"""
HONK! — montador do jogo
========================

O código-fonte fica DESTRINCHADO em `jogo/`:

    jogo/index.html        a "casca" da página, com marcadores <!-- @... -->
    jogo/css/estilo.css    a moldura, os menus e o almanaque
    jogo/sql/**.sql        TODAS as regras do jogo (o DuckDB é o motor)
    jogo/js/NN-*.js        entrada, desenho, som e o laço principal, em ordem

Este script junta tudo num ÚNICO arquivo `dist/index.html` — é ele que vai
para os instaladores e para quem só quer jogar. Não precisa instalar nada:
só Python 3 (já vem no Linux e no macOS).

Uso:
    python3 ferramentas/montar.py            monta dist/index.html
    python3 ferramentas/montar.py --servir   monta e serve em http://localhost:8080
                                             (remonta a cada F5: edite e recarregue)

Marcadores entendidos na casca:
    <!-- @css caminho.css -->           vira <style>...</style>
    <!-- @sql id = arquivo.sql -->      vira <script type="text/sql" id="id">...</script>
    <!-- @sql id = pasta/ -->           idem, juntando os .sql da pasta em ordem alfabética
    <!-- @js pasta/ -->                 vira <script type="module">, juntando os .js em ordem
"""
import http.server
import pathlib
import re
import shutil
import sys

RAIZ = pathlib.Path(__file__).resolve().parent.parent
JOGO = RAIZ / "jogo"
DIST = RAIZ / "dist"
VENDOR = RAIZ / "vendor"          # motor DuckDB + fontes (baixados por ferramentas/baixar-motor.*)


def _ler(caminho: pathlib.Path) -> str:
    return caminho.read_text(encoding="utf-8")


def _juntar(alvo: str, extensao: str) -> str:
    """Um arquivo, ou todos os arquivos da pasta (ordem alfabética: por isso os prefixos NN-)."""
    caminho = JOGO / alvo
    if alvo.endswith("/"):
        arquivos = sorted(caminho.glob(f"*{extensao}"))
        if not arquivos:
            raise SystemExit(f"montar: nenhum {extensao} em {alvo}")
        return "".join(_ler(a) if _ler(a).endswith("\n") else _ler(a) + "\n" for a in arquivos)
    return _ler(caminho)


def montar() -> str:
    """Devolve o HTML completo, com CSS, SQL e JavaScript embutidos."""
    html = _ler(JOGO / "index.html")

    html = re.sub(r"<!-- @css (\S+) -->\n",
                  lambda m: "<style>\n" + _juntar(m.group(1), ".css") + "</style>\n", html)
    html = re.sub(r"<!-- @sql ([\w-]+) = (\S+) -->",
                  lambda m: f'<script type="text/sql" id="{m.group(1)}">\n' + _juntar(m.group(2), ".sql") + "</script>",
                  html)
    html = re.sub(r"<!-- @js (\S+) -->",
                  lambda m: '<script type="module">\n' + _juntar(m.group(1), ".js") + "</script>", html)

    sobrou = re.findall(r"<!-- @\w+[^>]*-->", html)
    if sobrou:
        raise SystemExit(f"montar: marcador não reconhecido: {sobrou[0]}")
    return html


def blocos_sql(html: str | None = None) -> dict[str, str]:
    """Os blocos SQL por id (usado pelos testes, que rodam as regras no DuckDB do Python)."""
    html = html or montar()
    return {m.group(1): m.group(2) for m in
            re.finditer(r'<script type="text/sql" id="([\w-]+)">(.*?)</script>', html, re.S)}


def gravar() -> pathlib.Path:
    DIST.mkdir(exist_ok=True)
    destino = DIST / "index.html"
    destino.write_text(montar(), encoding="utf-8")
    if VENDOR.is_dir():                      # leva o motor junto: dist/ fica pronto para jogar offline
        shutil.copytree(VENDOR, DIST / "vendor", dirs_exist_ok=True)
    return destino


def servir(porta: int = 8080) -> None:
    """Servidor de desenvolvimento: remonta a página a cada requisição de / (edite e aperte F5)."""
    class Manipulador(http.server.SimpleHTTPRequestHandler):
        def __init__(self, *a, **k):
            super().__init__(*a, directory=str(DIST), **k)

        def do_GET(self):
            if self.path.split("?")[0] in ("/", "/index.html"):
                gravar()
            return super().do_GET()

        def log_message(self, *a):           # silencioso
            pass

    Manipulador.extensions_map[".wasm"] = "application/wasm"
    Manipulador.extensions_map[".mjs"] = "text/javascript"
    gravar()
    print(f"HONK! em modo desenvolvimento: http://localhost:{porta}/   (Ctrl+C para sair)")
    http.server.ThreadingHTTPServer(("127.0.0.1", porta), Manipulador).serve_forever()


if __name__ == "__main__":
    if "--servir" in sys.argv:
        servir()
    else:
        print("montado:", gravar().relative_to(RAIZ))
