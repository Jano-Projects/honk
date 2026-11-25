// HONK! — jogo/js/01-motor-duckdb.js
// O MOTOR: carrega o DuckDB-WASM (da internet ou da pasta vendor/), prepara as regras SQL
// e define como a entrada do quadro (teclas, dt) chega ao banco. Também mede o custo (?perf).
// (ferramentas/montar.py junta todos os .js desta pasta, em ordem, num único <script type="module">)

// ---------- 1. Carregar o DuckDB (CDN; ou pasta vendor/ com ?local=1) ----------
async function carregarDuckDB() {
  // OFFLINE: se a pasta vendor/ tiver o motor (scripts "preparar-offline"), usa ela sozinho
  let local = new URLSearchParams(location.search).has('local');
  // aberto direto do disco (instaladores): o motor vem junto, na pasta vendor/
  if (location.protocol === 'file:') local = true;
  if (!local && location.protocol.startsWith('http')) {
    try { local = (await fetch('./vendor/duckdb-eh.wasm', { method: 'HEAD' })).ok; } catch (_) {}
  }
  const VERSAO = '1.32.0';
  let duckdb, bundles;
  if (local) {
    const base = new URL('./vendor/', location.href).href;
    duckdb = await import(base + 'duckdb-browser.mjs');
    bundles = {
      mvp: { mainModule: base + 'duckdb-mvp.wasm', mainWorker: base + 'duckdb-browser-mvp.worker.js' },
      eh:  { mainModule: base + 'duckdb-eh.wasm',  mainWorker: base + 'duckdb-browser-eh.worker.js' },
    };
  } else {
    duckdb = await import(`https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm@${VERSAO}/+esm`);
    bundles = duckdb.getJsDelivrBundles();
  }
  const bundle = await duckdb.selectBundle(bundles);
  const workerUrl = URL.createObjectURL(new Blob([`importScripts("${bundle.mainWorker}");`], { type: 'text/javascript' }));
  const db = new duckdb.AsyncDuckDB(new duckdb.VoidLogger(), new Worker(workerUrl));
  await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
  URL.revokeObjectURL(workerUrl);
  return db.connect();
}
const linhas = async (q) => (await conn.query(q)).toArray().map((r) => ({ ...r }));

// CONSULTAS PREPARADAS: no navegador, PLANEJAR uma consulta grande custa mais do que
// executá-la. As consultas do jogo são preparadas ao carregar; cada {nome} vira uma
// leitura da tabela ENTRADA, que é atualizada uma vez por quadro.
// DESEMPENHO (v9): a entrada do quadro (dt, teclas) chega às regras como VARIÁVEIS do DuckDB
// (getvariable). Antes, cada {dt} virava uma subconsulta "(SELECT dt FROM entrada)", e o banco
// montava uma junção para cada uma: só a regra dos temporizadores do ganso tinha 12 delas
// e custava ~35 ms; com variáveis, ~2 ms. Se a versão do DuckDB não reler a variável numa
// consulta preparada (testado no início), volta ao jeito antigo.
let MODO_VAR = false;
async function testarVariaveis() {
  try {
    await conn.query("CREATE TEMP TABLE _tv AS SELECT 0.0::DOUBLE AS v; SET VARIABLE _x = 1.0");
    const p = await conn.prepare("UPDATE _tv SET v = v + getvariable('_x')");
    await p.query(); await conn.query('SET VARIABLE _x = 10.0'); await p.query();
    const v = Number((await linhas('SELECT v FROM _tv'))[0].v);
    await conn.query('DROP TABLE _tv');
    return Math.abs(v - 11) < 1e-9;
  } catch (_) { return false; }
}
async function gravarEntrada(dt, fwd, lado, giro, corre, dtIni = 0) {
  if (MODO_VAR) await conn.query(`SET VARIABLE dt = ${+dt}; SET VARIABLE fwd = ${+fwd}; SET VARIABLE lado = ${+lado}; SET VARIABLE giro = ${+giro}; SET VARIABLE corre = ${+corre}`);
  await P.entrada.query(dt, fwd, lado, giro, corre, dtIni);
}
let dtInimigos = 0, passoSim = 0;
async function prepararBloco(id) {
  const texto = sql(id).replace(/--[^\n]*/g, '');
  const bloco = [];
  for (const parte of texto.split(';').map((t) => t.trim()).filter(Boolean)) {
    const comParams = parte.replace(/\{(\w+)\}/g, (_, k) => MODO_VAR ? `getvariable('${k}')` : `(SELECT ${k} FROM entrada)`);
    bloco.push({ texto: parte, nomes: [], comParams, p: await conn.prepare(comParams), refeita: false });
  }
  bloco.nome = id;
  return bloco;
}
// ?perf na URL: mede quanto cada bloco de SQL custa (window.__honkPerf)
const MEDIR = new URLSearchParams(location.search).has('perf'); window.__honkPerf = {};
async function rodarBloco(bloco, vals = {}) {
  if (MEDIR) {
    const t0 = performance.now(), r = await rodarBloco2(bloco, vals), k = bloco.nome || '?';
    const m = (window.__honkPerf[k] ??= { n: 0, ms: 0 }); m.n++; m.ms += performance.now() - t0; return r;
  }
  return rodarBloco2(bloco, vals);
}
async function rodarBloco2(bloco, vals = {}) {
  let res;
  for (const st of bloco) {
    const args = st.nomes.map((n) => { const v = Number(vals[n]); return Number.isFinite(v) ? v : 0; });
    try { res = await st.p.query(...args); }
    catch (e) {
      // se uma consulta preparada falhar, prepara de novo uma vez; senão roda do jeito normal
      if (!st.refeita) {
        st.refeita = true;
        try { st.p = await conn.prepare(st.comParams); res = await st.p.query(...args); continue; } catch (_) {}
      }
      console.warn('preparada falhou, usando consulta normal:', e.message);
      res = await conn.query(preencher(st.texto, vals));
    }
  }
  return res;
}
let P = {};
// O DuckDB escolhe o plano de cada consulta olhando os dados do momento do preparo.
// Preparadas com o mapa vazio, as consultas quentes ficam com planos ruins (3x mais
// lentas). Por isso elas são preparadas de novo quando a partida já tem inimigos
// (uma vez por partida e a cada troca de mundo).
const QUENTES = ['mover', 'tick', 'inimigos', 'saida', 'saida-leve', 'sql-ev-campo', 'sql-ev-proj', 'sql-ev-tiro'];
let repreparar = false;
async function prepararQuentes() {
  for (const id of QUENTES) P[id === 'saida-leve' ? 'saidaLeve' : id] = await prepararBloco(id.startsWith('sql-') ? id : 'sql-' + id);
}

