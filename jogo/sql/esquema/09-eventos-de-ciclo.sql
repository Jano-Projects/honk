-- HONK! — jogo/sql/esquema/09-eventos-de-ciclo.sql
-- ======== v9: eventos de ciclo, combos, estatísticas (no fim: dependem de jogador e pegas) ========
-- ---------- EVENTOS: uma regra especial a cada ciclo (a partir do 2º; no desafio do dia, desde o 1º) ----------
CREATE TABLE evento (id INTEGER, nome VARCHAR, descricao VARCHAR,
  vida DOUBLE, dano_ini DOUBLE, vel_ini DOUBLE, qtd DOUBLE, mig DOUBLE, dano_jog DOUBLE, vel_jog DOUBLE, noite BOOLEAN);
INSERT INTO evento VALUES
 (0, '',                '',                                                                  1,    1,    1,    1,   1,   1,   1,    false),
 (1, 'CHUVA DE PÃO',    'Todo mundo está elétrico: inimigos +25% de velocidade, ganso +15%.', 1,    1,    1.25, 1,   1,   1,   1.15, false),
 (2, 'NOITE NO PARQUE', 'Só dá para ver de perto. Mas eles também: -20% de dano deles.',      1,    0.8,  1,    1,   1,   1,   1,    true),
 (3, 'LIQUIDAÇÃO',      'Bem mais inimigos... e o dobro de migalhas.',                        1,    1,    1,    1.6, 2,   1,   1,    false),
 (4, 'FÚRIA CEGA',      'Você bate 40% mais forte e apanha 40% mais forte.',                  1,    1.4,  1,    1,   1,   1.4, 1,    false),
 (5, 'PERNA MANCA',     'Inimigos 25% mais lentos, mas com 40% mais vida.',                   1.4,  1,    0.75, 1,   1,   1,   1,    false);
CREATE VIEW ev AS SELECT e.* FROM evento e, jogador j WHERE e.id = COALESCE(j.evento, 0);

