// HONK! — jogo/js/11-telas.js
// TELAS: loja do ninho e Penas de Ouro, cartas de poder, dificuldade, placar da derrota,
// desafio do dia e as transições entre os estados do jogo.
// (ferramentas/montar.py junta todos os .js desta pasta, em ordem, num único <script type="module">)

// ---------- 7. Telas (loja, cartas, morte, vitória) ----------
async function montarLoja(alvo) {
  const n = (await linhas('SELECT moedas FROM ninho'))[0];
  const itens = await linhas('SELECT idx, nome, descricao, nivel, nivel_max, preco_base * (nivel + 1) AS preco FROM loja ORDER BY idx');
  const cab = document.createElement('p');
  cab.append('Loja do ninho · ');
  const m = document.createElement('span'); m.className = 'moedas'; m.textContent = `${n.moedas} moedas`; cab.append(m);
  const filhos = [cab];
  for (const it of itens) {
    const div = document.createElement('div'); div.className = 'item';
    const info = document.createElement('div');
    const b = document.createElement('b'); b.textContent = it.nome;
    const sm = document.createElement('small'); sm.textContent = it.descricao;
    const nv = document.createElement('div'); nv.className = 'niveis';
    for (let i = 0; i < it.nivel_max; i++) { const q = document.createElement('i'); if (i < it.nivel) q.className = 'on'; nv.append(q); }
    info.append(b, sm, nv);
    const bt = document.createElement('button');
    const max = it.nivel >= it.nivel_max;
    bt.textContent = max ? 'Máximo' : `Comprar · ${it.preco}`;
    bt.disabled = max || n.moedas < it.preco;
    bt.addEventListener('click', async () => {
      await conn.query(preencher(sql('sql-comprar'), { idx: it.idx }));
      som('abate'); await salvar(); await montarLoja(alvo);
    });
    div.append(info, bt); filhos.push(div);
  }
  // PENAS DE OURO: aparece quando o jogador já chegou ao 2º ciclo (ou já tem ouro)
  const o = (await linhas('SELECT ouro, vitorias FROM ninho'))[0];
  if (o.ouro > 0 || o.vitorias > 0) {
    const t = document.createElement('h4'); t.append('Penas de Ouro · ');
    const q = document.createElement('span'); q.className = 'ouro'; q.textContent = `${o.ouro} penas`; t.append(q);
    filhos.push(t);
    for (const it of await linhas('SELECT idx, nome, descricao, nivel, preco_base + nivel AS preco FROM loja_ouro ORDER BY idx')) {
      const div = document.createElement('div'); div.className = 'item';
      const info = document.createElement('div');
      const b = document.createElement('b'); b.textContent = it.nome;
      const sm = document.createElement('small'); sm.textContent = `${it.descricao} · nível ${it.nivel}`;
      info.append(b, sm);
      const bt = document.createElement('button'); bt.textContent = `Comprar · ${it.preco} ouro`; bt.disabled = o.ouro < it.preco;
      bt.addEventListener('click', async () => { await conn.query(preencher(sql('sql-comprar-ouro'), { idx: it.idx })); som('combo'); await salvar(); await montarLoja(alvo); });
      div.append(info, bt); filhos.push(div);
    }
  }
  alvo.replaceChildren(...filhos);
}

async function montarDificuldade() {
  const ops = await linhas('SELECT b.id, b.nome, b.id = c.dificuldade AS atual FROM balanco b, config c ORDER BY b.id');
  $('dificuldade').replaceChildren(...ops.map((o) => {
    const bt = document.createElement('button'); bt.textContent = o.nome;
    bt.setAttribute('role', 'radio'); bt.setAttribute('aria-checked', String(o.atual));
    bt.addEventListener('click', async () => { await conn.query(preencher(sql('sql-dificuldade'), { d: o.id })); await salvar(); await montarDificuldade(); });
    return bt;
  }));
}

// cada carta é um folheto com uma "gravura" (um símbolo em tipo de madeira)
const SIMBOLO = { bico: '▲', vida: '♥', grito: '!', folego: '~', pescoco: '↑', vampiro: '+', pes: '»', espinhos: '✶',
                  arremesso: '➶', aguia: '◉', banho: '≈', ganancia: '$' };
async function montarCartas(h) {
  const proximo = (await linhas('SELECT nome FROM mundo WHERE id = ' + (h.mundo >= 5 ? 1 : h.mundo + 1)))[0]?.nome || '';
  $('escolhaTitulo').textContent = h.onda % 25 === 0 ? `O aeroporto caiu. O ódio não passou. De volta ao parque: ciclo ${h.ciclo + 1}.`
    : h.onda % 5 === 0 ? `Chefe derrotado! Agora: ${proximo.toLowerCase()}.` : `Onda ${h.onda_ciclo} limpa!`;
  const cartas = await linhas(`SELECT o.slot, c.efeito, c.nome, c.descricao, c.rara, c.max_vezes, COALESCE(p.n, 0) AS n,
      (SELECT string_agg(cb.nome, ', ') FROM combo cb WHERE COALESCE(p.n, 0) = 0
         AND ((cb.a = c.efeito AND cb.b IN (SELECT efeito FROM pegas)) OR (cb.b = c.efeito AND cb.a IN (SELECT efeito FROM pegas)))) AS combo
    FROM oferta o JOIN carta c ON c.id = o.carta LEFT JOIN pegas p ON p.efeito = c.efeito ORDER BY o.slot`);
  if (!cartas.length) { await escolher(1, true); return; }      // tudo no limite: segue sem carta
  $('cartas').replaceChildren(...cartas.map((c) => {
    const b = document.createElement('button'); b.className = 'carta' + (c.rara ? ' rara' : '');
    const k = document.createElement('span'); k.className = 'tecla'; k.textContent = `tecla ${c.slot}`;
    const gr = document.createElement('div'); gr.className = 'gravura'; gr.textContent = SIMBOLO[c.efeito] || '★';
    const n = document.createElement('b'); n.textContent = c.nome;
    const d = document.createElement('span'); d.textContent = c.descricao;
    const r = document.createElement('em'); r.textContent = (c.rara ? 'RARA' : 'comum') + (c.max_vezes < 99 ? ` · ${c.n}/${c.max_vezes}` : '');
    b.append(k, gr, n, d, r);
    if (c.combo) { const cb = document.createElement('strong'); cb.className = 'combo'; cb.textContent = `COMBO: ${c.combo}!`; b.append(cb); }
    b.addEventListener('click', () => escolher(c.slot)); return b;
  }));
}

async function escolher(slot, forcar = false) {
  if (hudAtual.estado !== 'escolha') return;
  if (!forcar && performance.now() - telaDesde < 600) return;   // quem estava bicando no clique não escolhe carta sem querer
  hudAtual.estado = '...';
  const combosAntes = (await linhas('SELECT nome FROM combo WHERE tem_combo(a, b)')).map((r) => r.nome);
  await conn.query(preencher(sql('sql-escolher'), { slot }));
  const novo = (await linhas('SELECT nome FROM combo WHERE tem_combo(a, b)')).map((r) => r.nome).find((n) => !combosAntes.includes(n));
  if (novo) { som('combo'); fala = { texto: `COMBO: ${novo}!`, t0: performance.now() + 600, ms: 3000 }; }
  await conn.query(sql('sql-carregar-mundo'));
  invalidarParedes();
  try { canvas.requestPointerLock(); } catch (_) {}
}

async function mudouEstado(h) {
  document.body.classList.toggle('jogando', h.estado === 'vivo');
  if (h.estado === 'vivo') document.activeElement?.blur?.();
  telaDesde = performance.now();
  for (const id of ['telaInicio', 'telaEscolha', 'telaMorte']) $(id).classList.add('oculto');
  if (h.estado !== 'vivo' && document.pointerLockElement) { soltandoDePropósito = true; document.exitPointerLock(); }
  if (h.estado === 'inicio') {
    await montarDificuldade(); await montarLoja($('lojaInicio'));
    $('recordeTxt').textContent = h.recorde > 0
      ? `Mais longe que o ódio já foi: onda ${(h.recorde - 1) % 25 + 1} do ciclo ${Math.floor((h.recorde - 1) / 25) + 1}` + (h.vitorias > 0 ? ` · ciclos completos: ${h.vitorias}` : '') + '.'
      : '';
    const ev = (await linhas(`SELECT nome, descricao FROM evento WHERE id = 1 + ${hojeNum()} % 5`))[0], md = melhorDoDia();
    $('diarioTxt').textContent = `Desafio de hoje: ${ev.nome.toLowerCase()} · todos começam iguais · `
      + (md ? `seu melhor: onda ${(md - 1) % 25 + 1}${md > 25 ? ` do ciclo ${Math.floor((md - 1) / 25) + 1}` : ''}` : 'você ainda não tentou');
    $('diarioTxt').title = ev.descricao;
    $('telaInicio').classList.remove('oculto');
  }
  if (h.estado === 'escolha') { await montarCartas(h); $('telaEscolha').classList.remove('oculto'); telaDesde = performance.now(); }
  if (h.estado === 'morto') {
    som('morte'); trauma = 1; await salvar();
    await dormir(1100);                       // deixa ver o ganso tombar antes do cartaz
    if (hudAtual.estado !== 'morto') return;
    const lugar = h.mundo_nome.toLowerCase().replace(/^o /, 'no ').replace(/^a /, 'na ');   // "no parque", "na fazenda"
    const plural = (n, um, varios) => `${n} ${n === 1 ? um : varios}`;
    $('morteTxt').textContent = `Caiu na onda ${h.onda_ciclo} do ciclo ${h.ciclo}, ${lugar}, depois de descontar o ódio em ${plural(h.abates, 'inimigo', 'inimigos')}. `
      + `Levou ${plural(h.migalhas, 'migalha', 'migalhas')} para o ninho. Volte mais forte.`;
    if (h.diario > 0) {
      const md = melhorDoDia(); if (h.onda > md) try { localStorage.setItem(CHAVE_DIA, JSON.stringify({ dia: h.diario, onda: h.onda })); } catch (_) {}
      $('morteTxt').textContent += h.onda > md ? ' Novo recorde do desafio de hoje!' : ` (Desafio do dia: seu melhor hoje é a onda ${(md - 1) % 25 + 1}.)`;
    }
    await montarPlacar();
    await montarLoja($('lojaMorte')); $('telaMorte').classList.remove('oculto'); telaDesde = performance.now();
  }
}

const hojeNum = () => { const d = new Date(); return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate(); };
const CHAVE_DIA = 'honk3d-desafio-do-dia';
function melhorDoDia() { try { const r = JSON.parse(localStorage.getItem(CHAVE_DIA) || 'null'); return r && r.dia === hojeNum() ? r.onda : 0; } catch (_) { return 0; } }
// PLACAR do fim: as estatísticas da partida viram "manchetes"
const VITIMAS = { pombo: 'pombos humilhados', crianca: 'crianças sem pão', cachorro: 'cachorros com vergonha', senhora: 'senhoras sem pombos',
  guarda: 'guardas multados', galinha: 'galinhas depenadas', bode: 'bodes sem chifre', fazendeiro: 'fazendeiros sem ovos', corvo: 'corvos espantados',
  espantalho: 'espantalhos desmontados', gato: 'gatos sem as sete vidas', feirante: 'feirantes fechados', vovo: 'carrinhos de feira virados',
  pasteleiro: 'pastéis devolvidos', caminhao: 'caminhões do gás sem gás', aspirador: 'robôs aspiradores desligados', promotor: 'cartões recusados',
  mascote: 'pelúcias rasgadas', patinete: 'patinetes confiscados', noel: 'Papais Noéis demitidos', drone: 'drones abatidos',
  carrinho: 'carrinhos de bagagem parados', controlador: 'controladores carimbados', seguranca: 'seguranças dispensados', airbus: 'Airbus aterrados' };
async function montarPlacar() {
  const e = Object.fromEntries((await linhas('SELECT chave, n FROM estat')).map((r) => [r.chave, Number(r.n)]));
  const itens = [];
  const abates = Object.entries(e).filter(([k]) => k.startsWith('abate:')).sort((a, b) => b[1] - a[1]).slice(0, 3);
  for (const [k, n] of abates) itens.push([n, VITIMAS[k.slice(6)] || k.slice(6)]);
  if (e.bicadas) itens.push([e.bicadas, `bicadas com raiva (${e.criticos || 0} críticas)`]);
  if (e.honks) itens.push([e.honks, 'HONKs no ouvido alheio']);
  if (e.esquivas) itens.push([e.esquivas, `esquivas (${e.perfeitas || 0} perfeitas)`]);
  const levou = Object.entries(e).filter(([k]) => k.startsWith('levou:')).sort((a, b) => b[1] - a[1])[0];
  if (levou) itens.push([levou[1], `coisas jogadas por ${levou[0].slice(6)} que te acertaram`]);
  if (e.dano_recebido) itens.push([e.dano_recebido, 'de dano engolido em silêncio']);
  $('placar').replaceChildren(...itens.slice(0, 8).map(([n, t]) => { const d = document.createElement('div'); const b = document.createElement('b'); b.textContent = n; d.append(b, t); return d; }));
}

async function comecar(diario = null) {
  if (pausado) alternarPausa();
  // o navegador só libera som depois de um clique: aproveita o clique de começar para ligar o áudio (e a música)
  try { audio ??= new (window.AudioContext || window.webkitAudioContext)(); audio.resume?.(); } catch (_) {}
  if (diario !== null) await conn.query(preencher(sql('sql-diario'), { d: diario }));   // null = repete o modo atual
  await conn.query(sql('sql-reiniciar'));
  await conn.query(sql('sql-carregar-mundo'));
  invalidarParedes(); repreparar = true;
  try { canvas.requestPointerLock(); } catch (_) {}
}
$('btnComecar').addEventListener('click', () => comecar(0));
$('btnDiario').addEventListener('click', () => comecar(hojeNum()));
$('btnDeNovo').addEventListener('click', () => { if (performance.now() - telaDesde > 600) comecar(null); });

