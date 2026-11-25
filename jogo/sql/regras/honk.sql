-- HONK! — jogo/sql/regras/honk.sql
-- HONK: dano em área e empurrão forte.

INSERT INTO log SELECT nextval('seq_log'), r.t, 'HONK!!!' FROM jogador j, relogio r WHERE j.estado = 'vivo' AND j.honk_cd <= 0;
INSERT INTO efeito SELECT nextval('seq_efeito'), j.x, j.y, 'honk', r.t FROM jogador j, relogio r WHERE j.estado = 'vivo' AND j.honk_cd <= 0;

DELETE FROM golpe;
INSERT INTO golpe
SELECT i.id, i.x, i.y, round(j.dano_honk * j.furia * (SELECT dano_jog FROM ev))::INTEGER AS dano, false AS critico,
       i.x + (i.x - j.x) / d * 1.5 / greatest(1, i.escala) AS nx,
       i.y + (i.y - j.y) / d * 1.5 / greatest(1, i.escala) AS ny
FROM inimigo i, jogador j, LATERAL (SELECT sqrt(d2(i.x, i.y, j.x, j.y)) + 1e-9 AS d)
WHERE j.estado = 'vivo' AND j.honk_cd <= 0 AND d < j.honk_raio;

UPDATE inimigo SET
  vida = inimigo.vida - g.dano, flash = 0.25,
  x = CASE WHEN empurra_ok(gl.bl, inimigo.x, inimigo.y, g.nx, g.ny) OR empurra_ok(gl.bl, inimigo.x, inimigo.y, g.nx, inimigo.y) THEN g.nx ELSE inimigo.x END,
  y = CASE WHEN empurra_ok(gl.bl, inimigo.x, inimigo.y, g.nx, g.ny) THEN g.ny WHEN empurra_ok(gl.bl, inimigo.x, inimigo.y, g.nx, inimigo.y) THEN inimigo.y
           WHEN empurra_ok(gl.bl, inimigo.x, inimigo.y, inimigo.x, g.ny) THEN g.ny ELSE inimigo.y END
FROM golpe g, grade_lista gl WHERE inimigo.id = g.id;

INSERT INTO flutua SELECT nextval('seq_flutua'), g.x, g.y, g.dano::VARCHAR, '#ffb763', r.t FROM golpe g, relogio r;
-- o HONK também desvia projéteis inimigos próximos
DELETE FROM projetil WHERE dono = 'inimigo'
  AND d2(x, y, (SELECT x FROM jogador), (SELECT y FROM jogador)) < 4 AND (SELECT honk_cd FROM jogador) <= 0;

-- combo Grito Espinhento: anel de 8 penas
INSERT INTO projetil
SELECT nextval('seq_proj'), 'ganso', 'pena', j.x + cos(q.k * pi() / 4) * 0.3, j.y + sin(q.k * pi() / 4) * 0.3,
       cos(q.k * pi() / 4) * 8, sin(q.k * pi() / 4) * 8, round((2 + j.espinhos) * j.furia)::INTEGER, 0.9, 'Pena'
FROM jogador j, range(8) q(k) WHERE j.estado = 'vivo' AND j.honk_cd <= 0 AND tem_combo('grito', 'espinhos');
INSERT INTO estat SELECT 'honks', 1 FROM jogador WHERE estado = 'vivo' AND honk_cd <= 0 ON CONFLICT (chave) DO UPDATE SET n = estat.n + excluded.n;
UPDATE jogador SET honk_cd = honk_recarga, honk_anim = 0.6 WHERE estado = 'vivo' AND honk_cd <= 0;
