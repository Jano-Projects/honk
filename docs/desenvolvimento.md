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

1. Escreva as mudanças no `CHANGELOG.md`, numa seção `## X.Y.Z — AAAA-MM-DD`, e ponha o mesmo número no arquivo `VERSAO`.
   Confira o texto que vai para a página de Releases:
   ```sh
   python3 ferramentas/notas-da-versao.py
   ```
2. Envie, crie a tag e envie a tag:
   ```sh
   git commit -am "Versão X.Y.Z"
   git push
   git tag -a vX.Y.Z -m "HONK! X.Y.Z"
   git push origin vX.Y.Z
   ```
3. O workflow **Lançamento** monta tudo, roda os testes, gera o `.exe`, o `.deb`, o `.rpm`, o `.dmg` e o `.zip`,
   **homologa** cada um num sistema limpo ([como](homologacao.md)) e só então publica a release, com as notas
   tiradas do CHANGELOG e o `SHA256SUMS.txt`. Se a tag não bater com o `VERSAO`, ou o CHANGELOG não tiver a seção
   da versão, ele para antes de gerar qualquer coisa.

Para ensaiar sem publicar: aba **Actions › Lançamento › Run workflow**; os arquivos ficam em *Artifacts*.

As regras de numeração estão em [Como contribuir › Versões](../CONTRIBUTING.md#versões).

### Configuração do repositório no GitHub

`bash ferramentas/configurar-github.sh` aplica (e reaplica, se algo mudar) a descrição e os tópicos,
mesclagem só por *squash*, alertas e correções de segurança, varredura de segredos, CodeQL, token das
*actions* só com leitura, proteção da `main` (exige **Testes das regras SQL** nos pull requests) e das tags
`v*`, e os rótulos das issues. A imagem de prévia (`docs/capturas/previa-social.png`) se envia à mão em
*Settings › General › Social preview*.

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
