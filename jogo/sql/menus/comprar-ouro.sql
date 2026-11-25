-- HONK! — jogo/sql/menus/comprar-ouro.sql
-- comprar na loja do ninho ({idx} = número do item)

DELETE FROM compra;
INSERT INTO compra SELECT l.idx, l.preco_base + l.nivel FROM loja_ouro l, ninho n, jogador j
WHERE l.idx = {idx} AND n.ouro >= l.preco_base + l.nivel AND j.estado <> 'vivo';
UPDATE ninho SET ouro = ouro - (SELECT preco FROM compra) WHERE EXISTS (SELECT 1 FROM compra);
UPDATE loja_ouro SET nivel = nivel + 1 WHERE idx IN (SELECT idx FROM compra);
