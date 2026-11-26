# Histórico de versões

## 1.0.0 — 2026-11-25

Primeira versão pública.

### O jogo
- **Um ganso acordou com ódio**: cinco lugares por ciclo (Parque, Fazenda, Feira, Shopping e Aeroporto), cinco ondas em cada um e um chefe a cada cinco ondas.
- **Ciclos sem fim**: depois do Airbus, o ganso volta ao Parque, e os inimigos crescem conforme a força dele. Cartas e loja do ninho têm teto; depois disso, o limite é a sua habilidade.
- **Combate**: bicada com mira magnética, HONK, pena, esquiva invencível, esquiva perfeita com câmera lenta e combos de cartas.
- **Progressão**: loja do ninho, Penas de Ouro, desafio do dia igual para todos e um ganso que muda de visual a cada ciclo.
- **Almanaque do Ganso** (tecla H): inimigos, mundos, comandos e poderes.

### Instalação
- Instaladores para **Windows** (.exe), **Debian/Ubuntu** (.deb), **Fedora** (.rpm) e **macOS** (.zip com o HONK.app e, quando o GitHub tem um Mac livre, .dmg), além da versão portátil (.zip). O ícone abre o jogo numa janela própria, sem terminal, e tudo roda offline.
- Cada instalador é instalado, conferido e removido automaticamente nas cinco plataformas antes da publicação. A página de Releases traz o `SHA256SUMS.txt` para conferir os arquivos.

### Repositório
- Código destrinchado em `jogo/sql`, `jogo/js` e `jogo/css`, com montador, testes das regras SQL e robôs caçadores de bugs e de equilíbrio.
- Documentação (índice, arquitetura, desenvolvimento e homologação), modelos de issue e de pull request, política de segurança, como contribuir, código de conduta e atualização mensal das *actions* pelo Dependabot.

### Como chegamos aqui

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
