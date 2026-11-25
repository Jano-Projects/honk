#!/usr/bin/env python3
"""
HONK! — servidor local mínimo (plano B dos instaladores).

Só é usado quando o navegador não consegue abrir o jogo direto do disco
(Chromium em snap no Ubuntu, Firefox, Safari). Atende apenas este computador
(127.0.0.1), entrega os arquivos da pasta do jogo com os tipos certos
(.wasm, .mjs) e se desliga sozinho depois de um tempo limite.

Uso: servidor.py <pasta> <porta> [segundos_ate_desligar]
"""
import functools
import http.server
import sys
import threading


def main() -> None:
    pasta, porta = sys.argv[1], int(sys.argv[2])
    limite = float(sys.argv[3]) if len(sys.argv) > 3 else 0

    class Manipulador(http.server.SimpleHTTPRequestHandler):
        extensions_map = {**http.server.SimpleHTTPRequestHandler.extensions_map,
                          ".wasm": "application/wasm", ".mjs": "text/javascript", ".woff2": "font/woff2"}

        def log_message(self, *args):      # silencioso
            pass

    servidor = http.server.ThreadingHTTPServer(("127.0.0.1", porta), functools.partial(Manipulador, directory=pasta))
    if limite > 0:
        threading.Timer(limite, servidor.shutdown).start()
    servidor.serve_forever()


if __name__ == "__main__":
    main()
