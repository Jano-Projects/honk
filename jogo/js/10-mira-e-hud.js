// HONK! — jogo/js/10-mira-e-hud.js
// MIRA E RODAPÉ: quem vai levar a bicada, setas de ameaça, riscos da esquiva, minimapa,
// a barra de status (vida, HONK, onda, migalhas) e o registro de eventos.
// (ferramentas/montar.py junta todos os .js desta pasta, em ordem, num único <script type="module">)

// ALVO DA BICADA: o mesmo teste do SQL (cone + alcance), feito aqui só para mostrar quem vai levar
function alvoDaBicada(h, lista) {
  let melhor = null, dm = 1e9; const c = Math.cos(h.ang), sn = Math.sin(h.ang);
  for (const s of lista) {
    if (s.kind !== 'inimigo' || s.vida <= 0) continue;
    const rx = s.wx - h.px, ry = s.wy - h.py, d = Math.hypot(rx, ry) + 1e-9;
    const col = Math.round(s.sx);
    if (col >= 0 && col < W && s.ty >= zbuf[col]) continue;          // atrás da parede: a bicada também não alcança
    if (d < (h.alcance || 1.4) + 0.2 + s.escala * 0.25 && (rx * c + ry * sn) / d > 0.6 && d < dm) { dm = d; melhor = s; }
  }
  return melhor;
}
let alvoAnterior = null, alvoMola = { x: 0, v: 0 };
function imprimirAlvo(h, lista) {
  const a = alvoDaBicada(h, lista);
  if (a !== alvoAnterior) { alvoMola.x = 0; alvoAnterior = a; }
  if (!a || a.ty <= 0.2) return;
  const k = mola(alvoMola, 1, 260, 14), base = VH / a.ty, topo = HORIZ + CAMZ * base - base * a.alt - base * a.escala;
  const pronto = (hudAtual.bico_cd ?? 0) <= 0, y = topo - 6 - Math.abs(Math.sin(relogio * 6)) * 2, x = a.sx;
  ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
  ctx.fillStyle = pronto ? COR.destaque : COR.tinta; ctx.strokeStyle = COR.tinta; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(-5, -6); ctx.lineTo(5, -6); ctx.lineTo(0, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.restore();
  // colchetes de mira em volta do corpo
  const w = Math.max(6, base * a.escala * 0.45) * (2 - k), y0 = topo, y1 = topo + base * a.escala;
  ctx.strokeStyle = COR.destaque; ctx.lineWidth = 1.2; ctx.globalAlpha = 0.85;
  for (const sx of [-1, 1]) { ctx.beginPath(); ctx.moveTo(x + sx * (w - 3), y0); ctx.lineTo(x + sx * w, y0); ctx.lineTo(x + sx * w, y0 + 4);
    ctx.moveTo(x + sx * w, y1 - 4); ctx.lineTo(x + sx * w, y1); ctx.lineTo(x + sx * (w - 3), y1); ctx.stroke(); }
  ctx.globalAlpha = 1;
}
// AMEAÇAS FORA DA TELA: setas vermelhas na borda apontando quem está chegando pelos lados e por trás
function imprimirAmeacas(h, lista) {
  for (const s of lista) {
    if (s.kind !== 'inimigo' && s.kind !== 'proj') continue;
    const rx = s.wx - h.px, ry = s.wy - h.py, d = Math.hypot(rx, ry);
    if (d > 7 || d < 0.05) continue;
    let a = Math.atan2(ry, rx) - h.ang; a = Math.atan2(Math.sin(a), Math.cos(a));
    if (Math.abs(a) < 0.55 && s.ty > 0.2) continue;                     // já aparece na tela
    if (s.kind === 'proj' && d > 3.5) continue;
    const perto = 1 - d / 7, lado = Math.sign(a) || 1, atras = (Math.abs(a) - 0.55) / (Math.PI - 0.55);
    const x = lado > 0 ? W - 8 : 8, y = limita(VH * 0.42 + atras * VH * 0.45, 14, VH - 10);
    const tam = 3 + perto * 5, pisca = d < 1.6 ? 0.5 + 0.5 * Math.sin(relogio * 18) : 1;
    ctx.globalAlpha = (0.35 + perto * 0.65) * pisca;
    ctx.fillStyle = s.kind === 'proj' ? COR.tinta : COR.destaque; ctx.strokeStyle = COR.tinta; ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(x + lado * tam, y); ctx.lineTo(x - lado * tam * 0.6, y - tam); ctx.lineTo(x - lado * tam * 0.6, y + tam); ctx.closePath(); ctx.fill(); ctx.stroke();
  }
  ctx.globalAlpha = 1;
}
// ESQUIVA: riscos de velocidade nas bordas, como gravura de movimento
function imprimirArrancada(h) {
  const k = limita(h.esquiva / 0.22, 0, 1), rnd = sorteador(Math.floor(relogio * 30));
  ctx.fillStyle = COR.tinta; ctx.globalAlpha = 0.25 + 0.5 * k;
  for (let n = 0; n < 22; n++) {
    const an = rnd() * Math.PI * 2, r0 = 70 + rnd() * 30, r1 = r0 + 20 + rnd() * 40 * k;
    const cx = W / 2, cy = HORIZ;
    ctx.beginPath(); ctx.moveTo(cx + Math.cos(an - 0.01) * r0, cy + Math.sin(an - 0.01) * r0 * 0.7);
    ctx.lineTo(cx + Math.cos(an) * r1, cy + Math.sin(an) * r1 * 0.7); ctx.lineTo(cx + Math.cos(an + 0.01) * r0, cy + Math.sin(an + 0.01) * r0 * 0.7); ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function imprimirMinimapa(h, lista) {
  const k = 2.3, ox = W - 20 * k - 5, oy = 5;
  ctx.fillStyle = COR.papel; ctx.fillRect(ox - 2, oy - 2, 20 * k + 4, 20 * k + 4);
  ctx.strokeStyle = COR.tinta; ctx.lineWidth = 1; ctx.strokeRect(ox - 2, oy - 2, 20 * k + 4, 20 * k + 4);
  ctx.fillStyle = COR.tinta;
  for (const c of minimapa) ctx.fillRect(ox + c.x * k, oy + c.y * k, k, k);
  ctx.fillStyle = COR.destaque;
  for (const s of lista) if (s.kind === 'inimigo') ctx.fillRect(ox + s.wx * k - 1.2, oy + s.wy * k - 1.2, 2.4, 2.4);
  const px = ox + h.px * k, py = oy + h.py * k;
  ctx.fillStyle = COR.tinta; ctx.beginPath();
  ctx.moveTo(px + Math.cos(h.ang) * 4, py + Math.sin(h.ang) * 4);
  ctx.lineTo(px + Math.cos(h.ang + 2.5) * 3, py + Math.sin(h.ang + 2.5) * 3);
  ctx.lineTo(px + Math.cos(h.ang - 2.5) * 3, py + Math.sin(h.ang - 2.5) * 3); ctx.fill();
}

// Barra de status: rodapé do folheto, com o rosto do ganso escolhido pelo SQL
// estado visual do rodapé: valores que "correm" atrás dos reais
const HUD = { vida: null, fantasma: null, segura: 0, mig: null, migPulo: 0, honkPronto: false, honkPulso: 0,
              rosto: '', rostoPulo: 0, onda: 0, ondaPulo: 0 };
function imprimirStatus(h) {
  const T = COR.tinta, Pp = COR.papel, R = COR.destaque, y0 = VH, dt = dtQuadro;
  const vidaReal = Math.max(0, h.vida);
  if (HUD.vida === null || h.estado === 'inicio') { HUD.vida = HUD.fantasma = vidaReal; HUD.mig = h.migalhas; }
  // vida: a barra vermelha desce rápido; um "fantasma" de tinta fica para trás e desce depois (mostra o tamanho do golpe)
  HUD.vida = suave(HUD.vida, vidaReal, 18);
  if (vidaReal < HUD.fantasma) { HUD.segura += dt; if (HUD.segura > 0.45) HUD.fantasma = Math.max(vidaReal, HUD.fantasma - h.vida_max * dt * 0.9); }
  else { HUD.fantasma = vidaReal; HUD.segura = 0; }
  if (h.migalhas > HUD.mig + 0.5) HUD.migPulo = 1;
  HUD.mig = h.migalhas < HUD.mig ? h.migalhas : suave(HUD.mig, h.migalhas, 7);           // migalhas contam subindo
  const pronto = h.honk_cd <= 0; if (pronto && !HUD.honkPronto) HUD.honkPulso = 1; HUD.honkPronto = pronto;
  if (h.rosto !== HUD.rosto) { if (HUD.rosto) HUD.rostoPulo = 1; HUD.rosto = h.rosto; }
  if (h.onda !== HUD.onda) { if (HUD.onda) HUD.ondaPulo = 1; HUD.onda = h.onda; }
  for (const k of ['migPulo', 'honkPulso', 'rostoPulo', 'ondaPulo']) HUD[k] = Math.max(0, HUD[k] - dt * 2.5);
  const salta = (p) => 1 + Math.sin(p * Math.PI) * 0.35 * p;   // pulinho que morre

  ctx.fillStyle = Pp; ctx.fillRect(0, y0, W, H - y0);
  ctx.fillStyle = T; ctx.fillRect(0, y0, W, 2); ctx.fillRect(0, y0 + 3.5, W, 0.7);
  for (let x = 6; x < W; x += 12) { ctx.beginPath(); ctx.moveTo(x, y0 + 5.5); ctx.lineTo(x + 2, y0 + 7.5); ctx.lineTo(x, y0 + 9.5); ctx.lineTo(x - 2, y0 + 7.5); ctx.fill(); }
  for (const x of [104, 146, 176, 246]) ctx.fillRect(x, y0 + 11, 1, 27);
  const rot = (t, x, y, tam = 7, cor = T, al = 'left', fam = 'Elite') => { ctx.font = fonte(tam, fam); ctx.textAlign = al; ctx.fillStyle = cor; ctx.fillText(t, x, y); };
  const rotSalta = (t, x, y, tam, cor, al, p) => {            // texto que dá um pulinho a partir da base
    const k = salta(p); ctx.save(); ctx.translate(x, y); ctx.scale(k, k); rot(t, 0, 0, tam, cor, al, 'Rye'); ctx.restore();
  };
  const barra = (x, y, w, f, cor) => {
    ctx.fillStyle = T; ctx.fillRect(x, y, w, 6); ctx.fillStyle = Pp; ctx.fillRect(x + 1, y + 1, w - 2, 4);
    ctx.fillStyle = cor; ctx.fillRect(x + 1, y + 1, (w - 2) * limita(f, 0, 1), 4);
  };
  rot('VIDA', 8, y0 + 19);
  rotSalta(String(vidaReal), 98, y0 + 22, 15, R, 'right', h.dor > 0 ? Math.min(1, h.dor * 2.5) : 0);
  barra(8, y0 + 27, 90, HUD.fantasma / h.vida_max, T);
  // hachura no fantasma (parece tinta raspada)
  ctx.fillStyle = Pp; for (let x = 9; x < 9 + 88 * limita(HUD.fantasma / h.vida_max, 0, 1); x += 3) ctx.fillRect(x, y0 + 28, 1, 4);
  ctx.fillStyle = R; ctx.fillRect(9, y0 + 28, 88 * limita(HUD.vida / h.vida_max, 0, 1), 4);
  rot('HONK', 110, y0 + 19);
  barra(110, y0 + 23, 31, 1 - h.honk_cd / h.honk_recarga, pronto ? R : T);
  if (pronto) {                                               // pronto: moldura pulsa (e estoura quando acaba de carregar)
    const p = HUD.honkPulso, resp = 0.5 + 0.5 * Math.sin(relogio * 5);
    ctx.strokeStyle = R; ctx.lineWidth = 0.8 + p * 1.5; ctx.globalAlpha = Math.max(p, 0.25 + 0.35 * resp);
    ctx.strokeRect(108.5 - p * 3, y0 + 21.5 - p * 3, 34 + p * 6, 9 + p * 6); ctx.globalAlpha = 1;
  }
  // esquiva: tracinho que enche; pronto = vermelho
  const esqF = 1 - limita((h.esquiva_cd || 0) / 0.9, 0, 1);
  ctx.fillStyle = T; ctx.fillRect(110, y0 + 31, 31, 3); ctx.fillStyle = Pp; ctx.fillRect(110.5, y0 + 31.5, 30, 2);
  ctx.fillStyle = esqF >= 1 ? R : T; ctx.fillRect(110.5, y0 + 31.5, 30 * esqF, 2);
  if (h.penas > 0) rot(`Q × ${h.penas}`, 110, y0 + 39.5, 5.5);
  const rosto = imagens[h.rosto] || imagens.rosto_normal;
  const kr = salta(HUD.rostoPulo), balanco = Math.sin(HUD.rostoPulo * 12) * 0.12 * HUD.rostoPulo;
  ctx.save(); ctx.translate(161, y0 + 39); ctx.rotate(balanco); ctx.scale(kr, kr); ctx.translate(-161, -(y0 + 39));
  ctx.fillStyle = T; ctx.fillRect(148, y0 + 10, 26, 29);
  if (rosto) ctx.drawImage(rosto.normal.img, 0, 0, rosto.normal.img.width, rosto.normal.img.height, 147, y0 + 9, 29, 31);
  ctx.restore();
  rot('ONDA', 182, y0 + 19);
  rotSalta(`${h.onda_ciclo}/25`, 240, y0 + 22, 13, HUD.ondaPulo > 0.3 ? R : T, 'right', HUD.ondaPulo);
  rot(`CICLO ${h.ciclo}`, 182, y0 + 28, 5.5, h.ciclo > 1 ? R : T);
  rot(h.mundo_nome, 182, y0 + 36, 6);
  rot('MIGALHAS', 252, y0 + 19, 6);
  rotSalta(String(Math.round(HUD.mig)), 312, y0 + 34, 15, R, 'right', HUD.migPulo);
}

const logEl = $('log');
let ultimoLog = '';
function atualizarLog(h) {
  if (h.ultimas === ultimoLog) return; ultimoLog = h.ultimas;
  logEl.replaceChildren(...(h.ultimas || '').split('|').filter(Boolean).map((t) => {
    const d = document.createElement('div'); d.textContent = t; return d;
  }));
}

