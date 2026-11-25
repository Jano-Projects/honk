-- HONK! — jogo/sql/regras/reiniciar.sql
-- =====================================================================
--     SQL 3: REINICIAR PARTIDA  -  monta o ganso com as melhorias da LOJA
--     =====================================================================

DELETE FROM inimigo;
DELETE FROM log;
DELETE FROM oferta;
UPDATE jogador SET
  mundo = 1,
  x = (SELECT x + 0.5 FROM celula WHERE mundo = 1 AND ch = 'G'),
  y = (SELECT y + 0.5 FROM celula WHERE mundo = 1 AND ch = 'G'),
  ang = -pi()/2,
  vida_max     = 30 + 8 * (SELECT nivel FROM loja_ativa WHERE item = 'penas'),
  vida         = 30 + 8 * (SELECT nivel FROM loja_ativa WHERE item = 'penas'),
  dano         = 3 + (SELECT nivel FROM loja_ativa WHERE item = 'bico'),
  alcance = 1.4, crit = 0.08,
  dano_honk    = 2 + (SELECT nivel FROM loja_ativa WHERE item = 'pulmao'),
  honk_raio    = 4.0 + 0.3 * (SELECT nivel FROM loja_ativa WHERE item = 'pulmao'),
  honk_recarga = 4.0, penas = 0,
  vel          = 3.0 * (1 + 0.06 * (SELECT nivel FROM loja_ativa WHERE item = 'asas')),
  vampiro = 0, espinhos = 0,
  mult_migalhas = (1 + 0.2 * (SELECT nivel FROM loja_ativa WHERE item = 'gula')) * (1 + 0.05 * (SELECT nivel FROM ouro_ativo WHERE item = 'gula')),
  furia = 1 + 0.04 * (SELECT nivel FROM ouro_ativo WHERE item = 'furia'),
  couro = pow(0.97, (SELECT nivel FROM ouro_ativo WHERE item = 'couro')),
  evento = CASE WHEN (SELECT diario FROM config) > 0 THEN 1 + (SELECT diario FROM config) % 5 ELSE 0 END,
  perfeita = 0, crit_garantido = false,
  onda = 0, migalhas = 0, abates = 0,
  bico_cd = 0, honk_cd = 0, pena_cd = 0, bico_anim = 0, honk_anim = 0, dor = 0, feliz = 0, esquiva = 0, esquiva_cd = 0,
  estado = 'vivo', infinito = false, ciclo = 1,
  proxima    = (SELECT t FROM relogio) + 2.5,
  titulo_ate = (SELECT t FROM relogio) + 2.5;
DELETE FROM pegas;
DELETE FROM estat;
INSERT INTO log SELECT nextval('seq_log'), t, 'Um ganso acordou com ódio. Alguém vai pagar.' FROM relogio;
