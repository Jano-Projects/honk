-- HONK! — jogo/sql/eventos/ev-ataque.sql
-- corpo a corpo: quem está colado no ganso e com a recarga pronta, ataca

DELETE FROM atacantes;
INSERT INTO atacantes
SELECT i.id, i.nome, i.frase, i.dano
FROM inimigo i, jogador j, grade_lista gl
WHERE j.estado = 'vivo' AND j.esquiva <= 0 AND i.cd <= 0 AND i.vida > 0
  AND d2(i.x, i.y, j.x, j.y) < (0.55 + i.escala * 0.3) * (0.55 + i.escala * 0.3)
  AND ve(gl.bl, i.x, i.y, j.x, j.y);                                    -- não morde através da parede

INSERT INTO log SELECT nextval('seq_log'), r.t, a.nome || ' ' || a.frase || ' (-' || a.dano || ')' FROM atacantes a, relogio r;
INSERT INTO efeito SELECT nextval('seq_efeito'), j.x, j.y, 'golpe', r.t FROM jogador j, relogio r WHERE EXISTS (SELECT 1 FROM atacantes);
INSERT INTO estat SELECT 'dano_recebido', round(sum(a.dano) * max(j.couro))::INTEGER FROM atacantes a, jogador j HAVING count(*) > 0
ON CONFLICT (chave) DO UPDATE SET n = estat.n + excluded.n;
UPDATE jogador SET dor = 0.3, vida = vida - round((SELECT sum(dano) FROM atacantes) * couro)::INTEGER
WHERE estado = 'vivo' AND EXISTS (SELECT 1 FROM atacantes);
-- recarga do atacante + espinhos (se o ganso tiver a carta; triplo com a Couraça de Espinhos)
UPDATE inimigo SET cd = 1.0, vida = vida - (SELECT espinhos * CASE WHEN tem_combo('vida', 'espinhos') THEN 3 ELSE 1 END FROM jogador),
                   flash = CASE WHEN (SELECT espinhos FROM jogador) > 0 THEN 0.12 ELSE flash END
WHERE id IN (SELECT id FROM atacantes);
