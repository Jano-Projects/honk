-- HONK! — jogo/sql/eventos/ev-mortos.sql
-- inimigos derrotados: pagam migalhas (com bônus), curam o vampiro e somem

INSERT INTO log SELECT nextval('seq_log'), r.t, i.nome || ' derrotado!' FROM inimigo i, relogio r WHERE i.vida <= 0;
INSERT INTO efeito SELECT nextval('seq_efeito'), i.x, i.y, 'morte', r.t FROM inimigo i, relogio r WHERE i.vida <= 0;
DELETE FROM efeito WHERE t0 < (SELECT t FROM relogio) - 1.0;
INSERT INTO flutua SELECT nextval('seq_flutua'), i.x, i.y,
       '+' || round(i.recompensa * j.mult_migalhas * b.mult_migalhas * e.mig)::INTEGER, '#ffd35a', r.t
FROM inimigo i, jogador j, relogio r, b, ev e WHERE i.vida <= 0 AND i.recompensa > 0;
-- chefe derrotado a partir do 2º ciclo vale Penas de Ouro (ciclo - 1 cada)
UPDATE ninho SET ouro = ouro + (SELECT count(*) * (max(j.ciclo) - 1) FROM inimigo i, jogador j
                                WHERE i.vida <= 0 AND j.ciclo > 1 AND i.tipo IN (SELECT tipo FROM tipo_inimigo WHERE chefe));
INSERT INTO estat SELECT 'abate:' || tipo, count(*) FROM inimigo WHERE vida <= 0 GROUP BY tipo
ON CONFLICT (chave) DO UPDATE SET n = estat.n + excluded.n;
UPDATE jogador SET
  migalhas = migalhas + (SELECT COALESCE(round(sum(recompensa) * jogador.mult_migalhas * (SELECT mult_migalhas FROM b) * (SELECT mig FROM ev)), 0)::INTEGER
                         FROM inimigo WHERE vida <= 0),
  abates   = abates   + (SELECT count(*) FROM inimigo WHERE vida <= 0),
  vida     = least(vida_max, vida + vampiro * (SELECT count(*) FROM inimigo WHERE vida <= 0)),
  feliz    = 0.7;
DELETE FROM inimigo WHERE vida <= 0;
DELETE FROM flutua WHERE t0 < (SELECT t FROM relogio) - 1.0;
