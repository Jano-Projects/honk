-- HONK! — jogo/sql/eventos/ev-limpa.sql
-- onda limpa: cura (tabela BALANÇO) e oferece 3 cartas. O jogo não tem fim: depois do
--     chefe do Aeroporto o ganso volta ao Parque num ciclo novo (ver sql-escolher).

-- sorteia 3 cartas diferentes (as raras saem menos), só entre as que ainda não chegaram no limite
DELETE FROM oferta WHERE (SELECT estado FROM jogador) = 'vivo';
INSERT INTO oferta
SELECT row_number() OVER ()::INTEGER, id FROM (
  SELECT c.id FROM carta c LEFT JOIN pegas p ON p.efeito = c.efeito, jogador j, config cf
  WHERE j.estado = 'vivo' AND j.proxima IS NULL AND j.onda > 0 AND NOT EXISTS (SELECT 1 FROM inimigo)
    AND COALESCE(p.n, 0) < c.max_vezes
  ORDER BY CASE WHEN cf.diario > 0 THEN (hash(c.id, j.onda, cf.diario) % 100000) / 100000.0 ELSE random() END
           * CASE WHEN c.rara THEN 2.2 ELSE 1 END LIMIT 3);
UPDATE jogador SET estado = 'escolha', vida = least(vida_max, vida + round(vida_max * (SELECT cura_onda FROM b))::INTEGER), feliz = 1.5
WHERE estado = 'vivo' AND proxima IS NULL AND onda > 0 AND NOT EXISTS (SELECT 1 FROM inimigo);
INSERT INTO log SELECT nextval('seq_log'), r.t, 'Onda limpa. O ódio cresce: escolha um poder.' FROM jogador j, relogio r WHERE j.estado = 'escolha';
