-- HONK! — jogo/sql/regras/tick.sql
-- (as regras que rodam todo quadro leem a ENTRADA por junção: "FROM entrada _e". Bem mais rápido que
--  uma subconsulta por {dt} — ver gravarEntrada no JavaScript)
UPDATE relogio SET t = t + _e.dt FROM entrada _e WHERE (SELECT estado FROM jogador) = 'vivo';

UPDATE jogador SET
  bico_cd   = greatest(0, bico_cd   - _e.dt),  honk_cd   = greatest(0, honk_cd   - _e.dt),
  pena_cd   = greatest(0, pena_cd   - _e.dt),  bico_anim = greatest(0, bico_anim - _e.dt),
  honk_anim = greatest(0, honk_anim - _e.dt),  dor       = greatest(0, dor       - _e.dt),
  feliz     = greatest(0, feliz     - _e.dt),  esquiva   = greatest(0, esquiva   - _e.dt),
  esquiva_cd = greatest(0, esquiva_cd - _e.dt), perfeita = greatest(0, perfeita - _e.dt)
FROM entrada _e
WHERE estado = 'vivo';

