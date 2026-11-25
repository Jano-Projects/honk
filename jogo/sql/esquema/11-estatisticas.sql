-- HONK! — jogo/sql/esquema/11-estatisticas.sql
-- ---------- ESTATÍSTICAS da partida (para o placar engraçado do fim) ----------
CREATE TABLE estat (chave VARCHAR PRIMARY KEY, n INTEGER);
CREATE TABLE quase (id INTEGER);   -- ataques que passaram raspando na esquiva
