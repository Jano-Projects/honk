-- HONK! — jogo/sql/regras/mover.sql
-- =====================================================================
--     SQL 4: MOVER O GANSO  ({fwd}, {lado}, {giro}, {corre}, {dt} vêm da entrada)
--     Colisão: tenta a diagonal, depois só X, depois só Y (desliza na parede).
--     =====================================================================

UPDATE jogador SET ang = ang + _e.giro FROM entrada _e WHERE estado = 'vivo';

-- tenta mover na diagonal; se bater, tenta só em X; senão, só em Y (desliza rente à parede)
-- ld/lx/ly = o corpo inteiro cabe no destino (diagonal / só X / só Y)?
-- "preso" = o corpo já está encostando numa parede (nascimento, versão antiga): aí basta o centro estar livre
UPDATE jogador SET
  x = CASE WHEN d.ld OR d.lx THEN jogador.x + d.dx ELSE jogador.x END,
  y = CASE WHEN d.ld THEN jogador.y + d.dy WHEN d.lx THEN jogador.y WHEN d.ly THEN jogador.y + d.dy ELSE jogador.y END,
  passo = passo + CASE WHEN d.ld THEN abs(d.dx) + abs(d.dy) WHEN d.lx THEN abs(d.dx) WHEN d.ly THEN abs(d.dy) ELSE 0 END
FROM (
  SELECT c.dx, c.dy,
         corpo_livre(c.bl, c.x + c.dx, c.y + c.dy) OR (c.preso AND centro_livre(c.bl, c.x + c.dx, c.y + c.dy)) AS ld,
         corpo_livre(c.bl, c.x + c.dx, c.y)        OR (c.preso AND centro_livre(c.bl, c.x + c.dx, c.y))        AS lx,
         corpo_livre(c.bl, c.x, c.y + c.dy)        OR (c.preso AND centro_livre(c.bl, c.x, c.y + c.dy))        AS ly
  FROM (SELECT x, y, bl, dx * k AS dx, dy * k AS dy, NOT corpo_livre(bl, x, y) AS preso
        FROM (SELECT *, least(1, 0.9 / greatest(1e-9, sqrt(dx * dx + dy * dy))) AS k      -- passo máximo 0,9: o corpo (0,48) nunca pula uma parede de 1
        FROM (SELECT x, y,
                     (cos(ang) * _e.fwd - sin(ang) * _e.lado) * vel * (1 + 0.45 * _e.corre) * _e.dt
                       + CASE WHEN esquiva > 0 THEN esq_x * vel * 3.0 * least(_e.dt, esquiva) ELSE 0 END AS dx,   -- esquiva: arrancada (least: mesma distância em qualquer máquina)
                     (sin(ang) * _e.fwd + cos(ang) * _e.lado) * vel * (1 + 0.45 * _e.corre) * _e.dt
                       + CASE WHEN esquiva > 0 THEN esq_y * vel * 3.0 * least(_e.dt, esquiva) ELSE 0 END AS dy, bl
              FROM (SELECT jj.* REPLACE (jj.vel * e.vel_jog AS vel) FROM jogador jj, ev e) jogador, grade_lista, entrada _e))) c
) d
WHERE estado = 'vivo';
