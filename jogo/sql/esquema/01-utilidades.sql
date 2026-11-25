-- HONK! — jogo/sql/esquema/01-utilidades.sql
-- ---------- utilidades ----------
-- distância ao quadrado (evita sqrt quando só precisamos comparar)
CREATE MACRO d2(x1, y1, x2, y2) AS ((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2));

