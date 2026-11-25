-- HONK! — jogo/sql/menus/dificuldade.sql
-- escolher a dificuldade ({d} = 1 Fácil, 2 Normal, 3 Difícil)

UPDATE config SET dificuldade = least(3, greatest(1, {d}))::INTEGER;
