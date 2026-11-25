-- HONK! — jogo/sql/esquema/00-cabecalho.sql
-- =====================================================================
--     SQL 1: ESQUEMA, MUNDOS, BESTIÁRIO, CARTAS, LOJA, SPRITES
--     (roda uma vez ao carregar)
--     =====================================================================

-- IMPORTANTE: as consultas do jogo são PREPARADAS uma vez (ver o JavaScript).
-- O otimizador do DuckDB costuma usar as estatísticas dos dados do momento do
-- preparo (ex.: "estado só vale 'inicio'") e jogar fora filtros que, mais tarde,
-- passam a ser verdadeiros. Desligamos só essa otimização.
SET disabled_optimizers = 'statistics_propagation';

