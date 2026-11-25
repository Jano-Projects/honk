-- HONK! — jogo/sql/eventos/ev-campo.sql
-- MAPA DE CAMINHOS: busca em largura (BFS) com CTE recursiva a partir
--     da célula do ganso. Recalculado quando ele se afasta 2 células.

DELETE FROM rumo;
INSERT INTO rumo
WITH RECURSIVE bfs(x, y, passos) AS (
    SELECT floor(x)::INTEGER, floor(y)::INTEGER, 0 FROM jogador
  UNION
    SELECT v.x, v.y, b.passos + 1
    FROM bfs b JOIN vizinho v ON v.ox = b.x AND v.oy = b.y
    WHERE b.passos < 40
),
dist AS (SELECT x, y, min(passos) AS passos FROM bfs GROUP BY x, y)
-- para cada célula, a vizinha mais perto do ganso é o próximo passo
SELECT d.x, d.y, d.passos, arg_min(n.x, n.passos), arg_min(n.y, n.passos)
FROM dist d
JOIN vizinho v ON v.ox = d.x AND v.oy = d.y
JOIN dist n    ON n.x = v.x AND n.y = v.y
GROUP BY d.x, d.y, d.passos;
UPDATE campo_origem SET cx = floor(j.x)::INTEGER, cy = floor(j.y)::INTEGER FROM jogador j;
DELETE FROM efeito WHERE t0 < (SELECT t FROM relogio) - 1.0;
-- rede de segurança: inimigo que tenha ido parar dentro de uma parede volta por um ponto de entrada
UPDATE inimigo SET x = s.x, y = s.y
FROM (SELECT x, y FROM spawn ORDER BY random() LIMIT 1) s
WHERE NOT livre(inimigo.x, inimigo.y);
