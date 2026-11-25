-- HONK! — jogo/sql/regras/esquiva.sql
-- ESQUIVA (C / Ctrl / botão direito): arrancada curta na direção das teclas (ou para a frente),
--     invencível enquanto dura (0,22 s). Recarga de 0,9 s.

INSERT INTO estat SELECT 'esquivas', 1 FROM jogador WHERE estado = 'vivo' AND esquiva_cd <= 0 ON CONFLICT (chave) DO UPDATE SET n = estat.n + excluded.n;
UPDATE jogador SET esquiva = 0.22, esquiva_cd = CASE WHEN tem_combo('pes', 'folego') THEN 0.5 ELSE 0.9 END,
  esq_x = CASE WHEN {fwd} = 0 AND {lado} = 0 THEN cos(ang)
               ELSE (cos(ang) * {fwd} - sin(ang) * {lado}) / greatest(1e-9, sqrt({fwd} * {fwd} + {lado} * {lado})) END,
  esq_y = CASE WHEN {fwd} = 0 AND {lado} = 0 THEN sin(ang)
               ELSE (sin(ang) * {fwd} + cos(ang) * {lado}) / greatest(1e-9, sqrt({fwd} * {fwd} + {lado} * {lado})) END
WHERE estado = 'vivo' AND esquiva_cd <= 0;
