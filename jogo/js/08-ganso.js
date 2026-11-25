// HONK! — jogo/js/08-ganso.js
// O GANSO visto de trás: corpo, pescoço, cabeça, asas, bico, a evolução por ciclo
// (cicatriz, bandana, olhos em brasa, coroa) e todas as animações com mola.
// (ferramentas/montar.py junta todos os .js desta pasta, em ordem, num único <script type="module">)

// O GANSO visto de trás (terceira pessoa), em xilogravura e com animações:
// gingado ao andar, bote para a frente ao bicar, asas abertas e pescoço esticado no HONK,
// vermelho e tremendo ao levar dano, pulinho ao derrotar alguém, tombado quando cai.
let giroVisual = 0, ultimoPasso = 0, andando = 0, ultimoAng = 0, terceiraPessoa = true;
// molas do ganso: cabeça (atrasa e passa do ponto), corpo (estica/achata), asas, cauda
const M = { cab: { x: 0, v: 0 }, corpo: { x: 0, v: 0 }, asa: { x: 0, v: 0 }, cauda: { x: 0, v: 0 }, pesc: { x: 0, v: 0 } };
let mortoDesde = 0, honkAntes = 0, bicoAntes = 0;
// bicada com ANTECIPAÇÃO: recua um pouco, dá o bote rápido e volta devagar (p = 0..1)
function bote(p) {
  if (p <= 0 || p >= 1) return 0;
  if (p < 0.16) return -0.35 * Math.sin(p / 0.16 * Math.PI / 2);
  if (p < 0.4) { const k = (p - 0.16) / 0.24; return -0.35 + 1.35 * (1 - (1 - k) * (1 - k) * (1 - k)); }
  const k = (p - 0.4) / 0.6; return 1 - k * k * (3 - 2 * k);
}
function imprimirGanso(h, bob, t) {
  const T = COR.tinta, Pp = COR.papel, R = COR.destaque;
  const r = Math.max(0.75, h.recuo);
  const u = (0.52 * VH / r) / 100;                    // 1 "unidade" do desenho; o ganso tem ~100 de altura
  const pes = HORIZ + bob + CAMZ * VH / r;            // onde os pés tocam o chão
  // quanto está andando: pela VELOCIDADE do passo (independe do FPS), com transição suave
  const ginga = Math.sin(h.passo * 6) * andando;      // -1..1 a cada passo
  const bicada = h.bico_anim > 0 ? bote(1 - h.bico_anim / 0.18) : 0;
  const honk = h.honk_anim > 0 ? Math.min(1, h.honk_anim * 3) : 0;
  const pHonk = h.honk_anim > 0 ? 1 - h.honk_anim / 0.6 : 1;
  const pulo = h.feliz > 0 ? Math.abs(Math.sin(h.feliz * 9)) * 6 * Math.min(1, h.feliz * 2) : 0;
  const dor = h.dor > 0;
  const morto = h.estado === 'morto';
  // impulsos nas molas quando algo começa
  if (h.honk_anim > honkAntes + 0.1) { M.corpo.v -= 2.2; M.pesc.v -= 40; }   // HONK: o corpo encolhe e estica
  if (h.bico_anim > bicoAntes + 0.05) M.corpo.v += 0.8;
  honkAntes = h.honk_anim; bicoAntes = h.bico_anim;
  if (morto && !mortoDesde) mortoDesde = relogio; if (!morto) mortoDesde = 0;
  const respira = Math.sin(t * 2.4) * 0.018 * (1 - andando * 0.6);
  const corpo = mola(M.corpo, honk * 0.08 - Math.max(0, bicada) * 0.05 + respira, 220, 11);
  const cab = mola(M.cab, giroVisual * 10 + ginga * 2, 140, 10);          // a cabeça chega depois do corpo
  const pesc = mola(M.pesc, -honk * 14 - bicada * 10, 260, 16);
  const asa = mola(M.asa, honk, 120, 9);
  const cauda = mola(M.cauda, Math.sin(t * 3.1) * 0.12 + ginga * 0.25 - giroVisual * 0.3, 90, 7);
  const corCorpo = dor ? R : Pp;
  const esq = h.esquiva > 0 ? limita(h.esquiva / 0.22, 0, 1) : 0;
  let esqLado = 0;
  if (esq) { const c = Math.cos(h.ang), sn = Math.sin(h.ang); esqLado = limita(-h.esq_x * sn + h.esq_y * c, -1, 1); }
  // tremor de dor: oscilação rápida e contínua (não aleatória, para não "chuviscar")
  const treme = dor ? (Math.sin(relogio * 73) + Math.sin(relogio * 41) * 0.6) * Math.min(1, h.dor * 4) * 1.6 : 0;
  ctx.save();
  ctx.translate(W / 2 + treme, pes - pulo * u);
  // sombra no chão (encolhe quando pula)
  ctx.fillStyle = T; ctx.beginPath(); ctx.ellipse(0, pulo * u, 36 * u * (1 - pulo * 0.03), 6 * u, 0, 0, 7); ctx.fill();
  if (morto) {   // cai de lado com um quique (em vez de aparecer já deitado)
    const k = (relogio - mortoDesde) / 0.7;
    ctx.translate(0, -Math.sin(Math.min(1, k * 3) * Math.PI) * 8 * u * (k < 0.33 ? 1 : 0));
    ctx.rotate(1.35 * quica(k));
  }
  ctx.rotate(ginga * 0.07 - giroVisual * 0.15 + esqLado * esq * 0.35);
  if (esq) { ctx.globalAlpha = 0.55 + 0.25 * Math.sin(relogio * 60); ctx.translate(esqLado * esq * 10 * u, 0); ctx.scale(1 + esq * 0.12, 1 - esq * 0.1); }
  const contorno = (larg = 2.4) => { ctx.strokeStyle = T; ctx.lineWidth = larg * Math.max(0.6, u); ctx.lineJoin = 'round'; ctx.stroke(); };
  // pés (patas vermelhas), um levanta de cada vez
  for (const lado of [-1, 1]) {
    const ergue = Math.max(0, lado * ginga) * 5;
    ctx.fillStyle = R; ctx.beginPath();
    ctx.moveTo(lado * 10 * u, -2 * u - ergue * u); ctx.lineTo(lado * 18 * u, 2 * u - ergue * u); ctx.lineTo(lado * 3 * u, 2 * u - ergue * u); ctx.closePath();
    ctx.fill(); contorno(1.4);
  }
  // asas abertas no HONK (desenhadas atrás do corpo)
  if (asa > 0.08) {
    const bate = Math.sin(pHonk * 26) * 0.35 * honk;        // as asas batem enquanto grita
    for (const lado of [-1, 1]) {
      ctx.save(); ctx.translate(lado * 22 * u, -34 * u); ctx.rotate(lado * (0.3 + asa * 0.9 + bate));
      ctx.fillStyle = corCorpo; ctx.beginPath(); ctx.ellipse(lado * 18 * u, -4 * u, 24 * u, 9 * u, 0, 0, 7); ctx.fill(); contorno(2);
      ctx.strokeStyle = T; ctx.lineWidth = Math.max(0.6, u);
      for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(lado * (8 + k * 8) * u, 2 * u); ctx.lineTo(lado * (14 + k * 8) * u, -6 * u); ctx.stroke(); }
      ctx.restore();
    }
  }
  // corpo: ovo largo e baixo, com penas entalhadas nas costas
  const achata = 1 + corpo;
  ctx.save(); ctx.scale(achata, 2 - achata);
  ctx.fillStyle = corCorpo; ctx.beginPath(); ctx.ellipse(0, -24 * u, 34 * u, 23 * u, 0, 0, 7); ctx.fill(); contorno(2.6);
  ctx.strokeStyle = T; ctx.lineWidth = Math.max(0.6, 1.1 * u);
  for (const [y, n, larg] of [[-10, 4, 7], [-18, 3, 8]]) for (let k = 0; k < n; k++) {
    const x = (k - (n - 1) / 2) * larg * 1.6;
    ctx.beginPath(); ctx.arc(x * u, y * u, larg * 0.7 * u, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
  }
  // asas dobradas: duas "folhas" sobre os lados do corpo, com as penas riscadas
  if (asa <= 0.08) for (const lado of [-1, 1]) {
    ctx.save(); ctx.translate(lado * 19 * u, -27 * u); ctx.rotate(lado * -0.35);
    ctx.fillStyle = corCorpo; ctx.beginPath(); ctx.ellipse(0, 0, 13 * u, 21 * u, 0, 0, 7); ctx.fill(); contorno(2);
    ctx.strokeStyle = T; ctx.lineWidth = Math.max(0.5, 0.9 * u);
    for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(-lado * 7 * u, (-8 + k * 6) * u); ctx.lineTo(lado * 6 * u, (-3 + k * 6) * u); ctx.stroke(); }
    ctx.restore();
  }
  // cauda pontuda, para cima e para trás
  ctx.save(); ctx.translate(0, -6 * u); ctx.rotate(cauda);      // cauda abana
  ctx.fillStyle = corCorpo; ctx.beginPath(); ctx.moveTo(-9 * u, -2 * u); ctx.lineTo(0, 8 * u); ctx.lineTo(9 * u, -2 * u); ctx.fill(); contorno(1.6);
  ctx.restore();
  ctx.restore();
  // pescoço em S: grosso na base, afina até a cabeça; estica no HONK, dá o bote ao bicar
  const hx = cab * u, hy = (-84 + pesc + respira * 60) * u;
  const escCab = 1 - Math.max(0, bicada) * 0.18 + Math.max(0, -bicada) * 0.06;
  ctx.fillStyle = corCorpo; ctx.beginPath();
  ctx.moveTo(-10 * u, -40 * u);
  ctx.bezierCurveTo(-14 * u, -56 * u, hx + 2 * u, -60 * u, hx - 6 * u, hy + 8 * u);
  ctx.lineTo(hx + 6 * u, hy + 8 * u);
  ctx.bezierCurveTo(hx + 12 * u, -62 * u, 12 * u, -54 * u, 10 * u, -40 * u); ctx.closePath();
  ctx.fill(); contorno(2.2);
  ctx.strokeStyle = T; ctx.lineWidth = Math.max(0.5, 0.9 * u);
  for (let k = 0; k < 3; k++) { const f = (k + 1) / 4, yy = (-44 + (hy / u + 44) * f) * u, xx = hx * f;
    ctx.beginPath(); ctx.moveTo(xx - 4 * u, yy); ctx.quadraticCurveTo(xx, yy + 2 * u, xx + 4 * u, yy); ctx.stroke(); }
  // EVOLUÇÃO DO ÓDIO (a cada ciclo o ganso fica mais casca-grossa)
  const ciclo = h.ciclo || 1;
  if (ciclo >= 2) {                                    // ciclo 2: cicatriz costurada no pescoço
    ctx.strokeStyle = R; ctx.lineWidth = Math.max(0.6, 1.1 * u);
    const cy = -62 * u, cx0 = hx * 0.45;
    ctx.beginPath(); ctx.moveTo(cx0 - 7 * u, cy - 3 * u); ctx.lineTo(cx0 + 6 * u, cy + 4 * u); ctx.stroke();
    ctx.lineWidth = Math.max(0.5, 0.7 * u);
    for (let k = -2; k <= 2; k++) { const px = cx0 + k * 2.6 * u, py = cy + k * 1.4 * u; ctx.beginPath(); ctx.moveTo(px - 1.5 * u, py + 2 * u); ctx.lineTo(px + 1.5 * u, py - 2 * u); ctx.stroke(); }
  }
  // cabeça e bico (o bico aparece apontando para a frente, por cima da cabeça)
  ctx.save(); ctx.translate(hx, hy); ctx.scale(escCab, escCab);
  const abre = honk * 7;
  ctx.fillStyle = R; ctx.beginPath(); ctx.moveTo(-5 * u, -9 * u); ctx.lineTo(giroVisual * 9 * u, (-25 - abre) * u); ctx.lineTo(5 * u, -9 * u); ctx.fill(); contorno(1.6);
  if (abre > 0) { ctx.fillStyle = R; ctx.beginPath(); ctx.moveTo(-4 * u, -7 * u); ctx.lineTo(giroVisual * 9 * u, (-17 + abre * 0.6) * u); ctx.lineTo(4 * u, -7 * u); ctx.fill(); contorno(1.2); }
  ctx.fillStyle = corCorpo; ctx.beginPath(); ctx.ellipse(0, 0, 12 * u, 11 * u, 0, 0, 7); ctx.fill(); contorno(2.2);
  ctx.strokeStyle = T; ctx.lineWidth = Math.max(0.5, 0.8 * u);                 // penugem da nuca
  ctx.beginPath(); ctx.moveTo(-4 * u, 5 * u); ctx.lineTo(0, 8 * u); ctx.lineTo(4 * u, 5 * u); ctx.stroke();
  if (Math.abs(giroVisual) > 0.25) {                 // ao virar, aparece um olho de lado
    ctx.fillStyle = T; ctx.beginPath(); ctx.arc(Math.sign(giroVisual) * 6 * u, -2 * u, 1.6 * u, 0, 7); ctx.fill();
  }
  if (ciclo >= 4 && !morto) {                         // ciclo 4: olhos em brasa (aparecem dos dois lados) e fumaça de raiva
    ctx.fillStyle = R; for (const sx of [-1, 1]) { ctx.beginPath(); ctx.arc(sx * 10.5 * u, -3 * u, 1.9 * u, 0, 7); ctx.fill(); }
    ctx.fillStyle = T; ctx.globalAlpha = 0.6;
    for (let k = 0; k < 3; k++) { const f = (relogio * 0.9 + k / 3) % 1;
      ctx.beginPath(); ctx.arc((k - 1) * 6 * u + Math.sin(f * 9 + k) * 2 * u, (-14 - f * 22) * u, (2 + f * 3.5) * u, 0, 7); ctx.fill(); }
    ctx.globalAlpha = 1;
  }
  if (ciclo >= 3) {                                    // ciclo 3: bandana de pirata com as pontas balançando
    ctx.fillStyle = R; ctx.beginPath(); ctx.ellipse(0, -6 * u, 12.5 * u, 6.5 * u, 0, Math.PI, 2 * Math.PI); ctx.fill(); contorno(1.6);
    const bal = Math.sin(relogio * 7) * 2 * u + andando * Math.sin(relogio * 14) * 2 * u;
    for (const sx of [-1, 1]) { ctx.beginPath(); ctx.moveTo(sx * 3 * u, 4 * u); ctx.lineTo(sx * 8 * u + bal, 13 * u); ctx.lineTo(sx * 2 * u + bal * 0.5, 12 * u); ctx.closePath(); ctx.fill(); contorno(1.2); }
  }
  if (ciclo >= 5) {                                    // ciclo 5+: coroa (rei do ódio)
    ctx.fillStyle = Pp; ctx.beginPath(); ctx.moveTo(-8 * u, -10 * u);
    for (let k = 0; k <= 4; k++) { ctx.lineTo((-8 + k * 4) * u, (k % 2 ? -14 : -21) * u); }
    ctx.lineTo(8 * u, -10 * u); ctx.closePath(); ctx.fill(); contorno(1.6);
    ctx.fillStyle = R; for (const k of [0, 2, 4]) { ctx.beginPath(); ctx.arc((-8 + k * 4) * u, -21 * u, 1.4 * u, 0, 7); ctx.fill(); }
  }
  if (h.crit_garantido && !morto) {                    // crítico garantido: faíscas em volta da cabeça
    ctx.strokeStyle = R; ctx.lineWidth = Math.max(0.6, 1.2 * u);
    for (let k = 0; k < 4; k++) { const a = relogio * 5 + k * Math.PI / 2, r1 = 15 * u, r2 = (20 + Math.sin(relogio * 20 + k) * 2) * u;
      ctx.beginPath(); ctx.moveTo(Math.cos(a) * r1, Math.sin(a) * r1 - 4 * u); ctx.lineTo(Math.cos(a) * r2, Math.sin(a) * r2 - 4 * u); ctx.stroke(); }
  }
  if (morto) { ctx.strokeStyle = T; ctx.lineWidth = 1.2 * u; for (const sx of [-1, 1]) { ctx.beginPath(); ctx.moveTo((sx * 5 - 2) * u, -4 * u); ctx.lineTo((sx * 5 + 2) * u, 0); ctx.moveTo((sx * 5 + 2) * u, -4 * u); ctx.lineTo((sx * 5 - 2) * u, 0); ctx.stroke(); } }
  ctx.restore();
  ctx.restore();
  return pes - 50 * u;                                 // altura do peito: centro do HONK
}

