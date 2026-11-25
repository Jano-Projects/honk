# Desenvolvendo o HONK!

## Preparar (uma vez)

Precisa só de **Python 3** e de `curl` ou `wget`.

```sh
sh ferramentas/baixar-motor.sh     # DuckDB-WASM 1.32.0 + fontes -> vendor/  (~75 MB, fora do git)
pip install duckdb                 # só para os testes
```

## Editar e ver na hora

```sh
python3 ferramentas/montar.py --servir      # http://localhost:8080
```

Edite os arquivos em `jogo/` e aperte **F5**: o montador refaz a página a cada recarga.

- **Mudar uma regra** (dano, velocidade, chance de crítico, como uma onda nasce): `jogo/sql/`.
- **Equilíbrio geral** (crescimento por onda, cura, migalhas por dificuldade): `jogo/sql/esquema/02-balanco.sql`.
- **Um inimigo novo**: uma linha em `esquema/07-bestiario.sql`, o desenho em pixel art em
  `esquema/08-sprites.sql` e uma dica em `js/12-almanaque.js`. O almanaque se atualiza sozinho.
- **Um mundo novo**: cores em `esquema/03-mundos-e-mapas.sql`, o mapa 20×20 (`#` parede, `S` nascimento
  de inimigos, `G` ganso) e os tipos de parede; o horizonte fica em `visao/render.sql`.
- **Desenho, animação, som**: `jogo/js/`. Os arquivos são juntados em ordem (`00-` a `14-`).

Diagnóstico no navegador: `?perf` mede cada bloco SQL (`window.__honkPerf`), a tecla `I` mostra o FPS.

## Testar

```sh
python3 -m unittest discover -s testes -v      # regras: segundos
cd testes && python3 robo_bugs.py 2 3000       # caçador de bugs: minutos
cd testes && python3 robo_equilibrio.py        # até onde um jogador razoável chega
```

O caçador de bugs confere a cada quadro: ninguém dentro de parede ou fora do mapa, nada de
NaN, onda que não trava, projéteis que não se acumulam. Ele sai com erro se achar algo.

## Montar e empacotar

```sh
python3 ferramentas/montar.py                  # dist/index.html (+ dist/vendor se houver)
sh empacotar/linux/montar-deb.sh               # saida/honk_<versão>_all.deb
sh empacotar/linux/montar-rpm.sh               # saida/honk-<versão>-1.noarch.rpm  (precisa de rpmbuild)
sh empacotar/macos/montar-app.sh               # saida/HONK.app (e o .dmg, se estiver num Mac)
```

O instalador do Windows (`empacotar/windows/honk.iss`, Inno Setup) e o lançador `HONK.exe`
(`Lancador.cs`) são montados pelo GitHub Actions numa máquina Windows — veja abaixo.
Para montar à mão num Windows: compile o `Lancador.cs` como diz o cabeçalho dele e rode
`iscc /DVersao=1.0.0 empacotar\windows\honk.iss`.

O ícone vem de `empacotar/icone/honk.svg`; se mudar o desenho, rode `gerar_icones.py`.

## Publicar uma versão

1. Atualize `VERSAO` e o `CHANGELOG.md`.
2. Crie a tag e envie:
   ```sh
   git tag v1.0.0
   git push origin v1.0.0
   ```
3. O workflow **Lançamento** monta tudo, roda os testes e publica na página de Releases:
   `.exe` (Windows), `.deb`, `.rpm`, `.dmg` (macOS) e o `.zip` portátil.

Para testar o workflow sem publicar: aba **Actions › Lançamento › Run workflow**; os arquivos
ficam em *Artifacts*.

Opcional: em *Settings › Secrets and variables › Actions › Variables*, crie `EMAIL_MANTENEDOR`
com o e-mail que deve aparecer no pacote `.deb`.

## Onde ficam os dados do jogador

O progresso (moedas, recorde, lojas, desafio do dia) fica no `localStorage` do perfil próprio
do navegador do jogo:

| Sistema | Pasta do perfil |
|---|---|
| Windows | `%LOCALAPPDATA%\HONK\perfil` |
| Linux | `~/.local/share/honk/perfil` (Chromium snap: `~/snap/chromium/common/honk-perfil`) |
| macOS | `~/Library/Application Support/HONK/perfil` |

Desinstalar o jogo **não** apaga essa pasta, para não perder o progresso numa reinstalação.
