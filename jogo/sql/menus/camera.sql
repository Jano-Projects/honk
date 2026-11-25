-- HONK! — jogo/sql/menus/camera.sql
-- alternar a câmera entre terceira pessoa (atrás do ganso) e primeira pessoa

UPDATE config SET camera_dist = CASE WHEN camera_dist > 0 THEN 0 ELSE 1.6 END;
