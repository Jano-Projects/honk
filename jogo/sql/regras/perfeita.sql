-- HONK! — jogo/sql/regras/perfeita.sql
-- ESQUIVA PERFEITA: roda só enquanto a esquiva está ativa. Se um ataque ia acertar o ganso
--     naquele instante (projétil colado ou mordida pronta), o tempo desacelera (a câmera lenta é
--     feita pelo JS lendo "perfeita") e a próxima bicada que acertar é crítico garantido.

DELETE FROM quase;
INSERT INTO quase
SELECT i.id FROM inimigo i, jogador j, grade_lista gl
WHERE j.estado = 'vivo' AND j.esquiva > 0 AND i.cd <= 0 AND i.vida > 0
  AND d2(i.x, i.y, j.x, j.y) < (0.6 + i.escala * 0.3) * (0.6 + i.escala * 0.3) AND ve(gl.bl, i.x, i.y, j.x, j.y)
UNION ALL
SELECT -p.id FROM projetil p, jogador j
WHERE p.dono = 'inimigo' AND j.estado = 'vivo' AND j.esquiva > 0 AND d2(p.x, p.y, j.x, j.y) < 0.55 * 0.55;
INSERT INTO log SELECT nextval('seq_log'), r.t, 'ESQUIVA PERFEITA! A próxima bicada é crítico.'
FROM jogador j, relogio r WHERE j.perfeita <= 0 AND EXISTS (SELECT 1 FROM quase);
INSERT INTO estat SELECT 'perfeitas', 1 FROM jogador WHERE perfeita <= 0 AND EXISTS (SELECT 1 FROM quase)
ON CONFLICT (chave) DO UPDATE SET n = estat.n + excluded.n;
UPDATE jogador SET perfeita = 0.28, crit_garantido = true WHERE perfeita <= 0 AND EXISTS (SELECT 1 FROM quase);
UPDATE inimigo SET cd = 0.9 WHERE id IN (SELECT id FROM quase);            -- quem mordeu o vento perde a vez
DELETE FROM projetil WHERE -id IN (SELECT id FROM quase);                     -- e o projétil passa (some atrás)
