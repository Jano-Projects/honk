-- HONK! — jogo/sql/regras/inimigos.sql
-- INIMIGOS PENSAM (v9): o movimento e os temporizadores dos inimigos rodam a cada 2 passos da
--     simulação, com o tempo acumulado (dt_ini). É a consulta mais cara do quadro; na tela eles
--     continuam andando lisos porque o JavaScript prevê o movimento entre um passo e outro.

-- Movimento dos inimigos, conforme o comportamento:
--   corpo:     segue o MAPA DE CAMINHOS (tabela rumo) até o ganso
--   distancia: se perto demais recua; na distância boa, anda em círculo; longe, se aproxima
-- + separação (não se empilham) + ziguezague. Tudo com CTEs e junções simples,
-- que o DuckDB executa bem mais rápido do que subconsultas correlacionadas.
UPDATE inimigo SET
  x = CASE WHEN m.ld OR m.lx THEN m.x + m.vx ELSE m.x END,
  y = CASE WHEN m.ld THEN m.y + m.vy WHEN m.lx THEN m.y WHEN m.ly THEN m.y + m.vy ELSE m.y END,
  cd        = greatest(0, inimigo.cd        - _e.dt_ini),
  flash     = greatest(0, inimigo.flash     - _e.dt_ini),
  tiro_cd   = greatest(0, inimigo.tiro_cd   - _e.dt_ini),
  invoca_cd = greatest(0, inimigo.invoca_cd - _e.dt_ini)
FROM (
  WITH base AS (            -- cada inimigo, a posição do ganso e o próximo passo do mapa de caminhos
    SELECT i.id, i.x, i.y, i.vel, i.zigue, i.comportamento, i.escala, j.x AS jx, j.y AS jy, r.t,
           sqrt(d2(i.x, i.y, j.x, j.y)) + 1e-9 AS d,
           CASE WHEN ru.passos IS NULL OR ru.passos <= 1 THEN j.x ELSE ru.tx + 0.5 END AS ax,
           CASE WHEN ru.passos IS NULL OR ru.passos <= 1 THEN j.y ELSE ru.ty + 0.5 END AS ay
    FROM inimigo i CROSS JOIN jogador j CROSS JOIN relogio r
    LEFT JOIN rumo ru ON ru.x = floor(i.x) AND ru.y = floor(i.y)
    WHERE j.estado = 'vivo'
  ),
  sep AS (                  -- empurrãozinho para longe dos vizinhos muito próximos
    SELECT a.id, sum((a.x - b.x) / (d2(a.x, a.y, b.x, b.y) + 0.05)) * 0.08 AS sx,
                 sum((a.y - b.y) / (d2(a.x, a.y, b.x, b.y) + 0.05)) * 0.08 AS sy
    FROM inimigo a JOIN inimigo b ON a.id <> b.id AND abs(a.x - b.x) < 0.71 AND abs(a.y - b.y) < 0.71
    WHERE d2(a.x, a.y, b.x, b.y) < 0.5
    GROUP BY a.id
  ),
  vel AS (                  -- direção desejada * velocidade
    SELECT b.id, b.x, b.y,
      (CASE WHEN b.d < 0.35 + b.escala * 0.3 THEN 0
            WHEN b.comportamento = 'distancia' AND b.d < 3.2 THEN -(b.jx - b.x) / b.d
            WHEN b.comportamento = 'distancia' AND b.d < 5.5 THEN -(b.jy - b.y) / b.d * CASE WHEN b.id % 2 = 0 THEN 1 ELSE -1 END
            ELSE (b.ax - b.x) / (sqrt(d2(b.ax, b.ay, b.x, b.y)) + 1e-9) END
       + COALESCE(s.sx, 0) + sin(b.t * 4 + b.id) * b.zigue) * b.vel * _ei.dt_ini AS vx,
      (CASE WHEN b.d < 0.35 + b.escala * 0.3 THEN 0
            WHEN b.comportamento = 'distancia' AND b.d < 3.2 THEN -(b.jy - b.y) / b.d
            WHEN b.comportamento = 'distancia' AND b.d < 5.5 THEN (b.jx - b.x) / b.d * CASE WHEN b.id % 2 = 0 THEN 1 ELSE -1 END
            ELSE (b.ay - b.y) / (sqrt(d2(b.ax, b.ay, b.x, b.y)) + 1e-9) END
       + COALESCE(s.sy, 0) + cos(b.t * 4 + b.id) * b.zigue) * b.vel * _ei.dt_ini AS vy
    FROM base b LEFT JOIN sep s ON s.id = b.id CROSS JOIN entrada _ei
  ),
  -- passo máximo 0,6 (a separação entre vizinhos podia dar trancos enormes)
  c AS (SELECT v.id, v.x, v.y, v.vx * k AS vx, v.vy * k AS vy, g.bl, NOT corpo_r(g.bl, v.x, v.y, 0.18) AS preso
        FROM (SELECT *, least(1, 0.6 / greatest(1e-9, sqrt(vx * vx + vy * vy))) AS k FROM vel) v, grade_lista g)
  -- o CORPO do inimigo (quadrado de 0,36) cabe no destino (diagonal / só X / só Y)?
  SELECT c.id, c.x, c.y, c.vx, c.vy,
         corpo_r(c.bl, c.x + c.vx, c.y + c.vy, 0.18) OR (c.preso AND centro_livre(c.bl, c.x + c.vx, c.y + c.vy)) AS ld,
         corpo_r(c.bl, c.x + c.vx, c.y, 0.18)        OR (c.preso AND centro_livre(c.bl, c.x + c.vx, c.y))        AS lx,
         corpo_r(c.bl, c.x, c.y + c.vy, 0.18)        OR (c.preso AND centro_livre(c.bl, c.x, c.y + c.vy))        AS ly
  FROM c
) m, entrada _e
WHERE inimigo.id = m.id;
