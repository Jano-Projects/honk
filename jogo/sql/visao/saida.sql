-- HONK! — jogo/sql/visao/saida.sql
-- =====================================================================
--     SQL 12: SAÍDA DO QUADRO  -  UMA consulta devolve a tela inteira:
--     linha N = parede da coluna N + o N-ésimo sprite (do mais longe para o
--     mais perto) + os números do HUD. Menos idas ao banco = mais FPS.
--     =====================================================================

SELECT p.c, p.dist, p.alt, p.lado, p.u, p.padrao,
       s.kind AS s_kind, s.tipo AS s_tipo, s.vida AS s_vida, s.vida_max AS s_vida_max, s.flash AS s_flash, s.escala AS s_escala,
       s.alt AS s_alt, s.texto AS s_texto, s.idade AS s_idade, s.wx AS s_wx, s.wy AS s_wy, s.sx AS s_sx, s.ty AS s_ty,
       h.*
FROM v_paredes p
LEFT JOIN (SELECT (row_number() OVER (ORDER BY ty DESC) - 1)::INTEGER AS n, * FROM v_sprites) s ON s.n = p.c
CROSS JOIN v_hud h
ORDER BY p.c;
