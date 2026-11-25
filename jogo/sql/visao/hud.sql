-- HONK! — jogo/sql/visao/hud.sql
-- =====================================================================
--     SQL 11: HUD (view v_hud)  -  números do painel, rosto do ganso e
--     os SINAIS que dizem quais eventos rodar no próximo quadro
--     =====================================================================

CREATE VIEW v_hud AS
WITH j AS (SELECT * FROM jogador),
-- um único passe pelos inimigos calcula todos os sinais que dependem deles
ini AS (
  SELECT count(*)::INTEGER AS n,
         -- (o sinal não testa a linha de visão: a regra do ataque testa; aqui sai bem mais barato)
         COALESCE(bool_or(i.cd <= 0 AND i.vida > 0 AND j.esquiva <= 0
                  AND d2(i.x, i.y, j.x, j.y) < (0.55 + i.escala * 0.3) * (0.55 + i.escala * 0.3)), false) AS ataque,
         COALESCE(bool_or(i.projetil IS NOT NULL AND i.tiro_cd <= 0 AND d2(i.x, i.y, j.x, j.y) < i.alcance * i.alcance), false) AS tiro,
         COALESCE(bool_or(i.invoca IS NOT NULL AND i.invoca_cd <= 0), false) AS invoca,
         COALESCE(bool_or(i.vida <= 0), false) AS mortos
  FROM inimigo i, j
),
ult AS (SELECT string_agg(texto, '|' ORDER BY id) AS ultimas FROM (SELECT id, texto FROM log ORDER BY id DESC LIMIT 4)),
pr AS (SELECT count(*) AS n FROM projetil)
SELECT j.vida, j.vida_max, j.onda, j.migalhas, j.honk_cd::DOUBLE AS honk_cd, j.honk_recarga::DOUBLE AS honk_recarga,
       j.pena_cd::DOUBLE AS pena_cd, j.penas, j.bico_anim::DOUBLE AS bico_anim, j.honk_anim::DOUBLE AS honk_anim,
       j.dor::DOUBLE AS dor, j.passo::DOUBLE AS passo, j.estado, j.ang::DOUBLE AS ang, j.x::DOUBLE AS px, j.y::DOUBLE AS py,
       j.mundo, w.nome AS mundo_nome, w.subtitulo AS mundo_sub, w.papel, w.tinta, w.destaque, w.noite,
       (j.titulo_ate > r.t) AS titulo, (j.titulo_ate - r.t)::DOUBLE AS titulo_resta, j.ciclo, CASE WHEN j.onda = 0 THEN 0 ELSE (j.onda - 1) % 25 + 1 END AS onda_ciclo, j.abates, r.t::DOUBLE AS t,
       cam.recuo::DOUBLE AS recuo, cfg.camera_dist::DOUBLE AS cam_cfg,
       j.bico_cd::DOUBLE AS bico_cd, j.perfeita::DOUBLE AS perfeita, j.crit_garantido, ev.nome AS evento_nome,
       ev.noite AS ev_noite, cfg.diario, j.esquiva::DOUBLE AS esquiva, j.esq_x::DOUBLE AS esq_x, j.esq_y::DOUBLE AS esq_y, j.esquiva_cd::DOUBLE AS esquiva_cd, j.alcance::DOUBLE AS alcance, j.vel::DOUBLE AS vel,
       n.moedas, n.partidas, n.recorde, n.vitorias, ini.n AS n_inimigos, ult.ultimas,
       CASE WHEN j.estado = 'morto' THEN 'rosto_morto'
            WHEN j.dor > 0          THEN 'rosto_dor'
            WHEN j.honk_anim > 0    THEN 'rosto_bravo'
            WHEN j.feliz > 0        THEN 'rosto_feliz'
            WHEN j.vida * 3 < j.vida_max THEN 'rosto_ferido'
            ELSE 'rosto_normal' END AS rosto,
       -- SINAIS
       (j.estado = 'vivo' AND ini.ataque)                                   AS f_ataque,
       (j.estado = 'vivo' AND ini.tiro)                                     AS f_tiro,
       (j.estado = 'vivo' AND ini.invoca)                                   AS f_invoca,
       (j.estado = 'vivo' AND pr.n > 0)                                     AS f_proj,
       ini.mortos                                                           AS f_mortos,
       (j.estado = 'vivo' AND j.vida <= 0)                                  AS f_morte,
       (j.estado = 'vivo' AND j.proxima IS NULL AND ini.n = 0)              AS f_limpa,
       (j.estado = 'vivo' AND j.proxima IS NOT NULL AND r.t >= j.proxima)   AS f_onda,
       -- mapa de caminhos: recalcula quando o ganso se afasta 2 células do último cálculo
       (j.estado = 'vivo' AND (o.cx < 0 OR abs(floor(j.x) - o.cx) + abs(floor(j.y) - o.cy) >= 2)) AS f_campo
FROM j, ninho n, relogio r, campo_origem o, mundo w, ini, ult, pr, v_camera cam, config cfg, evento ev
WHERE w.id = j.mundo AND ev.id = COALESCE(j.evento, 0);
