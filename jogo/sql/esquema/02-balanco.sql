-- HONK! — jogo/sql/esquema/02-balanco.sql
-- ---------- BALANÇO: os botões de ajuste do jogo, num lugar só ----------
-- Mude os números aqui para deixar o jogo mais fácil ou mais difícil.
--   vida_ini / dano_ini   multiplicam a vida e o dano de TODOS os inimigos
--   cresc_vida / dano     quanto os inimigos crescem a cada onda (1.07 = +7%)
--   mult_migalhas         multiplica o dinheiro ganho
--   cura_onda             fração da vida recuperada ao limpar uma onda
CREATE TABLE balanco (id INTEGER, nome VARCHAR, vida_ini DOUBLE, dano_ini DOUBLE, cresc_vida DOUBLE, cresc_dano DOUBLE,
                      mult_migalhas DOUBLE, cura_onda DOUBLE);
INSERT INTO balanco VALUES
 (1, 'Fácil',   0.75, 0.70, 1.035, 1.025, 1.0, 0.35),
 (2, 'Normal',  1.00, 1.00, 1.050, 1.035, 1.0, 0.20),
 (3, 'Difícil', 1.20, 1.25, 1.065, 1.045, 1.3, 0.10);
CREATE TABLE config AS SELECT 2 AS dificuldade,
  1.6::DOUBLE AS camera_dist,   -- câmera: 1.6 = terceira pessoa (atrás do ganso); 0 = primeira pessoa
  0 AS diario;                  -- DESAFIO DO DIA: AAAAMMDD do dia (0 = partida normal)
CREATE VIEW b AS SELECT balanco.* FROM balanco JOIN config ON balanco.id = config.dificuldade;

