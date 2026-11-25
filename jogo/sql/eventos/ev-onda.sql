-- HONK! — jogo/sql/eventos/ev-onda.sql
-- hora da próxima onda: cria os inimigos do mundo atual.
--     quantidade = 1 + onda do mundo + nº do mundo (até 3) + ciclos extras (máx. 12); a 5ª onda de cada mundo = CHEFE.
--     FORÇA DOS INIMIGOS
--       ciclo 1:   cresce a cada onda conforme a tabela BALANÇO (aprender o jogo)
--       ciclo 2+:  além disso, é medida pela FORÇA DO PRÓPRIO GANSO e cresce exponencialmente por ciclo:
--                  vida  x (ataque do ganso / ataque inicial) x 1,5^(ciclo-1)
--                  dano  x (vida do ganso / vida inicial)     x 1,3^(ciclo-1)
--                  velocidade +5% por ciclo (até +30%) e migalhas +50% por ciclo
--       Ficar mais forte não "resolve" o jogo: os inimigos acompanham. Com as cartas no limite
--       e a loja cheia, o expoente vence — e aí só a habilidade de quem joga segura.

INSERT INTO log SELECT nextval('seq_log'), r.t,
       '=== ONDA ' || (j.onda % 25 + 1) || CASE WHEN j.ciclo > 1 THEN ' (CICLO ' || j.ciclo || ')' ELSE '' END
       || CASE WHEN (j.onda + 1) % 5 = 0 THEN ' - CHEFE! ===' ELSE ' ===' END
FROM jogador j, relogio r WHERE j.estado = 'vivo' AND j.proxima IS NOT NULL AND r.t >= j.proxima;

INSERT INTO inimigo
SELECT nextval('seq_inimigo'), t.tipo, t.nome,
       -- pequeno desvio da posição (no desafio do dia, também vem do hash: mesma onda para todo mundo)
       s.x + (CASE WHEN o.diario > 0 THEN (hash(o.n, q.k, o.diario, 1) % 1000) / 1000.0 ELSE random() END - 0.5) * 0.4,
       s.y + (CASE WHEN o.diario > 0 THEN (hash(o.n, q.k, o.diario, 2) % 1000) / 1000.0 ELSE random() END - 0.5) * 0.4,
       round(t.vida * b.vida_ini * o.fv * o.ev_vida)::INTEGER,
       round(t.vida * b.vida_ini * o.fv * o.ev_vida)::INTEGER,
       ceil(t.dano * b.dano_ini * o.fd * o.ev_dano)::INTEGER,
       t.vel * (0.85 + CASE WHEN o.diario > 0 THEN (hash(o.n, q.k, o.diario, 3) % 1000) / 1000.0 ELSE random() END * 0.3) * o.fvel * o.ev_vel, t.escala, t.voa, round(t.recompensa * o.fr)::INTEGER, 0.8, 0, t.frase, t.comportamento, t.zigue,
       t.projetil, t.cd_tiro, t.alcance,
       1.0 + CASE WHEN o.diario > 0 THEN (hash(o.n, q.k, o.diario, 4) % 1000) / 1000.0 ELSE random() END * t.cd_tiro, t.invoca, t.cd_invoca, t.cd_invoca
FROM (SELECT j.onda + 1 AS n, j.mundo, (j.onda % 5) + 1 AS local, j.x AS jx, j.y AS jy, j.ciclo - 1 AS extra,
             -- força do ganso elevada a 0,75: ficar mais forte ainda ajuda um pouco, mas nunca "resolve"
             pow(bb.cresc_vida, j.onda % 25) * CASE WHEN j.ciclo = 1 THEN 1
                  ELSE pow(greatest(1, j.dano * (1 + least(j.crit, 1)) / 3.24), 0.75) * pow(1.5, j.ciclo - 1) END AS fv,
             pow(bb.cresc_dano, j.onda % 25) * CASE WHEN j.ciclo = 1 THEN 1
                  ELSE pow(greatest(1, j.vida_max / 30.0), 0.75) * pow(1.3, j.ciclo - 1) END AS fd,
             least(1.3, 1 + 0.05 * (j.ciclo - 1)) AS fvel,
             (1 + 0.5 * (j.ciclo - 1)) AS fr,
             e.vida AS ev_vida, e.dano_ini AS ev_dano, e.vel_ini AS ev_vel, e.qtd AS ev_qtd,
             c.diario
      FROM jogador j, relogio r, b bb, ev e, config c
      WHERE j.estado = 'vivo' AND j.proxima IS NOT NULL AND r.t >= j.proxima) o,
     b,
     range(14) q(k),
     -- no desafio do dia o "sorteio" vem de um hash do dia: todo mundo enfrenta os mesmos inimigos
     LATERAL (SELECT * FROM tipo_inimigo ti
              WHERE ti.mundo = o.mundo AND ti.chefe = (o.n % 5 = 0) AND ti.onda_min <= o.local AND q.k >= 0
              ORDER BY CASE WHEN o.diario > 0 THEN (hash(ti.tipo, o.n, q.k, o.diario) % 100000)::DOUBLE ELSE random() END LIMIT 1) t,
     LATERAL (SELECT * FROM spawn sp WHERE d2(sp.x, sp.y, o.jx, o.jy) > 25 AND q.k >= 0
              ORDER BY CASE WHEN o.diario > 0 THEN (hash(sp.x, sp.y, o.n, q.k, o.diario) % 100000)::DOUBLE ELSE random() END LIMIT 1) s
WHERE q.k < CASE WHEN o.n % 5 = 0 THEN 1 ELSE least(round((1 + o.local + least(o.mundo, 3) + o.extra) * o.ev_qtd), 14) END;

UPDATE jogador SET onda = onda + 1, proxima = NULL
WHERE estado = 'vivo' AND proxima IS NOT NULL AND (SELECT t FROM relogio) >= proxima;
