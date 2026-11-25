-- HONK! — jogo/sql/menus/escolher.sql
-- =====================================================================
--     SQL 8: ESCOLHER CARTA ({slot} = 1, 2 ou 3), MUDAR DE MUNDO, LOJA
--     =====================================================================

DELETE FROM escolhida;
INSERT INTO escolhida
SELECT c.* FROM oferta o JOIN carta c ON c.id = o.carta, jogador j WHERE o.slot = {slot} AND j.estado = 'escolha';

UPDATE jogador SET
  dano          = dano + CASE e.efeito WHEN 'bico' THEN 2 ELSE 0 END,
  vida_max      = vida_max + CASE e.efeito WHEN 'vida' THEN 10 ELSE 0 END,
  vida          = CASE e.efeito WHEN 'vida' THEN vida + 10
                                WHEN 'banho' THEN least(vida_max, vida + vida_max // 2) ELSE vida END,
  dano_honk     = dano_honk + CASE e.efeito WHEN 'grito' THEN 2 ELSE 0 END,
  honk_raio     = honk_raio + CASE e.efeito WHEN 'grito' THEN 0.6 ELSE 0 END,
  honk_recarga  = greatest(1.5, honk_recarga - CASE e.efeito WHEN 'folego' THEN 0.7 ELSE 0 END),
  alcance       = alcance + CASE e.efeito WHEN 'pescoco' THEN 0.4 ELSE 0 END,
  vampiro       = vampiro + CASE e.efeito WHEN 'vampiro' THEN 1 ELSE 0 END,
  vel           = vel * CASE e.efeito WHEN 'pes' THEN 1.12 ELSE 1 END,
  espinhos      = espinhos + CASE e.efeito WHEN 'espinhos' THEN 2 ELSE 0 END,
  penas         = least(4, penas + CASE e.efeito WHEN 'arremesso' THEN 1 ELSE 0 END),
  crit          = crit + CASE e.efeito WHEN 'aguia' THEN 0.12 ELSE 0 END,
  mult_migalhas = mult_migalhas + CASE e.efeito WHEN 'ganancia' THEN 0.25 ELSE 0 END
FROM escolhida e;

INSERT INTO log SELECT nextval('seq_log'), r.t, 'Poder: ' || e.nome FROM escolhida e, relogio r;
INSERT INTO pegas SELECT e.efeito, 0 FROM escolhida e WHERE NOT EXISTS (SELECT 1 FROM pegas p WHERE p.efeito = e.efeito);
UPDATE pegas SET n = n + 1 FROM escolhida e WHERE pegas.efeito = e.efeito;

-- fim do Aeroporto (onda 25 do ciclo): o ganso ainda está com ódio. Volta ao Parque num CICLO novo,
-- com um bônus de migalhas, e o ninho anota o maior ciclo já completado.
UPDATE ninho SET vitorias = greatest(vitorias, j.ciclo)
FROM jogador j WHERE j.estado = 'escolha' AND j.onda > 0 AND j.onda % 25 = 0 AND j.mundo = 5;
INSERT INTO log SELECT nextval('seq_log'), r.t, 'CICLO ' || (j.ciclo + 1) || ': O ÓDIO AUMENTOU. (+' || 50 * j.ciclo || ' migalhas)'
FROM jogador j, relogio r WHERE j.estado = 'escolha' AND j.onda > 0 AND j.onda % 25 = 0 AND j.mundo = 5;
UPDATE ninho SET ouro = ouro + 2 + j.ciclo
FROM jogador j WHERE j.estado = 'escolha' AND j.onda > 0 AND j.onda % 25 = 0 AND j.mundo = 5;
UPDATE jogador SET ciclo = ciclo + 1, migalhas = migalhas + 50 * ciclo,
  evento = CASE WHEN (SELECT diario FROM config) > 0 THEN 1 + (hash((SELECT diario FROM config), ciclo) % 5)::INTEGER
                ELSE 1 + floor(random() * 5)::INTEGER END
WHERE estado = 'escolha' AND onda > 0 AND onda % 25 = 0 AND mundo = 5;
INSERT INTO log SELECT nextval('seq_log'), r.t, 'Regra do ciclo: ' || e.nome || ' - ' || e.descricao
FROM ev e, relogio r, jogador j WHERE e.id > 0 AND j.estado = 'escolha' AND j.onda > 0 AND j.onda % 25 = 0;

-- fim de um mundo (5ª onda dele)? viaja para o próximo; depois do 5º, de volta ao 1º
UPDATE jogador SET
  mundo = CASE WHEN mundo >= 5 THEN 1 ELSE mundo + 1 END,
  x = (SELECT x + 0.5 FROM celula c WHERE c.mundo = CASE WHEN jogador.mundo >= 5 THEN 1 ELSE jogador.mundo + 1 END AND c.ch = 'G'),
  y = (SELECT y + 0.5 FROM celula c WHERE c.mundo = CASE WHEN jogador.mundo >= 5 THEN 1 ELSE jogador.mundo + 1 END AND c.ch = 'G'),
  ang = -pi()/2,
  titulo_ate = (SELECT t FROM relogio) + 3.0
WHERE estado = 'escolha' AND onda % 5 = 0;

-- segue o jogo (mesmo que, por algum motivo, não houvesse carta para escolher)
UPDATE jogador SET estado = 'vivo',
  proxima = (SELECT t FROM relogio) + CASE WHEN titulo_ate > (SELECT t FROM relogio) THEN 3.2 ELSE 1.5 END
WHERE estado = 'escolha';
DELETE FROM oferta;
