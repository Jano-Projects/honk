"""
HONK! — testes rápidos das regras SQL (rodam em segundos).

    python3 -m unittest discover -s testes -v

Cada teste monta uma situação no banco e confere o resultado da regra.
"""
import unittest

from comum import SQL, Jogo


class Regras(unittest.TestCase):

    def setUp(self):
        self.j = Jogo()
        self.j.comecar()

    def test_todos_os_blocos_compilam_e_rodam(self):
        self.j.con.execute("UPDATE relogio SET t = 10")
        for _ in range(5):
            self.j.passo(fwd=1, bicar=True, honk=True)
        self.assertEqual(self.j.hud()["estado"], "vivo")

    def test_primeira_onda_aparece(self):
        self.j.con.execute("UPDATE relogio SET t = 10")
        self.j.sql(SQL["sql-ev-onda"])
        h = self.j.hud()
        self.assertEqual(h["onda"], 1)
        self.assertGreater(h["n_inimigos"], 0)

    def test_ganso_nunca_entra_na_parede(self):
        """Anda e esquiva em todas as direções; o corpo nunca pode ficar numa célula de parede."""
        import math
        for k in range(240):
            ang = k * 0.37
            self.j.passo(dt=0.1, fwd=math.cos(ang), lado=math.sin(ang), giro=0.05, esquiva=(k % 9 == 0))
            x, y = self.j.linhas("SELECT x, y FROM jogador")[0]
            dentro = self.j.linhas(f"SELECT count(*) FROM mapa WHERE x = floor({x}) AND y = floor({y})")[0][0]
            self.assertEqual(dentro, 0, f"ganso dentro da parede em ({x:.2f}, {y:.2f})")

    def test_fim_do_aeroporto_comeca_um_ciclo_novo(self):
        self.j.con.execute("UPDATE jogador SET onda = 25, mundo = 5, estado = 'escolha'")
        self.j.con.execute("INSERT INTO oferta SELECT 1, 1")
        self.j.escolher(1)
        mundo, ciclo, evento = self.j.linhas("SELECT mundo, ciclo, evento FROM jogador")[0]
        self.assertEqual((mundo, ciclo), (1, 2))
        self.assertGreater(evento, 0, "o ciclo 2 deve sortear uma regra especial")
        self.assertGreater(self.j.linhas("SELECT ouro FROM ninho")[0][0], 0, "ciclo completo dá Penas de Ouro")

    def test_ciclo_2_mede_a_forca_do_ganso(self):
        """No ciclo 2, um ganso mais forte enfrenta inimigos com mais vida."""
        vidas = []
        for dano in (3, 30):
            j = Jogo(); j.comecar()
            j.con.execute(f"UPDATE jogador SET ciclo = 2, onda = 25, evento = 0, dano = {dano}")
            j.con.execute("UPDATE relogio SET t = 10; UPDATE jogador SET proxima = 10")
            j.sql(SQL["sql-ev-onda"])
            vidas.append(j.linhas("SELECT max(vida_max) FROM inimigo")[0][0])
        self.assertGreater(vidas[1], vidas[0])

    def test_esquiva_perfeita_da_critico_garantido(self):
        j = self.j
        j.con.execute("DELETE FROM inimigo; UPDATE jogador SET esquiva = 0.2, perfeita = 0, crit_garantido = false")
        j.con.execute("INSERT INTO projetil SELECT 1, 'inimigo', 'mala', x + 0.2, y, 0, 0, 3, 3.0, 'Teste' FROM jogador")
        j.sql(SQL["sql-perfeita"])
        perfeita, critico = j.linhas("SELECT perfeita, crit_garantido FROM jogador")[0]
        self.assertGreater(perfeita, 0)
        self.assertTrue(critico)
        # a próxima bicada que acerta sai com o dobro de dano e gasta o bônus
        j.con.execute("""INSERT INTO inimigo SELECT 77, 'pombo', 'Pombo', x + cos(ang) * 0.8, y + sin(ang) * 0.8, 50, 50, 1, 1,
                         0.45, 0, 1, 1, 0, '', 'corpo', 0, NULL, 0, 0, 0, NULL, 0, 0 FROM jogador""")
        j.con.execute("UPDATE jogador SET bico_cd = 0, esquiva = 0")
        dano = j.linhas("SELECT dano FROM jogador")[0][0]
        j.sql(SQL["sql-bicar"])
        self.assertEqual(j.linhas("SELECT vida FROM inimigo WHERE id = 77")[0][0], 50 - 2 * dano)
        self.assertFalse(j.linhas("SELECT crit_garantido FROM jogador")[0][0])

    def test_desafio_do_dia_e_igual_para_todos(self):
        def onda_do_dia():
            j = Jogo(); j.comecar(diario=20261125)
            j.con.execute("UPDATE relogio SET t = 10")
            j.sql(SQL["sql-ev-onda"])
            return j.linhas("SELECT tipo, round(x, 1), round(y, 1) FROM inimigo ORDER BY id"), j.linhas("SELECT evento, dano FROM jogador")
        self.assertEqual(onda_do_dia(), onda_do_dia())

    def test_cartas_respeitam_o_limite(self):
        j = self.j
        j.con.execute("INSERT INTO pegas SELECT efeito, max_vezes FROM carta WHERE efeito <> 'banho'")
        j.con.execute("UPDATE jogador SET onda = 3, proxima = NULL; DELETE FROM inimigo")
        j.sql(SQL["sql-ev-limpa"])
        ofertadas = [r[0] for r in j.linhas("SELECT c.efeito FROM oferta o JOIN carta c ON c.id = o.carta")]
        self.assertEqual(ofertadas, ["banho"], "só sobra a carta sem limite")

    def test_combo_mordida_vampira_cura(self):
        j = self.j
        j.con.execute("INSERT INTO pegas VALUES ('bico', 1), ('vampiro', 1)")
        j.con.execute("""INSERT INTO inimigo SELECT 78, 'pombo', 'Pombo', x + cos(ang) * 0.8, y + sin(ang) * 0.8, 50, 50, 1, 1,
                         0.45, 0, 1, 1, 0, '', 'corpo', 0, NULL, 0, 0, 0, NULL, 0, 0 FROM jogador""")
        j.con.execute("UPDATE jogador SET vida = 10, bico_cd = 0")
        j.sql(SQL["sql-bicar"])
        self.assertEqual(j.linhas("SELECT vida FROM jogador")[0][0], 11)


if __name__ == "__main__":
    unittest.main()
