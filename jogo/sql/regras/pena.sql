-- HONK! — jogo/sql/regras/pena.sql
-- PENA (Q): lança penas em leque. Só com a carta "Penas Arremessáveis".

INSERT INTO projetil
SELECT nextval('seq_proj'), 'ganso', 'pena',
       j.x + cos(a) * 0.3, j.y + sin(a) * 0.3, cos(a) * 9, sin(a) * 9, round((2 + j.penas) * j.furia)::INTEGER, 1.4, 'Pena'
FROM jogador j, range(4) q(k),
     LATERAL (SELECT j.ang + (k - (j.penas - 1) / 2.0) * 0.13 AS a)
WHERE j.estado = 'vivo' AND j.penas > 0 AND j.pena_cd <= 0 AND k < j.penas;
UPDATE jogador SET pena_cd = 0.7 WHERE estado = 'vivo' AND penas > 0 AND pena_cd <= 0;
