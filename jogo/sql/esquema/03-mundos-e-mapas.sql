-- HONK! — jogo/sql/esquema/03-mundos-e-mapas.sql
-- ---------- os cinco mundos do CICLO ----------
-- Um ganso acordou com ódio e saiu do lago. Cada mundo é um lugar que ele vai "visitar".
-- Depois do Aeroporto, ele volta ao Parque para mais uma volta: um CICLO novo, com
-- inimigos que crescem conforme a força do próprio ganso (ver sql-ev-onda).
-- Cores: papel, tinta e destaque de cada mundo; o Aeroporto, de madrugada, é invertido.
CREATE TABLE mundo (id INTEGER, nome VARCHAR, subtitulo VARCHAR, papel VARCHAR, tinta VARCHAR, destaque VARCHAR, noite BOOLEAN);
INSERT INTO mundo VALUES
 (1, 'O PARQUE',    'onde jogaram pão velho no lago dele', '#ede0bd', '#1c1611', '#b8322a', false),
 (2, 'A FAZENDA',   'a família da ração que ele odeia',    '#efc3a6', '#2b130c', '#a32319', false),
 (3, 'A FEIRA',     'domingo, sete da manhã, gritaria',    '#f2d98c', '#2a1708', '#c22f1b', false),
 (4, 'O SHOPPING',  'ar-condicionado e gente andando devagar', '#cfe0d6', '#14211e', '#d23a68', false),
 (5, 'O AEROPORTO', 'quem tenta fugir de avião',           '#161f31', '#ecdfbf', '#e2583f', true);

-- Mapas desenhados como texto (20x20). Legenda por mundo:
--  Parque:    # cerca  A árvore  E cerca-viva  P chafariz  K quiosque de pipoca
--  Fazenda:   # cerca  A árvore  C celeiro  F feno  M muro de pedra
--  Feira:     # muro  L barraca de lona  X caixotes  A árvore
--  Shopping:  # pilar  V vitrine  P pilar  F fonte  E vaso de plantas
--  Aeroporto: # alambrado  H hangar  T terminal  B barreira  V avião estacionado
--  S = onde inimigos surgem   G = onde o ganso nasce   . = chão
CREATE TABLE mapa_txt (mundo INTEGER, y INTEGER, linha VARCHAR);
INSERT INTO mapa_txt VALUES
 (1, 0,'####################'),(1, 1,'#S.......AA......S.#'),(1, 2,'#..................#'),(1, 3,'#..AA.........AA...#'),
 (1, 4,'#..AA....PP...AA...#'),(1, 5,'#........PP........#'),(1, 6,'#..................#'),(1, 7,'#.....EEEE.........#'),
 (1, 8,'#..............K...#'),(1, 9,'#S.................#'),(1,10,'#.........G........#'),(1,11,'#..A...............#'),
 (1,12,'#..A...............#'),(1,13,'#..........KK...AA.#'),(1,14,'#...............AA.#'),(1,15,'#.....A............#'),
 (1,16,'#..................#'),(1,17,'#.EE.......EE......#'),(1,18,'#S.......S........S#'),(1,19,'####################'),

 (2, 0,'####################'),(2, 1,'#S.....FF.........S#'),(2, 2,'#..................#'),(2, 3,'#..CCC.......FF....#'),
 (2, 4,'#..CCC.......FF....#'),(2, 5,'#..CCC.............#'),(2, 6,'#........A.........#'),(2, 7,'#..............MMM.#'),
 (2, 8,'#S.....FF..........#'),(2, 9,'#..........G......S#'),(2,10,'#..................#'),(2,11,'#...A..........FF..#'),
 (2,12,'#......MMMM........#'),(2,13,'#..................#'),(2,14,'#..FF.......CC.....#'),(2,15,'#..FF.......CC..A..#'),
 (2,16,'#..................#'),(2,17,'#.......A..........#'),(2,18,'#S.......S........S#'),(2,19,'####################'),

 (3, 0,'####################'),(3, 1,'#S.......X........S#'),(3, 2,'#..LLLL......LLLL..#'),(3, 3,'#..................#'),
 (3, 4,'#..XX.....A....XX..#'),(3, 5,'#..................#'),(3, 6,'#S.LLLL......LLLL.S#'),(3, 7,'#..................#'),
 (3, 8,'#........G.........#'),(3, 9,'#..XX..........XX..#'),(3,10,'#..................#'),(3,11,'#..LLLL......LLLL..#'),
 (3,12,'#......A...........#'),(3,13,'#..............X...#'),(3,14,'#..XX..LLLL........#'),(3,15,'#..................#'),
 (3,16,'#.......A....XX....#'),(3,17,'#..................#'),(3,18,'#S.......S........S#'),(3,19,'####################'),

 (4, 0,'####################'),(4, 1,'#S.VVV....VVV.....S#'),(4, 2,'#..VVV....VVV......#'),(4, 3,'#..................#'),
 (4, 4,'#.P......P.......P.#'),(4, 5,'#..................#'),(4, 6,'#S.....FF......VVV.#'),(4, 7,'#......FF......VVV.#'),
 (4, 8,'#..................#'),(4, 9,'#.P......G.......PS#'),(4,10,'#..................#'),(4,11,'#.VVV..........EE..#'),
 (4,12,'#.VVV..........EE..#'),(4,13,'#..................#'),(4,14,'#.P......P.......P.#'),(4,15,'#..................#'),
 (4,16,'#....EE.....VVV....#'),(4,17,'#...........VVV....#'),(4,18,'#S.......S........S#'),(4,19,'####################'),

 (5, 0,'####################'),(5, 1,'#S.......TTTT.....S#'),(5, 2,'#........TTTT......#'),(5, 3,'#..................#'),
 (5, 4,'#..HHH........VVVV.#'),(5, 5,'#..HHH.............#'),(5, 6,'#..HHH.....BB......#'),(5, 7,'#..................#'),
 (5, 8,'#S.......G........S#'),(5, 9,'#..................#'),(5,10,'#....BB.......HHH..#'),(5,11,'#.............HHH..#'),
 (5,12,'#..VVVV.......HHH..#'),(5,13,'#..................#'),(5,14,'#.........BB.......#'),(5,15,'#..................#'),
 (5,16,'#....TT......VVVV..#'),(5,17,'#....TT............#'),(5,18,'#S.......S........S#'),(5,19,'####################');

-- Cada linha vira células (mundo, x, y, caractere)
CREATE TABLE celula AS
SELECT mundo, x::INTEGER AS x, y, substr(linha, x::INTEGER + 1, 1) AS ch
FROM (SELECT mundo, y, linha, unnest(range(length(linha))) AS x FROM mapa_txt);

-- Tabelas do MUNDO ATUAL (recarregadas ao trocar de mundo; deixam o raycasting rápido)
CREATE TABLE mapa (x INTEGER, y INTEGER, tipo VARCHAR);
-- a posição (qx, qy) está livre, sem parede?
-- (ao usar, sempre passe colunas com o nome da tabela: jogador.x, inimigo.x...)
CREATE MACRO livre(qx, qy) AS
  (qx >= 1 AND qx < 19 AND qy >= 1 AND qy < 19          -- dentro da cerca do mapa 20x20
   AND NOT EXISTS (SELECT 1 FROM mapa _parede WHERE _parede.x = floor(qx) AND _parede.y = floor(qy)));
CREATE TABLE spawn (x DOUBLE, y DOUBLE);
CREATE TABLE vizinho (ox INTEGER, oy INTEGER, x INTEGER, y INTEGER);
CREATE TABLE rumo (x INTEGER, y INTEGER, passos INTEGER, tx INTEGER, ty INTEGER);
CREATE TABLE campo_origem AS SELECT -1 AS cx, -1 AS cy;
-- grade 20x20 do mundo atual: id = x * 20 + y; bloqueia = parede ou borda.
-- Consultar "tem parede aqui?" vira um JOIN simples, rápido no navegador.
CREATE TABLE grade (id INTEGER, bloqueia BOOLEAN);
CREATE MACRO celula_id(qx, qy) AS (CASE WHEN qx < 1 OR qx >= 19 OR qy < 1 OR qy >= 19 THEN -1
                                        ELSE (floor(qx) * 20 + floor(qy))::INTEGER END);
-- o CORPO do ganso é um quadrado de 0,48 de lado: os quatro cantos têm que estar fora das paredes.
-- (antes só um ponto à frente era testado, e numa diagonal rente a uma quina o ganso entrava na parede)
-- bl = a grade inteira numa LISTA (posição = id da célula + 1): ler por índice é muito mais rápido que juntar tabelas
CREATE TABLE grade_lista (bl BOOLEAN[]);
CREATE MACRO bloq(bl, qx, qy) AS COALESCE(bl[celula_id(qx, qy) + 1], true);
CREATE MACRO corpo_r(bl, qx, qy, r) AS
  (qx - r >= 1 AND qx + r < 19 AND qy - r >= 1 AND qy + r < 19
   AND NOT (bloq(bl, qx - r, qy - r) OR bloq(bl, qx + r, qy - r) OR bloq(bl, qx - r, qy + r) OR bloq(bl, qx + r, qy + r)));
CREATE MACRO corpo_livre(bl, qx, qy) AS corpo_r(bl, qx, qy, 0.24);
-- empurrão (bicada/HONK): o corpo cabe no fim E o caminho não atravessa parede (testa 3 pontos no meio)
-- linha de visão curta (corpo a corpo): o ponto do meio e os quartos entre os dois não são parede
CREATE MACRO ve(bl, x0, y0, x1, y1) AS
  NOT (bloq(bl, x0 + (x1 - x0) * 0.25, y0 + (y1 - y0) * 0.25) OR bloq(bl, (x0 + x1) / 2, (y0 + y1) / 2)
       OR bloq(bl, x0 + (x1 - x0) * 0.75, y0 + (y1 - y0) * 0.75));
CREATE MACRO empurra_ok(bl, x0, y0, x1, y1) AS
  (corpo_r(bl, x1, y1, 0.18) AND NOT (bloq(bl, x0 + (x1 - x0) * 0.25, y0 + (y1 - y0) * 0.25)
   OR bloq(bl, x0 + (x1 - x0) * 0.5, y0 + (y1 - y0) * 0.5) OR bloq(bl, x0 + (x1 - x0) * 0.75, y0 + (y1 - y0) * 0.75)));
CREATE MACRO centro_livre(bl, qx, qy) AS (qx >= 1 AND qx < 19 AND qy >= 1 AND qy < 19 AND NOT bloq(bl, qx, qy));

-- Qual entalhe (textura de xilogravura) cada tipo de parede usa, em cada mundo
CREATE TABLE parede (mundo INTEGER, tipo VARCHAR, padrao VARCHAR);
INSERT INTO parede VALUES
 (1,'#','madeira'), (1,'A','arvore'), (1,'E','folhagem'), (1,'P','chafariz'), (1,'K','quiosque'),
 (2,'#','trilho'),  (2,'A','arvore'), (2,'C','celeiro'),  (2,'F','feno'),     (2,'M','pedra'),
 (3,'#','pedra'),    (3,'L','lona'),  (3,'X','caixote'),  (3,'A','arvore'),
 (4,'#','pilar'),    (4,'V','vitrine'),(4,'P','pilar'),    (4,'F','chafariz'), (4,'E','folhagem'),
 (5,'#','alambrado'),(5,'H','hangar'),(5,'T','terminal'), (5,'B','barreira'), (5,'V','aviao');

-- Silhueta do horizonte de cada mundo (256 fatias ao redor do ganso), calculada com senos
CREATE TABLE horizonte AS
SELECT m.id AS mundo, i::INTEGER AS i,
  CASE m.id
    WHEN 1 THEN 9 + 5 * sin(i * 0.05) + 3 * sin(i * 0.19)                       -- colinas
              + CASE WHEN (i * 37) % 29 < 3 THEN 9 + (i % 5) ELSE 0 END          -- copas de árvores
    WHEN 2 THEN 7 + 4 * sin(i * 0.04)
              + CASE WHEN i BETWEEN 40 AND 46 THEN 30 ELSE 0 END                  -- silo
              + CASE WHEN i BETWEEN 110 AND 150 THEN 22 - abs(i - 130) * 0.5 ELSE 0 END  -- celeiro
              + CASE WHEN i BETWEEN 200 AND 202 THEN 34 ELSE 0 END                -- moinho
              + CASE WHEN i BETWEEN 193 AND 209 AND (i % 4) = 0 THEN 28 ELSE 0 END
    WHEN 3 THEN 6 + CASE WHEN i % 22 < 11 THEN 14 - abs(i % 22 - 5.5) * 2 ELSE 2 END    -- telhados das barracas
              + CASE WHEN i % 61 = 0 THEN 30 ELSE 0 END                           -- postes
              + CASE WHEN i BETWEEN 150 AND 190 THEN 10 ELSE 0 END                -- prédio atrás
    WHEN 4 THEN 24 + CASE WHEN (i / 16) % 3 = 0 THEN 6 ELSE 0 END                 -- segundo andar e letreiros
              + CASE WHEN i % 16 < 2 THEN 4 ELSE 0 END
    ELSE 3
              + CASE WHEN i BETWEEN 60 AND 66 THEN 30 ELSE 0 END                  -- torre de controle
              + CASE WHEN i BETWEEN 57 AND 69 THEN 8 ELSE 0 END
              + CASE WHEN i BETWEEN 100 AND 170 THEN 12 ELSE 0 END                -- terminal ao longe
              + CASE WHEN i BETWEEN 205 AND 208 THEN 16 ELSE 0 END                -- cauda de avião
  END::DOUBLE AS alt
FROM mundo m, range(256) t(i);

