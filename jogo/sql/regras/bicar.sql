-- HONK! — jogo/sql/regras/bicar.sql
-- BICAR: o inimigo mais próximo num cone à frente. Pode dar CRÍTICO.

-- sorteia UMA vez e guarda: o dano e o texto flutuante usam o mesmo sorteio
UPDATE jogador SET rolagem = random() WHERE estado = 'vivo' AND bico_cd <= 0;

DELETE FROM golpe;
INSERT INTO golpe
SELECT i.id, i.x, i.y,
       round(j.dano * j.furia * e.dano_jog
             * CASE WHEN j.rolagem < j.crit OR j.crit_garantido THEN (CASE WHEN tem_combo('aguia', 'pescoco') THEN 3 ELSE 2 END) ELSE 1 END)::INTEGER AS dano,
       j.rolagem < j.crit OR j.crit_garantido AS critico,
       i.x + (i.x - j.x) / d * 0.5 AS nx, i.y + (i.y - j.y) / d * 0.5 AS ny
FROM inimigo i, jogador j, grade_lista gl, ev e, LATERAL (SELECT sqrt(d2(i.x, i.y, j.x, j.y)) + 1e-9 AS d)
WHERE j.estado = 'vivo' AND j.bico_cd <= 0 AND i.vida > 0
  AND d < j.alcance + 0.2 + i.escala * 0.25 AND ve(gl.bl, j.x, j.y, i.x, i.y)
  AND ((i.x - j.x) * cos(j.ang) + (i.y - j.y) * sin(j.ang)) / d > 0.6      -- está à frente? (cone de ~53°)
ORDER BY d LIMIT 1;

-- ÍMÃ DE MIRA: o ganso gira metade do caminho até o alvo (no máximo 0,3 rad) — a bicada "puxa" para quem acertou
UPDATE jogador SET ang = ang + greatest(-0.3, least(0.3, atan2(sin(m.da), cos(m.da)) * 0.5))
FROM (SELECT atan2(g.y - j.y, g.x - j.x) - j.ang AS da FROM golpe g, jogador j) m
WHERE estado = 'vivo';

UPDATE inimigo SET
  vida = inimigo.vida - g.dano, flash = 0.15,
  x = CASE WHEN empurra_ok(gl.bl, inimigo.x, inimigo.y, g.nx, g.ny) OR empurra_ok(gl.bl, inimigo.x, inimigo.y, g.nx, inimigo.y) THEN g.nx ELSE inimigo.x END,
  y = CASE WHEN empurra_ok(gl.bl, inimigo.x, inimigo.y, g.nx, g.ny) THEN g.ny WHEN empurra_ok(gl.bl, inimigo.x, inimigo.y, g.nx, inimigo.y) THEN inimigo.y
           WHEN empurra_ok(gl.bl, inimigo.x, inimigo.y, inimigo.x, g.ny) THEN g.ny ELSE inimigo.y END
FROM golpe g, grade_lista gl WHERE inimigo.id = g.id;

INSERT INTO efeito SELECT nextval('seq_efeito'), g.x, g.y, 'golpe', r.t FROM golpe g, relogio r;
INSERT INTO flutua SELECT nextval('seq_flutua'), g.x, g.y,
       CASE WHEN g.critico THEN 'CRÍTICO ' || g.dano ELSE g.dano::VARCHAR END,
       CASE WHEN g.critico THEN '#ffd35a' ELSE '#ffffff' END, r.t
FROM golpe g, relogio r;

-- acertou: gasta o crítico garantido; combo Mordida Vampira cura 1
UPDATE jogador SET crit_garantido = false,
       vida = CASE WHEN tem_combo('bico', 'vampiro') THEN least(vida_max, vida + 1) ELSE vida END
WHERE EXISTS (SELECT 1 FROM golpe);
INSERT INTO estat SELECT 'bicadas', 1 FROM golpe ON CONFLICT (chave) DO UPDATE SET n = estat.n + excluded.n;
INSERT INTO estat SELECT 'criticos', 1 FROM golpe WHERE critico ON CONFLICT (chave) DO UPDATE SET n = estat.n + excluded.n;
UPDATE jogador SET bico_cd = 0.33, bico_anim = 0.18 WHERE estado = 'vivo' AND bico_cd <= 0;
