-- HONK! — jogo/sql/esquema/05-penas-de-ouro.sql
-- ---------- PENAS DE OURO: a loja que nunca acaba ----------
-- Só se ganha a partir do 2º ciclo (chefes derrotados e ciclos completados). As melhorias
-- não têm limite, mas são pequenas: ficam sempre um passo atrás do x1,5 de cada ciclo.
-- Os inimigos medem a força do ganso pela loja comum e pelas cartas, NÃO pelo ouro:
-- por isso o ouro é a vantagem que fica de verdade.
CREATE TABLE loja_ouro (idx INTEGER, item VARCHAR, nome VARCHAR, descricao VARCHAR, preco_base INTEGER, nivel INTEGER);
INSERT INTO loja_ouro VALUES
 (1, 'furia', 'Fúria Dourada', '+4% de todo o dano que você causa',  2, 0),
 (2, 'couro', 'Couro Dourado', '-3% do dano que você recebe',          2, 0),
 (3, 'gula',  'Bico de Ouro',  '+5% de migalhas',                      2, 0);
-- no DESAFIO DO DIA todo mundo começa igual: as lojas não valem
CREATE VIEW loja_ativa AS SELECT item, CASE WHEN (SELECT diario FROM config) > 0 THEN 0 ELSE nivel END AS nivel FROM loja;
CREATE VIEW ouro_ativo AS SELECT item, CASE WHEN (SELECT diario FROM config) > 0 THEN 0 ELSE nivel END AS nivel FROM loja_ouro;


