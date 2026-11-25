-- HONK! — jogo/sql/menus/restaurar.sql
-- restaurar o save (números vindos do navegador, já validados)

UPDATE ninho SET moedas = {moedas}, partidas = {partidas}, recorde = {recorde}, vitorias = {vitorias}, ouro = {ouro};
UPDATE loja_ouro SET nivel = greatest(0, CASE idx WHEN 1 THEN {o1} WHEN 2 THEN {o2} WHEN 3 THEN {o3} END)::INTEGER;
UPDATE config SET dificuldade = least(3, greatest(1, {dif}))::INTEGER;
UPDATE loja SET nivel = least(nivel_max, greatest(0, CASE idx WHEN 1 THEN {l1} WHEN 2 THEN {l2} WHEN 3 THEN {l3}
                                                             WHEN 4 THEN {l4} WHEN 5 THEN {l5} END))::INTEGER;
