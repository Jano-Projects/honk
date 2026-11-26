# Como contribuir

Sugestões, correções e ideias de inimigos são bem-vindas.

## Issues

Abra uma *issue* escolhendo o modelo:

- **Problema**: o jogo não instala, não abre, trava ou fica com a tela preta. Diga o sistema e o navegador.
- **Bug no jogo**: algo errado dentro da partida (ganso preso na parede, inimigo que não morre, onda que não acaba) ou um ponto que ficou difícil ou fácil demais.
- **Ideia**: um inimigo, um poder, um mundo ou uma melhoria.

Falhas de segurança seguem a [política de segurança](SECURITY.md), e não vão em *issue* pública.

## Código

1. Leia [docs/desenvolvimento.md](docs/desenvolvimento.md): com `python3 ferramentas/montar.py --servir` você edita em `jogo/` e vê o resultado com F5.
2. As regras do jogo ficam em `jogo/sql/`, cada uma no seu arquivo; o desenho e o som, em `jogo/js/`. A [arquitetura](docs/arquitetura.md) explica como as partes conversam.
3. Antes do *pull request*, rode:
   ```bash
   python3 -m unittest discover -s testes -v      # regras SQL (segundos)
   cd testes && python3 robo_bugs.py 1 1500       # caçador de bugs (se mexeu em regras)
   ```
4. Atualize o `CHANGELOG.md` e a documentação que o seu ajuste afeta. O modelo de *pull request* tem a lista.
5. O *pull request* só pode ser mesclado com a verificação **Testes das regras SQL** aprovada. A mesclagem é sempre por *squash* (um commit por pull request), e o ramo é apagado em seguida: o repositório mantém só a `main`.

Participar do projeto implica seguir o [código de conduta](CODE_OF_CONDUCT.md).

## Versões

As versões seguem `MAIOR.MENOR.CORREÇÃO`, e cada release tem a tag `vX.Y.Z`:

- **MAIOR**: quando um progresso salvo antigo deixa de valer;
- **MENOR**: cada pacote de novidades publicado (mundos, inimigos, poderes, modos);
- **CORREÇÃO**: só conserto, sem novidade.

Trabalho em andamento fica num ramo, sem tag. A versão é publicada quando a tag chega ao GitHub: veja [Publicar uma versão](docs/desenvolvimento.md#publicar-uma-versão).
