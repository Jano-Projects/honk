-- HONK! — jogo/sql/visao/saida-leve.sql
-- SAÍDA LEVE: quando a câmera não se mexeu, as paredes são as mesmas do
--     quadro anterior; só os sprites e o HUD são consultados

SELECT s.kind AS s_kind, s.tipo AS s_tipo, s.vida AS s_vida, s.vida_max AS s_vida_max, s.flash AS s_flash, s.escala AS s_escala,
       s.alt AS s_alt, s.texto AS s_texto, s.idade AS s_idade, s.wx AS s_wx, s.wy AS s_wy, s.sx AS s_sx, s.ty AS s_ty,
       h.*
FROM v_hud h
LEFT JOIN (SELECT (row_number() OVER (ORDER BY ty DESC) - 1)::INTEGER AS n, * FROM v_sprites) s ON true
ORDER BY s.n NULLS LAST;
