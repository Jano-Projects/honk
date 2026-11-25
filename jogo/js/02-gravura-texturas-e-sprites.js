// HONK! — jogo/js/02-gravura-texturas-e-sprites.js
// A MATRIZ DE GRAVURA: texturas de parede entalhadas na hora, hachuras de distância e a
// conversão dos sprites em pixel art (tabela sprite do SQL) para o estilo xilogravura.
// (ferramentas/montar.py junta todos os .js desta pasta, em ordem, num único <script type="module">)

// ---------- 2. A MATRIZ: texturas, hachuras e sprites "entalhados" ----------
// Cada mundo tem papel, tinta e destaque (vêm do SQL). Ao trocar de mundo,
// a matriz inteira é entalhada de novo com as cores novas.
let COR = { papel: '#ede0bd', tinta: '#1c1611', destaque: '#b8322a' };
const novaTela = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const sorteador = (n) => { let s = (n * 9301 + 49297) % 233280 || 7; return () => (s = (s * 9301 + 49297) % 233280) / 233280; };

// traço de goiva: linha levemente tremida, como corte na madeira
function goiva(g, pts, larg, cor, rnd, tremor = 0.6) {
  g.strokeStyle = cor; g.lineWidth = larg; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath();
  pts.forEach(([x, y], i) => { const jx = x + (rnd() - 0.5) * tremor, jy = y + (rnd() - 0.5) * tremor; i ? g.lineTo(jx, jy) : g.moveTo(jx, jy); });
  g.stroke();
}

// Texturas 64x64 de cada entalhe de parede (T = tinta, Pp = papel, R = destaque)
const TEX = 128;   // as texturas são entalhadas em 128x128 (o desenho abaixo pensa em 64 e escala 2x)
function entalhar(padrao) {
  const c = novaTela(TEX, TEX), g = c.getContext('2d');
  g.scale(TEX / 64, TEX / 64);
  const T = COR.tinta, Pp = COR.papel, R = COR.destaque, rnd = sorteador(padrao.length * 31 + padrao.charCodeAt(0));
  const fundo = (cor) => { g.fillStyle = cor; g.fillRect(0, 0, 64, 64); };
  const rect = (x, y, w, h, cor) => { g.fillStyle = cor; g.fillRect(x, y, w, h); };
  switch (padrao) {
    case 'madeira':      // cerca de tábuas do parque
      fundo(T);
      for (let x = 0; x < 64; x += 16) {
        rect(x, 0, 2, 64, Pp);
        for (let k = 0; k < 3; k++) { const bx = x + 4 + k * 4; goiva(g, Array.from({ length: 9 }, (_, i) => [bx + Math.sin(i * 0.9 + k) * 1.2, 4 + i * 6]), 0.9, Pp, rnd); }
      }
      rect(0, 6, 64, 2, Pp); rect(0, 52, 64, 2, Pp);
      for (let x = 2; x < 64; x += 5) goiva(g, [[x, 64], [x + 1, 58 + rnd() * 3]], 1, Pp, rnd);
      break;
    case 'arvore':       // copa entalhada em cima, tronco no meio, papel dos lados
      fundo(Pp);
      rect(0, 0, 64, 42, T);
      for (let y = 6; y < 40; y += 7) for (let x = (y % 14 ? 3 : 7); x < 64; x += 9) {
        g.strokeStyle = Pp; g.lineWidth = 1.1; g.beginPath(); g.arc(x, y, 3, 0.15 * Math.PI, 0.85 * Math.PI); g.stroke();
      }
      g.fillStyle = Pp; for (let x = 0; x < 64; x += 8) { g.beginPath(); g.arc(x + 4, 42, 4, 0, Math.PI); g.fill(); }
      rect(24, 40, 16, 24, T);
      for (let k = 0; k < 3; k++) goiva(g, [[27 + k * 4, 44], [28 + k * 4, 52], [27 + k * 4, 63]], 1, Pp, rnd);
      for (let x = 2; x < 64; x += 4) if (x < 22 || x > 42) goiva(g, [[x, 64], [x + 1, 59]], 1, T, rnd);
      break;
    case 'folhagem':     // cerca-viva com folhinhas em "v"
      fundo(T);
      g.fillStyle = Pp; for (let x = 0; x < 64; x += 8) { g.beginPath(); g.arc(x + 4, 0, 4, 0, Math.PI); g.fill(); }
      for (let y = 9; y < 60; y += 6) for (let x = (y % 12 ? 2 : 5); x < 64; x += 7) goiva(g, [[x, y], [x + 2, y + 3], [x + 4, y]], 1, Pp, rnd, 0.4);
      break;
    case 'chafariz':     // pedras com água ondulando em cima
      fundo(T);
      for (let y = 22; y < 64; y += 10) { rect(0, y, 64, 1.5, Pp); for (let x = (y % 20 ? 6 : 16); x < 64; x += 20) rect(x, y, 1.5, 10, Pp); }
      rect(0, 0, 64, 20, Pp);
      for (let y = 4; y < 19; y += 5) goiva(g, Array.from({ length: 17 }, (_, i) => [i * 4, y + Math.sin(i * 1.3 + y) * 1.5]), 1.1, T, rnd, 0.3);
      rect(0, 19, 64, 2, T);
      break;
    case 'quiosque':     // toldo listrado vermelho, pipoca e balcão
      fundo(Pp);
      for (let x = 0; x < 64; x += 16) rect(x, 0, 8, 16, R);
      g.fillStyle = Pp; for (let x = 0; x < 64; x += 8) { g.beginPath(); g.arc(x + 4, 16, 4, 0, Math.PI); g.fillStyle = (x / 8) % 2 ? Pp : R; g.fill(); }
      rect(0, 0, 64, 1.5, T); rect(0, 15.5, 64, 1, T);
      for (let k = 0; k < 18; k++) { g.fillStyle = T; g.beginPath(); g.arc(6 + rnd() * 52, 26 + rnd() * 14, 1.3 + rnd(), 0, 7); g.fill(); }
      rect(0, 44, 64, 20, T); rect(0, 47, 64, 1.2, Pp); for (let x = 4; x < 64; x += 12) rect(x, 50, 1.2, 14, Pp);
      break;
    case 'trilho':       // cerca rústica da fazenda: dá para "ver" o papel entre as tábuas
      fundo(Pp);
      rect(0, 16, 64, 9, T); rect(0, 38, 64, 9, T); rect(26, 4, 12, 60, T);
      goiva(g, [[0, 20], [64, 21]], 0.9, Pp, rnd); goiva(g, [[0, 42], [64, 43]], 0.9, Pp, rnd);
      for (let k = 0; k < 3; k++) goiva(g, [[29 + k * 3, 8], [29.5 + k * 3, 60]], 0.9, Pp, rnd);
      for (let x = 1; x < 64; x += 4) goiva(g, [[x, 64], [x + 1, 58 + rnd() * 3]], 1, T, rnd);
      break;
    case 'celeiro':      // celeiro vermelho com tábuas e o X da porta
      fundo(R);
      for (let x = 0; x < 64; x += 8) rect(x, 0, 1.2, 64, T);
      rect(0, 0, 64, 6, T);
      g.strokeStyle = Pp; g.lineWidth = 3; g.strokeRect(14, 22, 36, 42);
      g.beginPath(); g.moveTo(14, 22); g.lineTo(50, 64); g.moveTo(50, 22); g.lineTo(14, 64); g.stroke();
      break;
    case 'feno':         // fardo de feno: palha riscada e duas cintas
      fundo(Pp);
      for (let y = 3; y < 62; y += 3) for (let x = (y % 6 ? 0 : 4); x < 64; x += 9) goiva(g, [[x, y], [x + 6, y + (rnd() - 0.5) * 2]], 1, T, rnd, 0.3);
      rect(12, 0, 4, 64, T); rect(46, 0, 4, 64, T); rect(0, 0, 64, 2, T); rect(0, 62, 64, 2, T);
      break;
    case 'pedra':        // muro de pedra seca
      fundo(Pp);
      for (let y = 0; y < 64; y += 13) for (let x = (y % 26 ? -8 : 0); x < 64; x += 16) {
        g.fillStyle = T; g.beginPath(); g.roundRect(x + 1, y + 1, 14, 11, 4); g.fill();
        goiva(g, [[x + 4, y + 4], [x + 9, y + 3]], 0.8, Pp, rnd);
      }
      break;
    case 'alambrado':    // aeroporto (matriz invertida): tela de arame
      fundo(Pp);
      g.strokeStyle = T; g.lineWidth = 0.8;
      for (let k = -64; k < 64; k += 8) { g.beginPath(); g.moveTo(k, 64); g.lineTo(k + 64, 0); g.moveTo(k, 0); g.lineTo(k + 64, 64); g.stroke(); }
      rect(0, 0, 3, 64, T); rect(32, 0, 3, 64, T); rect(0, 4, 64, 1.5, T);
      goiva(g, Array.from({ length: 17 }, (_, i) => [i * 4, 1 + (i % 2) * 2]), 1, T, rnd, 0.2);
      break;
    case 'hangar':       // chapa ondulada e faixa de alerta
      fundo(T);
      for (let x = 2; x < 64; x += 4) rect(x, 6, 1, 46, Pp);
      rect(0, 0, 64, 5, Pp); rect(0, 5, 64, 1, T);
      for (let x = -16; x < 64; x += 10) { g.fillStyle = R; g.beginPath(); g.moveTo(x, 64); g.lineTo(x + 5, 64); g.lineTo(x + 15, 52); g.lineTo(x + 10, 52); g.fill(); }
      rect(0, 52, 64, 1.2, Pp);
      break;
    case 'terminal':     // janelas acesas na madrugada
      fundo(Pp);
      for (let y = 8; y < 46; y += 13) for (let x = 3; x < 64; x += 12) rect(x, y, 8, 9, rnd() < 0.8 ? T : R);
      rect(0, 0, 64, 4, T); rect(0, 50, 64, 14, T);
      for (let x = 0; x < 64; x += 6) rect(x, 53, 1, 11, Pp);
      break;
    case 'barreira':     // barreira de concreto com listras de alerta
      fundo(T);
      rect(0, 0, 64, 3, Pp);
      for (let x = -24; x < 64; x += 12) { g.fillStyle = R; g.beginPath(); g.moveTo(x, 64); g.lineTo(x + 6, 64); g.lineTo(x + 24, 40); g.lineTo(x + 18, 40); g.fill(); }
      rect(0, 39, 64, 1.5, Pp);
      for (let k = 0; k < 5; k++) goiva(g, [[rnd() * 64, 8 + rnd() * 28], [rnd() * 64, 8 + rnd() * 28]], 0.7, Pp, rnd, 0.4);
      break;
    case 'aviao':        // fuselagem com janelinhas e faixa
      fundo(T);
      for (let x = 3; x < 64; x += 7) { g.fillStyle = Pp; g.beginPath(); g.roundRect(x, 16, 4, 6, 2); g.fill(); }
      rect(0, 30, 64, 6, R); rect(0, 29, 64, 1, Pp); rect(0, 36, 64, 1, Pp);
      for (let y = 44; y < 64; y += 3) rect(0, y, 64, 1, Pp);
      break;
    case 'lona':         // barraca de feira: toldo listrado, borda em ondinhas, balcão escuro
      fundo(Pp);
      for (let x = 0; x < 64; x += 16) rect(x, 0, 8, 26, R);
      g.fillStyle = Pp; for (let x = 0; x < 64; x += 8) { g.beginPath(); g.arc(x + 4, 26, 4, 0, Math.PI); g.fill(); }
      g.fillStyle = R; for (let x = 0; x < 64; x += 16) { g.beginPath(); g.arc(x + 4, 26, 4, 0, Math.PI); g.fill(); }
      rect(0, 40, 64, 24, T); rect(0, 40, 64, 2, Pp);
      for (let x = 4; x < 64; x += 9) { g.fillStyle = Pp; g.beginPath(); g.arc(x, 46, 2.5, 0, 7); g.fill(); }   // frutas no balcão
      for (let x = 3; x < 64; x += 6) goiva(g, [[x, 52], [x + 1, 63]], 0.8, Pp, rnd);
      break;
    case 'caixote':      // pilha de caixotes de madeira com travessa em X
      fundo(T);
      for (let y = 0; y < 64; y += 32) for (let x = 0; x < 64; x += 32) {
        g.strokeStyle = Pp; g.lineWidth = 1.6; g.strokeRect(x + 2, y + 2, 28, 28);
        g.beginPath(); g.moveTo(x + 3, y + 3); g.lineTo(x + 29, y + 29); g.moveTo(x + 29, y + 3); g.lineTo(x + 3, y + 29); g.stroke();
        for (let k = 0; k < 3; k++) goiva(g, [[x + 6, y + 8 + k * 7], [x + 26, y + 9 + k * 7]], 0.6, Pp, rnd, 0.5);
      }
      break;
    case 'vitrine':      // vitrine de loja: letreiro, vidro com reflexos, manequim
      fundo(Pp);
      rect(0, 0, 64, 12, T); rect(6, 4, 52, 4, R);
      rect(0, 12, 3, 52, T); rect(61, 12, 3, 52, T); rect(0, 58, 64, 6, T);
      g.fillStyle = T; g.beginPath(); g.arc(22, 26, 4, 0, 7); g.fill(); rect(18, 30, 8, 18, T); rect(20, 48, 4, 10, T);
      g.strokeStyle = T; g.lineWidth = 0.8;
      for (const x of [34, 40, 46]) { g.beginPath(); g.moveTo(x, 54); g.lineTo(x + 12, 16); g.stroke(); }
      break;
    case 'pilar':        // pilar de shopping com caneluras
      fundo(T);
      rect(0, 0, 64, 6, Pp); rect(0, 58, 64, 6, Pp); rect(0, 8, 64, 1, Pp); rect(0, 55, 64, 1, Pp);
      for (let x = 4; x < 64; x += 8) goiva(g, Array.from({ length: 8 }, (_, i) => [x + Math.sin(i) * 0.4, 11 + i * 6]), 1.1, Pp, rnd);
      break;
    default: fundo(T);
  }
  return c;
}

let texturas = {}, hachuras = [], graoPapel = null, imagens = {}, pixelArt = {}, papelDe = {};

// hachuras de distância: linhas de papel por cima da parede (mais longe = mais linhas)
function gerarHachuras() {
  const k = ESC / 2;
  hachuras = [10, 7, 5, 3.4, 2.4].map((esp, n) => {
    const c = novaTela(W * ESC, VH * ESC), g = c.getContext('2d');
    g.fillStyle = COR.papel;
    for (let y = n % 2; y < VH * ESC; y += esp * k) g.fillRect(0, Math.round(y), W * ESC, Math.max(1, Math.round(k)));
    return c;
  });
  // grão do papel: pontinhos de tinta e fibras claras, desenhados uma vez
  graoPapel = $('grao'); graoPapel.width = W * ESC; graoPapel.height = H * ESC;
  const g = graoPapel.getContext('2d'), rnd = sorteador(99);
  g.clearRect(0, 0, graoPapel.width, graoPapel.height);
  g.fillStyle = COR.tinta; g.globalAlpha = 0.09;
  for (let i = 0; i < 900 * k * k; i++) g.fillRect(rnd() * W * ESC, rnd() * H * ESC, (1 + rnd() * 1.5) * k, (1 + rnd() * 1.5) * k);
  g.fillStyle = COR.papel; g.globalAlpha = 0.12;
  for (let i = 0; i < 260 * k * k; i++) g.fillRect(rnd() * W * ESC, rnd() * H * ESC, (3 + rnd() * 9) * k, k);
}

// Converte a pixel art do SQL em gravura: cada cor vira tinta, papel ou destaque
// (conforme a coluna "tinta" da paleta), com contorno de tinta, um halo de papel
// (para destacar o bicho da parede preta) e marcas de goiva no preto.
function gravarSprite(px, flash) {
  const F = 5, M = 2, w = Math.max(...px.map((l) => l.length)), h = px.length;
  const cls = px.map((l) => [...l.padEnd(w, '.')].map((ch) => (ch === '.' ? '' : (papelDe[ch] || 'tinta'))));
  // "contraste": olho preto em rosto claro, olho claro em corpo preto
  const viz = (x, y) => [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => cls[y + dy]?.[x + dx]).filter((v) => v && v !== 'contraste');
  const final = cls.map((linha, y) => linha.map((v, x) => {
    if (v !== 'contraste') return v;
    const n = viz(x, y); const t = n.filter((k) => k === 'tinta').length;
    return n.length && t >= n.length - t ? 'papel' : 'tinta';
  }));
  const c = novaTela((w + 2 * M) * F, (h + 2 * M) * F), g = c.getContext('2d');
  const cel = (x, y, cresce, cor) => { g.fillStyle = cor; g.fillRect((x + M) * F - cresce, (y + M) * F - cresce, F + 2 * cresce, F + 2 * cresce); };
  // (só tamanhos inteiros: a gravura tem que ter tinta e papel puros, sem pixels cinza de transição)
  final.forEach((l, y) => l.forEach((v, x) => { if (v) cel(x, y, F, COR.papel); }));           // halo de papel
  final.forEach((l, y) => l.forEach((v, x) => { if (v) cel(x, y, 2, COR.tinta); }));           // contorno de tinta
  final.forEach((l, y) => l.forEach((v, x) => {
    if (!v) return;
    cel(x, y, 0, flash ? COR.destaque : (v === 'tinta' ? COR.tinta : v === 'destaque' ? COR.destaque : COR.papel));
  }));
  if (!flash) {                                                                                // marcas de goiva no preto
    g.fillStyle = COR.papel;
    final.forEach((l, y) => l.forEach((v, x) => {
      const dentro = v === 'tinta' && [[1, 0], [-1, 0], [0, 1], [0, -1]].every(([dx, dy]) => final[y + dy]?.[x + dx] === 'tinta');
      if (dentro && (x + 2 * y) % 3 === 0) {                                 // risco diagonal, pixel a pixel
        for (let k = 1; k < F - 1; k++) g.fillRect((x + M) * F + k, (y + M) * F + F - 1 - k, 1, 1);
      }
    }));
  }
  return { img: c, w, h, m: M };
}

function entalharMundo() {
  texturas = {};
  for (const p of ['madeira', 'arvore', 'folhagem', 'chafariz', 'quiosque', 'trilho', 'celeiro', 'feno', 'pedra',
                   'alambrado', 'hangar', 'terminal', 'barreira', 'aviao']) texturas[p] = entalhar(p);
  gerarHachuras();
  imagens = {};
  for (const [tipo, px] of Object.entries(pixelArt)) imagens[tipo] = { normal: gravarSprite(px, false), flash: gravarSprite(px, true) };
  const raiz = document.documentElement.style;
  raiz.setProperty('--papel', COR.papel); raiz.setProperty('--tinta', COR.tinta); raiz.setProperty('--destaque', COR.destaque);
}

// a resolução interna acompanha o tamanho real da tela (mais nítido em monitor grande)
function ajustarResolucao() {
  const larg = canvas.getBoundingClientRect().width * (window.devicePixelRatio || 1);
  const novo = window.__honkEsc || Math.max(2, Math.min(4, Math.round(larg / W)));
  if (novo === ESC && canvas.width === W * ESC) return;
  ESC = novo; canvas.width = W * ESC; canvas.height = H * ESC;
  if (texturas.madeira) gerarHachuras();
}
addEventListener('resize', ajustarResolucao);
document.addEventListener('fullscreenchange', () => setTimeout(ajustarResolucao, 50));

async function carregarArte() {
  for (const r of await linhas('SELECT ch, tinta FROM paleta')) papelDe[r.ch] = r.tinta;
  pixelArt = {};
  for (const r of await linhas('SELECT tipo, pixels FROM sprite ORDER BY tipo, linha')) (pixelArt[r.tipo] ??= []).push(r.pixels);
}

// dados fixos de cada mundo: horizonte e mapa (minimapa); ao trocar, entalha tudo de novo
let mundoCarregado = 0, horizonte = new Float32Array(256), minimapa = [];
async function carregarMundoVisual(m) {
  mundoCarregado = m;
  const w = (await linhas(`SELECT papel, tinta, destaque FROM mundo WHERE id = ${Number(m) | 0}`))[0];
  COR = { papel: w.papel, tinta: w.tinta, destaque: w.destaque };
  const h = await linhas(`SELECT i, alt FROM horizonte WHERE mundo = ${Number(m) | 0} ORDER BY i`);
  horizonte = Float32Array.from(h.map((r) => r.alt));
  minimapa = await linhas('SELECT x, y FROM mapa');
  entalharMundo();
}

