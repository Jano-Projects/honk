-- HONK! — jogo/sql/esquema/06-cartas.sql
-- ---------- cartas de poder (escolhidas entre as ondas) ----------
-- max_vezes: quantas vezes a mesma carta pode ser pega numa partida. Quando tudo chega
-- no limite, o ganso não fica mais forte: daí em diante só a habilidade de quem joga segura.
CREATE TABLE carta (id INTEGER, efeito VARCHAR, nome VARCHAR, descricao VARCHAR, rara BOOLEAN, max_vezes INTEGER);
INSERT INTO carta VALUES
 ( 1, 'bico',     'Bico de Rancor',       '+2 de dano na bicada.',                                   false, 6),
 ( 2, 'vida',     'Couro Grosso',         '+10 de vida máxima e +10 de vida.',                       false, 6),
 ( 3, 'grito',    'Grito de Ódio',        'HONK: +2 de dano e +0,6 de raio.',                        false, 4),
 ( 4, 'folego',   'Pulmão Rancoroso',     'HONK recarrega 0,7 s mais rápido.',                       false, 3),
 ( 5, 'pescoco',  'Pescoço Comprido',     'Bicada alcança +0,4 mais longe.',                         false, 3),
 ( 6, 'vampiro',  'Gosto de Vingança',    'Cura 1 de vida a cada inimigo derrotado.',               false, 4),
 ( 7, 'pes',      'Pés de Pato Nervosos', '+12% de velocidade.',                                     false, 4),
 ( 8, 'espinhos', 'Penas Eriçadas',       'Quem te morde leva 2 de dano.',                           false, 4),
 ( 9, 'arremesso','Penas Arremessáveis',  'Aperte Q para lançar penas. Repetir a carta lança mais.', true,  4),
 (10, 'aguia',    'Olhar Assassino',      '+12% de chance de crítico (dano x2).',                    true,  4),
 (11, 'banho',    'Banho de Lago',        'Recupera metade da vida agora.',                          false, 99),
 (12, 'ganancia', 'Ganância',             '+25% de migalhas nesta partida.',                         false, 4);
CREATE TABLE pegas (efeito VARCHAR, n INTEGER);   -- cartas já pegas nesta partida
CREATE TABLE oferta (slot INTEGER, carta INTEGER);

