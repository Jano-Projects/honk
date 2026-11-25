"""
HONK! — ROBÔ DE EQUILÍBRIO (teste longo)

Um jogador "razoável" com a loja cheia: anda até o inimigo mais perto pelo
caminho certo (busca em largura no mapa), bica quando está de frente, grita
quando está cercado ou ferido e esquiva de lado quando um projétil chega perto.
Serve para ver até onde a curva de dificuldade deixa ir.

    python3 testes/robo_equilibrio.py [partidas=1] [semente=1]

Referência (versão 1.0): passa o ciclo 1 inteiro e cai no meio do ciclo 2.
"""
import math
import random
import sys

from comum import Jogo

DT = 1 / 15


def caminho(paredes, ini, fim):
    """Próxima célula do menor caminho (BFS) de ini até fim, ou None."""
    anterior, fila = {ini: None}, [ini]
    while fila:
        c = fila.pop(0)
        if c == fim:
            break
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            v = (c[0] + dx, c[1] + dy)
            if v not in anterior and v not in paredes and 0 <= v[0] < 20 and 0 <= v[1] < 20:
                anterior[v] = c
                fila.append(v)
    if fim not in anterior:
        return None
    c, rota = fim, []
    while c is not None:
        rota.append(c)
        c = anterior[c]
    rota.reverse()
    return rota[1] if len(rota) > 2 else None


def main() -> None:
    partidas = int(sys.argv[1]) if len(sys.argv) > 1 else 1
    random.seed(int(sys.argv[2]) if len(sys.argv) > 2 else 1)
    j = Jogo()
    j.con.execute("UPDATE loja SET nivel = nivel_max")
    for p in range(partidas):
        j.comecar()
        h, n = j.hud(), 0
        while n < 15 * 60 * 35:                                   # até 35 minutos de jogo
            if h["estado"] == "escolha":
                j.escolher(random.randint(1, 3)); h = j.hud(); continue
            if h["estado"] != "vivo":
                break
            x, y, ang = j.linhas("SELECT x, y, ang FROM jogador")[0]
            alvo = j.linhas(f"SELECT x, y, escala FROM inimigo ORDER BY (x - {x}) ^ 2 + (y - {y}) ^ 2 LIMIT 1")
            fwd = giro = lado = 0
            bicar = honk = pena = esquiva = False
            if alvo:
                ax, ay, esc = alvo[0]
                paredes = set(j.linhas("SELECT x, y FROM mapa"))
                prox = caminho(paredes, (int(x), int(y)), (int(ax), int(ay)))
                mx, my = (prox[0] + 0.5, prox[1] + 0.5) if prox else (ax, ay)
                d = (math.atan2(my - y, mx - x) - ang + math.pi) % (2 * math.pi) - math.pi
                giro = max(-0.25, min(0.25, d))
                dist = math.hypot(ax - x, ay - y)
                fwd = 1 if dist > 1.0 + esc * 0.3 else (-0.5 if dist < 0.6 else 0)
                da = (math.atan2(ay - y, ax - x) - ang + math.pi) % (2 * math.pi) - math.pi
                if dist < 1.4 + esc * 0.3:
                    giro = max(-0.25, min(0.25, da))
                    bicar = abs(da) < 0.5
                pena = abs(d) < 0.3 and h["penas"] > 0
                if n % 8 == 0:
                    cercado = j.linhas(f"SELECT count(*) FROM inimigo WHERE (x - {x}) ^ 2 + (y - {y}) ^ 2 < 9")[0][0]
                    honk = cercado >= 2 or h["vida"] * 3 < h["vida_max"]
                ameaca = j.linhas(f"SELECT count(*) FROM projetil WHERE dono = 'inimigo' AND (x - {x}) ^ 2 + (y - {y}) ^ 2 < 2.2")[0][0]
                if (ameaca or (h["vida"] * 3 < h["vida_max"] and dist < 1.0)) and h["esquiva_cd"] <= 0:
                    esquiva, lado = True, random.choice([-1, 1])
            h = j.passo(DT, fwd, lado, giro, 0, bicar, honk, pena, esquiva)
            n += 1
            if n % 600 == 0:
                print(f"  {int(n * DT)} s: onda {h['onda']} (ciclo {h['ciclo']}), vida {h['vida']}", flush=True)
        print(f"partida {p + 1}: {h['estado']} na onda {h['onda']} do ciclo {h['ciclo']} "
              f"({(h['onda'] - 1) % 25 + 1}/25), {h['abates']} abates em {n * DT:.0f} s de jogo", flush=True)


if __name__ == "__main__":
    main()
