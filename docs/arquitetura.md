# Como o HONK! funciona por dentro

O HONK! é um jogo 3D em que **o banco de dados é o motor**. Este documento explica
quem faz o quê, como um quadro acontece e os truques que deixaram isso jogável.

## A divisão de trabalho

| Camada | Onde | Responsabilidade |
|---|---|---|
| **SQL** (DuckDB-WASM) | `jogo/sql/` | Todo o estado e **todas** as regras: mapa, ganso, inimigos, projéteis, ondas, ciclos, cartas, lojas, colisão, caminhos, raycasting, projeção de sprites, HUD. |
| **JavaScript** | `jogo/js/` | Ler teclado, mouse e toque; mandar números ao banco; desenhar o que ele devolve; som e música. **Não conhece as regras.** |
| **HTML/CSS** | `jogo/index.html`, `jogo/css/` | A moldura em forma de folheto de cordel, os menus e o almanaque. |

Uma consequência boa: como as regras são só SQL, **o jogo inteiro pode ser testado sem
navegador**. Os testes (`testes/`) rodam os mesmos arquivos `.sql` no DuckDB do Python.

## Um passo da simulação

```
simular()  (jogo/js/13-simulacao.js)
 1. grava a entrada do quadro na tabela `entrada` (dt, frente, lado, giro, correr)
 2. regras/esquiva.sql      se a esquiva foi apertada
 3. regras/mover.sql        move o ganso com colisão (os 4 cantos do corpo)
 4. regras/perfeita.sql     só durante a esquiva: alguém errou por pouco?
 5. regras/bicar.sql, honk.sql, pena.sql    se as teclas foram apertadas
 6. eventos/ev-*.sql        só os que o HUD pediu (sinais f_ataque, f_onda, f_limpa…)
 7. regras/inimigos.sql     IA dos inimigos (a cada 2 passos, com o tempo acumulado)
 8. regras/tick.sql         relógio e temporizadores
 9. visao/saida.sql         UMA consulta devolve paredes + sprites + HUD
```

O passo 9 junta três visões num resultado só: `v_paredes` (o raycasting), `v_sprites`
(inimigos, projéteis, efeitos e números de dano já projetados na tela) e `v_hud` (vida,
onda, rosto do ganso e os **sinais** que dizem ao JavaScript quais eventos rodar no próximo passo).

## O raycasting em SQL

`visao/render.sql` lança um raio por coluna da tela (320) e anda pela grade 20×20 com
o algoritmo DDA, tudo em CTEs. Para cada coluna saem a distância perpendicular, a altura da
parede, o lado atingido, o ponto exato da textura e o padrão da parede (madeira, lona,
vitrine, alambrado…). O JavaScript só recorta a textura entalhada certa.

## A inteligência dos inimigos

`eventos/ev-campo.sql` calcula um **mapa de caminhos** a partir do ganso com uma busca em
largura (CTE recursiva) sempre que ele se afasta 2 células do último cálculo. Cada inimigo
"corpo a corpo" segue a seta da sua célula; os "à distância" recuam, circulam ou se aproximam
conforme a distância. Separação entre vizinhos e ziguezague saem de junções simples.

## Dois ritmos e a sensação de fluidez

O banco não consegue rodar 60 vezes por segundo em qualquer máquina, então há **dois laços**:

- **Simulação** (SQL): o quanto a máquina aguentar, até ~60 por segundo.
- **Impressão** (canvas): 60 quadros por segundo, sempre.

Entre um retrato do banco e outro, o JavaScript **prevê**: o ganso anda na hora em que a
tecla é apertada (as colunas de parede são reprojetadas), inimigos e projéteis seguem com a
velocidade que tinham e animações usam molas. Quando o banco confirma, a pequena diferença
é absorvida em ~80 ms, sem tranco.

## Truques de desempenho (medidos)

| Problema | Solução | Efeito |
|---|---|---|
| Cada `{dt}` virava uma subconsulta `(SELECT dt FROM entrada)` e o DuckDB montava uma junção para cada uma | Regras quentes leem a entrada por **junção única** (`FROM entrada _e`) | temporizadores do ganso: 33 ms → 2 ms |
| A IA dos inimigos é a consulta mais cara | Roda **a cada 2 passos**, com o tempo acumulado | ~metade do custo médio |
| Planos de consulta preparados ficavam "velhos" | `SET disabled_optimizers = 'statistics_propagation'` + repreparo quando a onda enche | sem regressões |
| Parâmetros em consultas preparadas deixavam o plano 2× mais lento | Entrada numa tabela de 1 linha, atualizada uma vez por passo | — |
| Paredes recalculadas sem necessidade | Cache: com a câmera parada, usa `visao/saida-leve.sql` | — |
| Colisão por pontos deixava o ganso entrar na quina | Corpo testado nos 4 cantos com a grade guardada numa **lista** (`grade_lista`), lida por índice | mais correto **e** mais rápido |

Use `?perf` no endereço do jogo para ver o custo de cada bloco SQL em `window.__honkPerf`.

## A estética: xilogravura de cordel

Nada é imagem pronta. As texturas de parede são **entalhadas por código** (`02-gravura…`),
os inimigos são pixel art guardada como **texto numa tabela SQL** (`esquema/08-sprites.sql`)
e convertida para três tintas (papel, tinta, destaque) com contorno e marcas de goiva. Cada
mundo tem sua própria tríade de cores; o Aeroporto, de madrugada, é a matriz invertida.

## Abrir sem servidor

Instalado, o jogo é aberto pelo navegador em modo aplicativo direto do disco
(`file://…/index.html`), num perfil próprio com `--allow-file-access-from-files`: assim o
DuckDB-WASM carrega da pasta `vendor/` sem servidor nem terminal. Onde isso não é possível
(Chromium em snap, Firefox, Safari), um servidor local mínimo (`empacotar/comum/servidor.*`)
entra como plano B, invisível.
