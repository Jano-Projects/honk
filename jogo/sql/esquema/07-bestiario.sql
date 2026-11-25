-- HONK! — jogo/sql/esquema/07-bestiario.sql
-- ---------- bestiário ----------
-- comportamento: corpo (vem para cima) | distancia (mantém distância e atira)
-- zigue: quanto ziguezagueia; voa: altura do sprite; projetil/cd_tiro/alcance: tiro à distância
-- invoca/cd_invoca: chama reforços (chefes e a Senhora do Alpiste)
CREATE TABLE tipo_inimigo (tipo VARCHAR, nome VARCHAR, mundo INTEGER, vida INTEGER, dano INTEGER, vel DOUBLE, escala DOUBLE,
  voa DOUBLE, recompensa INTEGER, onda_min INTEGER, chefe BOOLEAN, frase VARCHAR, comportamento VARCHAR, zigue DOUBLE,
  projetil VARCHAR, cd_tiro DOUBLE, alcance DOUBLE, invoca VARCHAR, cd_invoca DOUBLE);
INSERT INTO tipo_inimigo VALUES
 ('pombo',      'Pombo',               1,   3, 1, 1.9, 0.45, 0,    1, 1, false, 'arrulhou ofensivamente',       'corpo',     0.8, NULL,     0,   0,  NULL,      0),
 ('crianca',    'Criança com pão',     1,   5, 1, 1.3, 0.80, 0,    2, 1, false, 'acertou um pão em você',       'distancia', 0.2, 'pao',    2.4, 6,  NULL,      0),
 ('cachorro',   'Cachorro salsicha',   1,   7, 2, 2.4, 0.50, 0,    3, 2, false, 'mordeu seu tornozelo',         'corpo',     0.3, NULL,     0,   0,  NULL,      0),
 ('senhora',    'Senhora do Alpiste',  1,  10, 1, 0.8, 0.82, 0,    5, 3, false, 'te deu uma bolsada',           'distancia', 0.1, NULL,     0,   0,  'pombo',   5.0),
 ('guarda',     'Guarda do Parque',    1,  40, 3, 1.0, 1.15, 0,   25, 5, true,  'te multou por ser um ganso',   'corpo',     0.1, 'multa',  1.8, 7,  NULL,      0),
 ('galinha',    'Galinha',             2,   4, 1, 2.1, 0.45, 0,    1, 1, false, 'cacarejou uma fofoca',         'corpo',     0.7, NULL,     0,   0,  NULL,      0),
 ('bode',       'Bode',                2,  11, 3, 1.7, 0.70, 0,    4, 1, false, 'te deu uma chifrada',          'corpo',     0.2, NULL,     0,   0,  NULL,      0),
 ('fazendeiro', 'Fazendeiro',          2,  12, 2, 1.0, 0.95, 0,    4, 2, false, 'jogou um ovo em você',         'distancia', 0.15,'ovo',    2.0, 7,  NULL,      0),
 ('corvo',      'Corvo',               2,   4, 1, 2.6, 0.45, 0.5,  2, 3, false, 'bicou sua cabeça',             'corpo',     0.9, NULL,     0,   0,  NULL,      0),
 ('espantalho', 'Espantalho',          2,  80, 4, 0.7, 1.35, 0,   45, 5, true,  'te encarou com olhos de botão','corpo',     0.05,NULL,     0,   0,  'corvo',   4.0),
 ('gato',       'Gato de rua',         3,   5, 1, 2.5, 0.45, 0,    2, 1, false, 'arranhou sua canela sem motivo','corpo',     0.6, NULL,     0,   0,  NULL,      0),
 ('feirante',   'Feirante',            3,  10, 2, 1.0, 0.92, 0,    4, 1, false, 'jogou um tomate em você',      'distancia', 0.15,'tomate', 2.0, 7,  NULL,      0),
 ('vovo',       'Vovó do carrinho',    3,  16, 3, 1.1, 0.80, 0,    5, 2, false, 'passou o carrinho no seu pé',  'corpo',     0.1, NULL,     0,   0,  NULL,      0),
 ('pasteleiro', 'Pasteleiro',          3,  12, 2, 1.2, 0.92, 0,    5, 3, false, 'te acertou um pastel de vento','distancia', 0.2, 'pastel', 1.9, 7,  NULL,      0),
 ('caminhao',   'CAMINHÃO DO GÁS',     3,  90, 4, 0.6, 2.00, 0,   70, 5, true,  'tocou Für Elise no seu ouvido','corpo',     0.0, 'botijao',2.3, 8,  'gato',    8.0),
 ('aspirador',  'Robô aspirador',      4,   6, 1, 2.4, 0.40, 0,    2, 1, false, 'aspirou suas penas',           'corpo',     0.5, NULL,     0,   0,  NULL,      0),
 ('promotor',   'Promotor de cartão',  4,  11, 2, 1.1, 0.92, 0,    4, 1, false, 'te ofereceu cartão sem anuidade','distancia',0.2, 'panfleto',1.8,7,  NULL,      0),
 ('mascote',    'Mascote de pelúcia',  4,  22, 3, 1.0, 1.00, 0,    6, 2, false, 'te deu um abraço à força',     'corpo',     0.1, NULL,     0,   0,  NULL,      0),
 ('patinete',   'Moleque de patinete', 4,   9, 2, 2.7, 0.85, 0,    5, 3, false, 'passou por cima de você',      'corpo',     0.25,NULL,     0,   0,  NULL,      0),
 ('noel',       'PAPAI NOEL DO SHOPPING',4,100,4, 0.7, 1.60, 0,   90, 5, true,  'perguntou se você foi um bom ganso','corpo', 0.05,'presente',2.3,8,  'aspirador',9.0),
 ('drone',      'Drone',               5,   8, 2, 2.0, 0.50, 0.55, 4, 1, false, 'te acertou um laser',          'distancia', 0.4, 'raio',   1.8, 7,  NULL,      0),
 ('carrinho',   'Carrinho de bagagem', 5,  14, 3, 2.5, 0.70, 0,    5, 1, false, 'te atropelou',                 'corpo',     0.1, NULL,     0,   0,  NULL,      0),
 ('controlador','Controlador de voo',  5,  12, 2, 1.0, 0.90, 0,    5, 2, false, 'carimbou NEGADO na sua testa', 'distancia', 0.15,'negado', 1.7, 7,  NULL,      0),
 ('seguranca',  'Segurança',           5,  18, 3, 1.4, 0.95, 0,    6, 3, false, 'te revistou com força',        'corpo',     0.15,NULL,     0,   0,  NULL,      0),
 ('airbus',     'AIRBUS A320',         5, 140, 4, 0.45,2.30, 0.1,120, 5, true,  'ligou as turbinas na sua cara','corpo',     0.0, 'mala',   1.8, 8,  'carrinho',7.0);

CREATE SEQUENCE seq_inimigo;
CREATE TABLE inimigo (id INTEGER, tipo VARCHAR, nome VARCHAR, x DOUBLE, y DOUBLE, vida INTEGER, vida_max INTEGER, dano INTEGER,
  vel DOUBLE, escala DOUBLE, voa DOUBLE, recompensa INTEGER, cd DOUBLE, flash DOUBLE, frase VARCHAR, comportamento VARCHAR,
  zigue DOUBLE, projetil VARCHAR, cd_tiro DOUBLE, alcance DOUBLE, tiro_cd DOUBLE, invoca VARCHAR, cd_invoca DOUBLE, invoca_cd DOUBLE);

CREATE SEQUENCE seq_proj;
CREATE TABLE projetil (id INTEGER, dono VARCHAR, tipo VARCHAR, x DOUBLE, y DOUBLE, vx DOUBLE, vy DOUBLE, dano INTEGER, vida DOUBLE, nome VARCHAR);

-- EFEITOS para animar: golpe, morte, honk, poeira (o JS desenha; o SQL decide quando e onde)
CREATE SEQUENCE seq_efeito;
CREATE TABLE efeito (id INTEGER, x DOUBLE, y DOUBLE, tipo VARCHAR, t0 DOUBLE);

-- números que sobem quando alguém leva dano
CREATE SEQUENCE seq_flutua;
CREATE TABLE flutua (id INTEGER, x DOUBLE, y DOUBLE, texto VARCHAR, cor VARCHAR, t0 DOUBLE);

CREATE SEQUENCE seq_log;
CREATE TABLE log (id INTEGER, t DOUBLE, texto VARCHAR);

-- tabelas de trabalho (rascunho de um único quadro): guardam um resultado
-- intermediário para várias instruções usarem o mesmo valor
CREATE TABLE golpe (id INTEGER, x DOUBLE, y DOUBLE, dano INTEGER, critico BOOLEAN, nx DOUBLE, ny DOUBLE);
CREATE TABLE atacantes (id INTEGER, nome VARCHAR, frase VARCHAR, dano INTEGER);
CREATE TABLE acerto_ganso (id INTEGER, dano INTEGER, nome VARCHAR);
CREATE TABLE acerto_pena (pid INTEGER, iid INTEGER, dano INTEGER);
CREATE TABLE escolhida (id INTEGER, efeito VARCHAR, nome VARCHAR, descricao VARCHAR, rara BOOLEAN, max_vezes INTEGER);
CREATE TABLE compra (idx INTEGER, preco INTEGER);

