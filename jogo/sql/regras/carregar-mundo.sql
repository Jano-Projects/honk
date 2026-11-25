-- HONK! — jogo/sql/regras/carregar-mundo.sql
-- =====================================================================
--     SQL 2: CARREGAR O MUNDO ATUAL
--     Copia o mapa do mundo do ganso para as tabelas "quentes".
--     =====================================================================

DELETE FROM mapa;
INSERT INTO mapa SELECT x, y, ch FROM celula WHERE mundo = (SELECT mundo FROM jogador) AND ch NOT IN ('.', 'S', 'G');
DELETE FROM spawn;
INSERT INTO spawn SELECT x + 0.5, y + 0.5 FROM celula WHERE mundo = (SELECT mundo FROM jogador) AND ch = 'S';
-- pares de células vizinhas onde dá para andar: o "grafo" do mapa de caminhos
DELETE FROM vizinho;
INSERT INTO vizinho
SELECT a.x, a.y, b.x, b.y
FROM celula a JOIN celula b ON a.mundo = b.mundo AND abs(a.x - b.x) + abs(a.y - b.y) = 1
WHERE a.mundo = (SELECT mundo FROM jogador) AND a.ch IN ('.', 'S', 'G') AND b.ch IN ('.', 'S', 'G');
DELETE FROM grade;
INSERT INTO grade SELECT x * 20 + y, ch NOT IN ('.', 'S', 'G') FROM celula WHERE mundo = (SELECT mundo FROM jogador);
DELETE FROM grade_lista;
INSERT INTO grade_lista SELECT list(COALESCE(g.bloqueia, true) ORDER BY r.i) FROM range(400) r(i) LEFT JOIN grade g ON g.id = r.i;
UPDATE campo_origem SET cx = -1, cy = -1;
DELETE FROM projetil;
DELETE FROM flutua;
DELETE FROM efeito;
