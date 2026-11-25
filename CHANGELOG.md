# Histórico de versões

## 1.0.0 — primeira versão pública

O jogo, do protótipo em SQLite até aqui, em uma linha por etapa:

- **Demo em texto (SQLite)** — a prova de que dá para escrever as regras de um roguelite em SQL.
- **Primeira pessoa no DuckDB-WASM** — raycasting feito por uma consulta SQL, no navegador.
- **Design completo** — três mundos, chefes, loja do ninho, cartas de poder, lançadores para máquinas recém-formatadas.
- **Xilogravura de cordel** — texturas entalhadas por código, sprites em três tintas, moldura de folheto.
- **Terceira pessoa** — câmera atrás do ganso, tela cheia, animações.
- **Desempenho** — janela dedicada do Chromium, laços de simulação e de desenho separados, cache de paredes.
- **Animações com peso** — molas, previsão entre os retratos do banco, câmera e rodapé suaves.
- **Jogabilidade** — resposta imediata ao teclado, esquiva invencível, mira magnética, avisos de ameaça.
- **Almanaque do Ganso** e **caça a bugs** com robôs (colisão pelos quatro cantos, linha de visão, pausa automática).
- **"Um ganso acordou com ódio"** — cinco lugares (Feira e Shopping novos), ciclos sem fim com inimigos que medem a força do ganso, cartas com limite.
- **Profundidade** — Penas de Ouro, desafio do dia, esquiva perfeita, combos, regras de ciclo, música gerada, falas, placar final, entrada do quadro por junção (tick 34 → 9 ms).
- **Repositório** — código destrinchado em SQL/JS/CSS, montador, testes automáticos, instaladores para Windows, Debian/Ubuntu, Fedora e macOS que abrem o jogo sem terminal e 100% offline.
