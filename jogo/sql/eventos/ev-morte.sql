-- HONK! — jogo/sql/eventos/ev-morte.sql
-- o ganso caiu: as migalhas vão para o ninho (roguelite)

INSERT INTO log SELECT nextval('seq_log'), r.t, 'O ÓDIO ACABOU NA ONDA ' || ((j.onda - 1) % 25 + 1) || ' DO CICLO ' || j.ciclo FROM jogador j, relogio r
WHERE j.estado = 'vivo' AND j.vida <= 0;
UPDATE ninho SET moedas = moedas + j.migalhas, partidas = partidas + 1, recorde = greatest(recorde, j.onda)
FROM jogador j WHERE j.estado = 'vivo' AND j.vida <= 0;
UPDATE jogador SET estado = 'morto', vida = 0 WHERE estado = 'vivo' AND vida <= 0;
DELETE FROM projetil;
