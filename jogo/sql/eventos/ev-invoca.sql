-- HONK! — jogo/sql/eventos/ev-invoca.sql
-- invocação: chefes e a Senhora do Alpiste chamam reforços (máx. 14 inimigos)

INSERT INTO log SELECT nextval('seq_log'), r.t, i.nome || ' chamou reforços!'
FROM inimigo i, relogio r WHERE i.invoca IS NOT NULL AND i.invoca_cd <= 0 AND (SELECT count(*) FROM inimigo) < 14;
INSERT INTO inimigo
SELECT nextval('seq_inimigo'), t.tipo, t.nome,
       CASE WHEN corpo_r(gl.bl, r.rx, r.ry, 0.18) THEN r.rx ELSE i.x END,     -- reforço nunca nasce dentro da parede
       CASE WHEN corpo_r(gl.bl, r.rx, r.ry, 0.18) THEN r.ry ELSE i.y END,
       round(t.vida * b.vida_ini)::INTEGER, round(t.vida * b.vida_ini)::INTEGER, ceil(t.dano * b.dano_ini)::INTEGER,
       t.vel, t.escala, t.voa, 0, 0.8, 0, t.frase, t.comportamento, t.zigue,
       t.projetil, t.cd_tiro, t.alcance, t.cd_tiro, NULL, 0, 0
FROM inimigo i JOIN tipo_inimigo t ON t.tipo = i.invoca, b, grade_lista gl,
     LATERAL (SELECT i.x + (random() - 0.5) * 0.6 AS rx, i.y + (random() - 0.5) * 0.6 AS ry) r
WHERE i.invoca_cd <= 0 AND (SELECT count(*) FROM inimigo) < 14;
UPDATE inimigo SET invoca_cd = cd_invoca WHERE invoca IS NOT NULL AND invoca_cd <= 0;
