-- HONK! — jogo/sql/esquema/04-ganso-e-ninho.sql
-- ---------- tempo, entrada, ganso, ninho ----------
CREATE TABLE relogio AS SELECT 0.0::DOUBLE AS t;
-- ENTRADA do quadro: o JavaScript grava aqui o teclado/mouse e o tempo (dt) uma vez
-- por quadro; as regras leem daqui. (Ler de uma tabela deixa o DuckDB planejar as
-- consultas bem melhor do que receber parâmetros: ~2x mais rápido no navegador.)
CREATE TABLE entrada AS SELECT 0.0::DOUBLE AS dt, 0.0::DOUBLE AS fwd, 0.0::DOUBLE AS lado, 0.0::DOUBLE AS giro, 0.0::DOUBLE AS corre,
  0.0::DOUBLE AS dt_ini;   -- dt_ini: tempo acumulado desde a última vez que os inimigos "pensaram" (ver sql-inimigos)

CREATE TABLE jogador (
  x DOUBLE, y DOUBLE, ang DOUBLE, mundo INTEGER,
  vida INTEGER, vida_max INTEGER,
  dano INTEGER, alcance DOUBLE, crit DOUBLE,          -- bicada
  dano_honk INTEGER, honk_raio DOUBLE, honk_recarga DOUBLE,
  penas INTEGER,                                       -- arremesso de penas (0 = não tem)
  vel DOUBLE, vampiro INTEGER, espinhos INTEGER, mult_migalhas DOUBLE,
  onda INTEGER, migalhas INTEGER, abates INTEGER,
  bico_cd DOUBLE, honk_cd DOUBLE, pena_cd DOUBLE,      -- recargas (s)
  bico_anim DOUBLE, honk_anim DOUBLE, dor DOUBLE, feliz DOUBLE, passo DOUBLE,
  estado VARCHAR,          -- inicio | vivo | escolha | morto | vitoria
  proxima DOUBLE,          -- quando começa a próxima onda (NULL = em combate)
  titulo_ate DOUBLE,       -- até quando mostrar o nome do mundo
  rolagem DOUBLE,          -- um sorteio guardado (crítico) para várias instruções usarem o mesmo valor
  infinito BOOLEAN,
  esquiva DOUBLE, esquiva_cd DOUBLE, esq_x DOUBLE, esq_y DOUBLE,  -- esquiva: tempo restante (invencível), recarga e direção
  ciclo INTEGER,           -- quantas voltas pelos 5 mundos (1 = primeira)
  evento INTEGER,          -- regra especial do ciclo atual (tabela evento; 0 = nenhuma)
  perfeita DOUBLE,         -- câmera lenta da ESQUIVA PERFEITA (segundos de jogo restantes)
  crit_garantido BOOLEAN,  -- a próxima bicada que acertar é crítico (prêmio da esquiva perfeita)
  furia DOUBLE, couro DOUBLE   -- Penas de Ouro: multiplicador do dano causado / do dano recebido
);
INSERT INTO jogador VALUES (10.5, 10.5, -pi()/2, 1, 30, 30, 3, 1.4, 0.08, 2, 4.0, 4.0, 0, 3.0, 0, 0, 1.0,
                            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 'inicio', NULL, 0, 0, false, 0, 0, 1, 0, 1, 0, 0, false, 1, 1);

-- recorde = onda mais longe já alcançada (contando todos os ciclos); vitorias = maior ciclo completado
CREATE TABLE ninho AS SELECT 0 AS moedas, 0 AS partidas, 0 AS recorde, 0 AS vitorias, 0 AS ouro;   -- ouro = Penas de Ouro

-- Loja permanente do ninho (roguelite). preço = preco_base * (nível + 1)
CREATE TABLE loja (idx INTEGER, item VARCHAR, nome VARCHAR, descricao VARCHAR, preco_base INTEGER, nivel INTEGER, nivel_max INTEGER);
INSERT INTO loja VALUES
 (1, 'bico',   'Bico de Aço',       '+1 de dano na bicada',            8, 0, 8),
 (2, 'penas',  'Penas Blindadas',   '+8 de vida máxima',               8, 0, 8),
 (3, 'pulmao', 'Pulmões de Ganso',  '+1 de dano e raio maior no HONK', 12, 0, 6),
 (4, 'asas',   'Asas Ligeiras',     '+6% de velocidade',               10, 0, 5),
 (5, 'gula',   'Gula de Ganso',     '+20% de migalhas',                15, 0, 5);

