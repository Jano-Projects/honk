-- HONK! — jogo/sql/esquema/10-combos.sql
-- ---------- COMBOS: duas cartas juntas liberam um efeito extra ----------
CREATE TABLE combo (a VARCHAR, b VARCHAR, nome VARCHAR, descricao VARCHAR);
INSERT INTO combo VALUES
 ('grito',  'espinhos', 'Grito Espinhento',  'O HONK também dispara um anel de 8 penas.'),
 ('bico',   'vampiro',  'Mordida Vampira',   'Toda bicada que acerta cura 1 de vida.'),
 ('pes',    'folego',   'Pernas de Fuga',    'A esquiva recarrega em 0,5 s.'),
 ('aguia',  'pescoco',  'Bote do Predador',  'Crítico causa o triplo de dano.'),
 ('vida',   'espinhos', 'Couraça de Espinhos','Espinhos causam o triplo de dano.');
CREATE MACRO tem_combo(ca, cb) AS ((SELECT count(DISTINCT efeito) FROM pegas WHERE efeito IN (ca, cb)) = 2);

