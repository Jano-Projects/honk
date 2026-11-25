-- HONK! — jogo/sql/visao/render.sql
-- =====================================================================
--     SQL 9: RAYCASTING (view v_paredes)  -  o SQL "desenha" as paredes
--     Para cada uma das 320 colunas, um raio sai do ganso. Em vez de andar
--     passo a passo, calculamos de uma vez onde o raio cruza cada linha da
--     grade, juntamos com o mapa e ficamos com a parede mais próxima.
--     Devolve: distância, altura, lado, ponto da textura (u) e o entalhe.
--     =====================================================================

-- CÂMERA EM TERCEIRA PESSOA: fica atrás do ganso, recuada camera_dist.
-- Se houver parede atrás, ela se aproxima (testa 20 pontos ao longo do recuo)
-- para nunca atravessar a parede.
CREATE VIEW v_camera AS
WITH j AS (SELECT x, y, ang, cos(ang) AS dx, sin(ang) AS dy FROM jogador),
bloqueio AS (     -- primeiro ponto atrás do ganso que cai numa parede (ou fora do mapa)
  SELECT min(p.k * 0.1) AS d
  FROM range(1, 21) p(k) CROSS JOIN j
  LEFT JOIN grade g ON g.id = celula_id(j.x - j.dx * p.k * 0.1, j.y - j.dy * p.k * 0.1)
  WHERE g.bloqueia IS NOT FALSE
),
r AS (SELECT greatest(0.0, least(c.camera_dist, COALESCE(b.d, 99) - 0.3)) AS recuo FROM config c, bloqueio b)
SELECT j.x - j.dx * r.recuo AS cx, j.y - j.dy * r.recuo AS cy, j.ang, r.recuo
FROM j, r;

CREATE VIEW v_paredes AS
WITH cam AS (
  SELECT c.cx AS px, c.cy AS py, cos(c.ang) AS dx, sin(c.ang) AS dy, -sin(c.ang) * 0.66 AS plx, cos(c.ang) * 0.66 AS ply, j.mundo
  FROM v_camera c, jogador j
),
raio AS (   -- direção do raio de cada coluna = direção + plano da câmera * (-1..1)
  SELECT c::INTEGER AS c, px, py, dx + plx * (2.0 * c / 320 - 1) AS rdx, dy + ply * (2.0 * c / 320 - 1) AS rdy
  FROM cam, range(320) t(c)
),
vert AS (   -- cruzamentos com as linhas verticais (x inteiro), só dentro do mapa
  SELECT c, 0 AS lado, (lx - px) / rdx AS dist, py + (lx - px) / rdx * rdy AS bate,
         CASE WHEN rdx > 0 THEN lx ELSE lx - 1 END AS cx, floor(py + (lx - px) / rdx * rdy) AS cy
  FROM (SELECT *, CASE WHEN rdx > 0 THEN floor(px) + k ELSE floor(px) + 1 - k END AS lx
        FROM raio, range(1, 21) s(k)
        WHERE abs(rdx) > 1e-9 AND (CASE WHEN rdx > 0 THEN floor(px) + k ELSE floor(px) + 1 - k END) BETWEEN 0 AND 20)
),
horiz AS (  -- cruzamentos com as linhas horizontais (y inteiro)
  SELECT c, 1 AS lado, (ly - py) / rdy AS dist, px + (ly - py) / rdy * rdx AS bate,
         floor(px + (ly - py) / rdy * rdx) AS cx, CASE WHEN rdy > 0 THEN ly ELSE ly - 1 END AS cy
  FROM (SELECT *, CASE WHEN rdy > 0 THEN floor(py) + k ELSE floor(py) + 1 - k END AS ly
        FROM raio, range(1, 21) s(k)
        WHERE abs(rdy) > 1e-9 AND (CASE WHEN rdy > 0 THEN floor(py) + k ELSE floor(py) + 1 - k END) BETWEEN 0 AND 20)
),
acerto AS ( -- a parede MAIS PRÓXIMA de cada coluna
  SELECT a.c, arg_min(a.lado, a.dist) AS lado, arg_min(a.bate, a.dist) AS bate, arg_min(m.tipo, a.dist) AS tipo, min(a.dist) AS dist
  FROM (SELECT * FROM vert UNION ALL SELECT * FROM horiz) a
  JOIN mapa m ON m.x = a.cx AND m.y = a.cy
  WHERE a.cx BETWEEN 0 AND 19 AND a.cy BETWEEN 0 AND 19
  GROUP BY a.c
)
-- o SQL entrega a geometria; a "tinta" é aplicada pela textura entalhada
SELECT a.c, a.dist::DOUBLE AS dist, (160 / a.dist)::DOUBLE AS alt, a.lado,
       (a.bate - floor(a.bate))::DOUBLE AS u, p.padrao
FROM acerto a
JOIN cam ON true
JOIN parede p ON p.mundo = cam.mundo AND p.tipo = a.tipo;
