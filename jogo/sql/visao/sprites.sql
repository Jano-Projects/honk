-- HONK! — jogo/sql/visao/sprites.sql
-- =====================================================================
--     SQL 10: SPRITES (view v_sprites)  -  inimigos, projéteis e números
--     projetados no espaço da câmera: tx = lateral, ty = profundidade.
--     =====================================================================

CREATE VIEW v_sprites AS
WITH cam AS (
  SELECT cx AS px, cy AS py, cos(ang) AS dx, sin(ang) AS dy, -sin(ang) * 0.66 AS plx, cos(ang) * 0.66 AS ply FROM v_camera
),
obj AS (
  -- inimigos: "idade" carrega o AVISO de tiro (0..1, sobe nos 0,7 s antes de atirar) e "texto" avisa que vai chamar reforço
  SELECT 'inimigo' AS kind, i.tipo, i.x, i.y, i.vida, i.vida_max, i.flash, i.escala, i.voa AS alt,
         CASE WHEN i.invoca IS NOT NULL AND i.invoca_cd < 1.0 THEN 'invoca' END AS texto,
         CASE WHEN i.projetil IS NOT NULL AND i.tiro_cd < 0.7 AND d2(i.x, i.y, j.x, j.y) < i.alcance * i.alcance
              THEN 1 - greatest(0, i.tiro_cd) / 0.7 ELSE 0 END AS idade
  FROM inimigo i, jogador j
  UNION ALL
  SELECT 'proj', tipo, x, y, 0, 0, 0.0, 0.16, 0.42, NULL, 0.0 FROM projetil
  UNION ALL
  SELECT 'texto', cor, f.x, f.y, 0, 0, 0.0, 0.0, 0.85, texto, r.t - f.t0 FROM flutua f, relogio r WHERE r.t - f.t0 < 0.9
  UNION ALL
  SELECT 'efeito', tipo, e.x, e.y, e.id, 0, 0.0, 0.0, 0.35, NULL, r.t - e.t0 FROM efeito e, relogio r WHERE r.t - e.t0 < 0.8
)
SELECT kind, tipo, vida, vida_max, flash::DOUBLE AS flash, escala::DOUBLE AS escala, alt::DOUBLE AS alt, texto,
       idade::DOUBLE AS idade, x::DOUBLE AS wx, y::DOUBLE AS wy,
       (160 * (1 + tx / ty))::DOUBLE AS sx, ty::DOUBLE AS ty
FROM (SELECT obj.*, inv * (dy * (x - px) - dx * (y - py)) AS tx, inv * (-ply * (x - px) + plx * (y - py)) AS ty
      FROM obj, cam, LATERAL (SELECT 1.0 / (plx * dy - dx * ply) AS inv));
