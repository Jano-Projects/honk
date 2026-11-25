-- HONK! — jogo/sql/eventos/ev-proj.sql
-- projéteis voando: batem em paredes, no ganso ou nos inimigos

UPDATE projetil SET x = x + vx * _e.dt, y = y + vy * _e.dt, vida = vida - _e.dt FROM entrada _e;
INSERT INTO efeito SELECT nextval('seq_efeito'), p.x, p.y, 'poeira', r.t FROM projetil p, relogio r
WHERE EXISTS (SELECT 1 FROM mapa m WHERE m.x = floor(p.x) AND m.y = floor(p.y));
DELETE FROM projetil WHERE vida <= 0
   OR EXISTS (SELECT 1 FROM mapa m WHERE m.x = floor(projetil.x) AND m.y = floor(projetil.y));

-- acertou o ganso
DELETE FROM acerto_ganso;
INSERT INTO acerto_ganso
SELECT p.id, p.dano, p.nome FROM projetil p, jogador j
WHERE p.dono = 'inimigo' AND j.estado = 'vivo' AND j.esquiva <= 0 AND d2(p.x, p.y, j.x, j.y) < 0.4 * 0.4;   -- na esquiva, passa direto
INSERT INTO log SELECT nextval('seq_log'), r.t, a.nome || ' te acertou de longe (-' || a.dano || ')' FROM acerto_ganso a, relogio r;
INSERT INTO efeito SELECT nextval('seq_efeito'), j.x, j.y, 'golpe', r.t FROM jogador j, relogio r WHERE EXISTS (SELECT 1 FROM acerto_ganso);
INSERT INTO estat SELECT 'levou:' || nome, count(*) FROM acerto_ganso GROUP BY nome ON CONFLICT (chave) DO UPDATE SET n = estat.n + excluded.n;
INSERT INTO estat SELECT 'dano_recebido', round(sum(a.dano) * max(j.couro))::INTEGER FROM acerto_ganso a, jogador j HAVING count(*) > 0
ON CONFLICT (chave) DO UPDATE SET n = estat.n + excluded.n;
UPDATE jogador SET vida = vida - round((SELECT sum(dano) FROM acerto_ganso) * couro)::INTEGER, dor = 0.3 WHERE EXISTS (SELECT 1 FROM acerto_ganso);
DELETE FROM projetil WHERE id IN (SELECT id FROM acerto_ganso);

-- penas do ganso acertaram inimigos
DELETE FROM acerto_pena;
INSERT INTO acerto_pena
SELECT p.id AS pid, arg_min(i.id, d2(p.x, p.y, i.x, i.y)) AS iid, p.dano
FROM projetil p JOIN inimigo i ON d2(p.x, p.y, i.x, i.y) < (0.3 + i.escala * 0.3) * (0.3 + i.escala * 0.3)
WHERE p.dono = 'ganso' GROUP BY p.id, p.dano;
UPDATE inimigo SET vida = vida - a.total, flash = 0.15
FROM (SELECT iid, sum(dano) AS total FROM acerto_pena GROUP BY iid) a WHERE inimigo.id = a.iid;
INSERT INTO flutua SELECT nextval('seq_flutua'), i.x, i.y, a.dano::VARCHAR, '#c8f0ff', r.t
FROM acerto_pena a JOIN inimigo i ON i.id = a.iid, relogio r;
DELETE FROM projetil WHERE id IN (SELECT pid FROM acerto_pena);
DELETE FROM flutua WHERE t0 < (SELECT t FROM relogio) - 1.0;
DELETE FROM efeito WHERE t0 < (SELECT t FROM relogio) - 1.0;
