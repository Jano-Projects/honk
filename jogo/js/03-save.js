// HONK! — jogo/js/03-save.js
// SAVE: guarda moedas, recorde, lojas e dificuldade no localStorage do navegador.
// (ferramentas/montar.py junta todos os .js desta pasta, em ordem, num único <script type="module">)

// ---------- 3. Save do ninho (só neste navegador) ----------
const CHAVE = 'honk3d-ninho-v2';
async function salvar() {
  try {
    const n = (await linhas('SELECT * FROM ninho'))[0];
    const l = await linhas('SELECT idx, nivel FROM loja ORDER BY idx');
    const o = await linhas('SELECT idx, nivel FROM loja_ouro ORDER BY idx');
    const d = (await linhas('SELECT dificuldade FROM config'))[0].dificuldade;
    localStorage.setItem(CHAVE, JSON.stringify({ ...n, dif: d, loja: l.map((r) => r.nivel), ouroLoja: o.map((r) => r.nivel) }));
  } catch (_) {}
}
async function restaurar() {
  let s = null;
  try { s = JSON.parse(localStorage.getItem(CHAVE) || 'null'); } catch (_) {}
  if (!s) return;
  const int = (v) => Math.max(0, Math.min(1e7, Math.floor(Number(v) || 0)));
  const l = Array.isArray(s.loja) ? s.loja : [], o = Array.isArray(s.ouroLoja) ? s.ouroLoja : [];
  await conn.query(preencher(sql('sql-restaurar'), {
    moedas: int(s.moedas), partidas: int(s.partidas), recorde: int(s.recorde), vitorias: int(s.vitorias), ouro: int(s.ouro), dif: int(s.dif) || 2,
    l1: int(l[0]), l2: int(l[1]), l3: int(l[2]), l4: int(l[3]), l5: int(l[4]), o1: int(o[0]), o2: int(o[1]), o3: int(o[2]) }));
}

