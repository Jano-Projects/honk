"""
HONK! — ROBÔ CAÇADOR DE BUGS (teste longo)

Joga partidas inteiras com entradas meio aleatórias (anda, vira, esquiva contra
paredes, bica, grita) e, A CADA QUADRO, confere regras que nunca podem quebrar:
ninguém dentro de parede, ninguém fora do mapa, nada de NaN, onda que não trava,
projéteis que não se acumulam, vida que não passa do máximo.

    python3 testes/robo_bugs.py [partidas=2] [quadros_por_partida=3000] [semente=7]

Sai com código 1 se encontrar algum bug (o GitHub Actions usa isso).
"""
import collections
import math
import random
import sys

from comum import Jogo


def main() -> int:
    partidas = int(sys.argv[1]) if len(sys.argv) > 1 else 2
    limite = int(sys.argv[2]) if len(sys.argv) > 2 else 3000
    random.seed(int(sys.argv[3]) if len(sys.argv) > 3 else 7)
    bugs, exemplos = collections.Counter(), {}

    def bug(tipo, info):
        bugs[tipo] += 1
        if tipo not in exemplos:
            exemplos[tipo] = info
            print("BUG:", tipo, info, flush=True)

    j = Jogo()
    j.con.execute("UPDATE loja SET nivel = nivel_max")          # loja cheia: chega mais longe
    for p in range(partidas):
        j.comecar()
        h, n, progresso, ultimo = j.hud(), 0, 0, None
        caotico = False
        while n < limite:
            if h["estado"] == "escolha":
                j.escolher(random.randint(1, 3)); h = j.hud(); continue
            if h["estado"] != "vivo":
                break
            x, y, ang = j.linhas("SELECT x, y, ang FROM jogador")[0]
            # ---- regras que nunca podem quebrar
            if j.linhas(f"SELECT count(*) FROM mapa WHERE x = floor({x}) AND y = floor({y})")[0][0]:
                bug("ganso dentro da parede", (round(x, 2), round(y, 2)))
            for linha in j.linhas("SELECT tipo, x, y FROM inimigo WHERE isnan(x) OR isnan(y) OR x < 0.5 OR y < 0.5 OR x > 19.5 OR y > 19.5"):
                bug("inimigo fora do mapa / NaN", linha)
            for linha in j.linhas("SELECT i.tipo, i.x, i.y FROM inimigo i JOIN mapa m ON m.x = floor(i.x) AND m.y = floor(i.y)"):
                bug("inimigo dentro da parede", linha)
            if h["vida"] > h["vida_max"]:
                bug("vida acima do máximo", (h["vida"], h["vida_max"]))
            if j.linhas("SELECT count(*) FROM projetil")[0][0] > 60:
                bug("projéteis acumulando", None)
            if (h["onda"], h["abates"]) != ultimo:
                ultimo, progresso = (h["onda"], h["abates"]), n
            elif n - progresso > 900:
                bug("onda travada (60 s sem abate)", h["onda"]); progresso = n
            # ---- entrada: metade do tempo caótica, metade caçando
            if n % 90 == 0:
                caotico = random.random() < 0.5
            alvo = j.linhas(f"SELECT x, y FROM inimigo ORDER BY (x - {x}) ^ 2 + (y - {y}) ^ 2 LIMIT 1")
            dt = random.choice([1 / 60, 1 / 30, 1 / 15, 0.1])
            if caotico or not alvo:
                fwd, lado = random.choice([-1, 0, 1, 1]), random.choice([-1, 0, 0, 1])
                h = j.passo(dt, fwd, lado, random.uniform(-0.3, 0.3), random.random() < 0.3,
                            bicar=random.random() < 0.2, honk=random.random() < 0.03, esquiva=random.random() < 0.08)
            else:
                d = (math.atan2(alvo[0][1] - y, alvo[0][0] - x) - ang + math.pi) % (2 * math.pi) - math.pi
                perto = math.hypot(alvo[0][0] - x, alvo[0][1] - y) < 1.8
                h = j.passo(dt, 1 if abs(d) < 0.6 else 0, 0, max(-0.25, min(0.25, d)),
                            bicar=perto, honk=n % 40 == 0, pena=h["penas"] > 0, esquiva=random.random() < 0.03)
            n += 1
        print(f"partida {p + 1}: {h['estado']} na onda {h['onda']} (ciclo {h['ciclo']}), {h['abates']} abates, {n} quadros", flush=True)
    print("bugs:", dict(bugs) or "nenhum")
    return 1 if bugs else 0


if __name__ == "__main__":
    sys.exit(main())
