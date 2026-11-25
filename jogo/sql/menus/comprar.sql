-- HONK! — jogo/sql/menus/comprar.sql
DELETE FROM compra;
INSERT INTO compra
SELECT l.idx, l.preco_base * (l.nivel + 1) AS preco
FROM loja l, ninho n, jogador j
WHERE l.idx = {idx} AND l.nivel < l.nivel_max AND n.moedas >= l.preco_base * (l.nivel + 1) AND j.estado <> 'vivo';
UPDATE ninho SET moedas = moedas - (SELECT preco FROM compra) WHERE EXISTS (SELECT 1 FROM compra);
UPDATE loja SET nivel = nivel + 1 WHERE idx IN (SELECT idx FROM compra);
