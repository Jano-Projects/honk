"""
HONK! — base dos testes: roda as REGRAS SQL do jogo no DuckDB do Python, sem navegador.

Como o motor do jogo é o próprio banco, dá para testar o jogo inteiro aqui:
o mesmo SQL que roda no navegador (lido de jogo/sql pelo montador) é executado
quadro a quadro, na mesma ordem que o laço de simulação do JavaScript usa.

Precisa de:  pip install duckdb
"""
import pathlib
import re
import sys

import duckdb

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent / "ferramentas"))
from montar import blocos_sql  # noqa: E402

SQL = blocos_sql()

# sinal do HUD -> bloco de evento que ele dispara (igual ao EVENTOS do JavaScript)
EVENTOS = [("f_ataque", "sql-ev-ataque"), ("f_tiro", "sql-ev-tiro"), ("f_invoca", "sql-ev-invoca"),
           ("f_proj", "sql-ev-proj"), ("f_mortos", "sql-ev-mortos"), ("f_morte", "sql-ev-morte"),
           ("f_limpa", "sql-ev-limpa"), ("f_onda", "sql-ev-onda"), ("f_campo", "sql-ev-campo")]


def preencher(texto: str, vals: dict) -> str:
    """Troca {chaves} por números, como o `preencher` do JavaScript."""
    return re.sub(r"\{(\w+)\}", lambda m: f"{float(vals.get(m.group(1), 0)):.5f}", texto)


class Jogo:
    """Uma partida rodando só no banco."""

    def __init__(self):
        self.con = duckdb.connect()
        self.con.execute("SET threads = 1")
        self.con.execute("SET disabled_optimizers = 'statistics_propagation'")   # igual ao navegador
        self.con.execute(SQL["sql-esquema"])
        self.con.execute(SQL["sql-render"] + SQL["sql-sprites"] + SQL["sql-hud"])

    def sql(self, texto: str, **vals):
        return self.con.execute(preencher(texto, vals))

    def linhas(self, consulta: str):
        return self.con.execute(consulta).fetchall()

    def hud(self) -> dict:
        r = self.con.execute("SELECT * FROM v_hud")
        return dict(zip([c[0] for c in r.description], r.fetchall()[0]))

    def comecar(self, diario: int = 0):
        self.sql(SQL["sql-diario"], d=diario)
        self.sql(SQL["sql-reiniciar"])
        self.sql(SQL["sql-carregar-mundo"])

    def escolher(self, slot: int = 1):
        self.sql(SQL["sql-escolher"], slot=slot)
        self.sql(SQL["sql-carregar-mundo"])

    def passo(self, dt=1 / 15, fwd=0.0, lado=0.0, giro=0.0, corre=0, bicar=False, honk=False, pena=False, esquiva=False):
        """Um passo da simulação, na mesma ordem do laço `simular()` do JavaScript."""
        h = self.hud()
        if h["estado"] != "vivo":
            return h
        v = dict(dt=dt, fwd=fwd, lado=lado, giro=giro, corre=corre)
        self.con.execute(f"UPDATE entrada SET dt={dt}, fwd={fwd}, lado={lado}, giro={giro}, corre={corre}, dt_ini={dt}")
        if esquiva:
            self.sql(SQL["sql-esquiva"], **v)
        self.sql(SQL["sql-mover"], **v)
        if h["esquiva"] > 0 or esquiva:
            self.sql(SQL["sql-perfeita"], **v)
        if bicar:
            self.sql(SQL["sql-bicar"], **v)
        if honk:
            self.sql(SQL["sql-honk"], **v)
        if pena:
            self.sql(SQL["sql-pena"], **v)
        for sinal, bloco in EVENTOS:
            if h.get(sinal):
                self.sql(SQL[bloco], **v)
        self.sql(SQL["sql-inimigos"], **v)
        self.sql(SQL["sql-tick"], **v)
        return self.hud()
