-- HONK! — jogo/sql/eventos/ev-tiro.sql
-- tiros: inimigos de distância com recarga pronta e o ganso no alcance

INSERT INTO projetil
SELECT nextval('seq_proj'), 'inimigo', i.projetil, i.x, i.y,
       (j.x - i.x) / d * 5.0, (j.y - i.y) / d * 5.0, i.dano, 3.0, i.nome
FROM inimigo i, jogador j, LATERAL (SELECT sqrt(d2(i.x, i.y, j.x, j.y)) + 1e-9 AS d)
WHERE j.estado = 'vivo' AND i.projetil IS NOT NULL AND i.tiro_cd <= 0 AND d < i.alcance;
UPDATE inimigo SET tiro_cd = cd_tiro * (0.8 + random() * 0.4)
FROM jogador j
WHERE j.estado = 'vivo' AND inimigo.projetil IS NOT NULL AND inimigo.tiro_cd <= 0
  AND d2(inimigo.x, inimigo.y, j.x, j.y) < inimigo.alcance * inimigo.alcance;
