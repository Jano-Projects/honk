// HONK! — jogo/js/07-animacao-e-sprites.js
// ANIMAÇÃO E SPRITES: molas, curvas de animação, acompanhamento dos inimigos entre os
// retratos do SQL (velocidade, nascimento, tombo) e o desenho de inimigos, projéteis e efeitos.
// (ferramentas/montar.py junta todos os .js desta pasta, em ordem, num único <script type="module">)

let relogio = performance.now() / 1000, dtQuadro = 1 / 60;          // tempo real do quadro, em segundos
const limita = (v, a, b) => Math.max(a, Math.min(b, v));
const suave = (atual, alvo, rapidez) => atual + (alvo - atual) * (1 - Math.exp(-dtQuadro * rapidez));   // aproxima sem depender do FPS
// MOLA amortecida: passa do ponto e volta, dá "peso" ao movimento (k = rigidez, c = atrito)
function mola(m, alvo, k = 170, c = 13) {
  const passos = Math.max(1, Math.ceil(dtQuadro / 0.008)), d = dtQuadro / passos;
  for (let i = 0; i < passos; i++) { m.v += ((alvo - m.x) * k - m.v * c) * d; m.x += m.v * d; }
  return m.x;
}
const saiComMola = (k) => { k = limita(k, 0, 1) - 1; return 1 + 2.7 * k * k * k + 1.7 * k * k; };      // easeOutBack: cresce e passa um pouco
const quica = (k) => {                                                                              // easeOutBounce: cai e quica
  k = limita(k, 0, 1); const n = 7.5625, d = 2.75;
  if (k < 1 / d) return n * k * k; if (k < 2 / d) return n * (k -= 1.5 / d) * k + 0.75;
  if (k < 2.5 / d) return n * (k -= 2.25 / d) * k + 0.9375; return n * (k -= 2.625 / d) * k + 0.984375;
};
// deslocamento no MUNDO -> deslocamento na TELA (mesma projeção do SQL, linearizada em torno do sprite)
function projetaDelta(s, dwx, dwy, ang) {
  const dx = Math.cos(ang), dy = Math.sin(ang), plx = -dy * 0.66, ply = dx * 0.66, inv = 1 / (plx * dy - dx * ply);
  const tx = (s.sx / 160 - 1) * s.ty + inv * (dy * dwx - dx * dwy), ty = s.ty + inv * (-ply * dwx + plx * dwy);
  return ty > 0.05 ? { sx: 160 * (1 + tx / ty), ty } : { sx: s.sx, ty: s.ty };
}

// ACOMPANHAMENTO entre retratos: liga cada inimigo/projétil ao do retrato anterior (mesmo tipo, o mais perto).
// Daí saem a velocidade (movimento contínuo entre um retrato e outro), a hora em que nasceu (surge com
// um "pop") e quem sumiu porque foi derrotado (tomba no chão em vez de desaparecer).
let caidos = [];
function acompanhar(novos, h, agora) {
  const velhos = retrato ? retrato.sprites : [], dtR = retrato ? Math.max(0.01, (agora - retrato.t) / 1000) : 1;
  const usados = new Set(), mesmoMundo = retrato && retrato.h.mundo === h.mundo && retrato.h.estado === h.estado;
  for (const s of novos) {
    s.vx = 0; s.vy = 0; s.nasceu = -1e9;
    if (s.kind !== 'inimigo' && s.kind !== 'proj') continue;
    let melhor = -1, dmin = s.kind === 'proj' ? 1.6 : 0.9;
    for (let i = 0; i < velhos.length; i++) {
      const v = velhos[i]; if (usados.has(i) || v.kind !== s.kind || v.tipo !== s.tipo) continue;
      const d = Math.hypot(v.wx - s.wx, v.wy - s.wy); if (d < dmin) { dmin = d; melhor = i; }
    }
    if (melhor >= 0) {
      const v = velhos[melhor]; usados.add(melhor);
      const vmax = s.kind === 'proj' ? 14 : 6;           // trava saltos (empurrão, teleporte de segurança)
      s.vx = v.vx * 0.4 + limita((s.wx - v.wx) / dtR, -vmax, vmax) * 0.6;
      s.vy = v.vy * 0.4 + limita((s.wy - v.wy) / dtR, -vmax, vmax) * 0.6;
      s.nasceu = v.nasceu;
    } else if (mesmoMundo) s.nasceu = agora;
  }
  if (mesmoMundo && h.abates > (retrato.h.abates || 0)) {
    let n = h.abates - retrato.h.abates;
    for (let i = 0; i < velhos.length && n > 0; i++) {
      const v = velhos[i];
      if (!usados.has(i) && v.kind === 'inimigo') { caidos.push({ ...v, t0: agora, ang0: retrato.h.ang, lado: v.sx < W / 2 ? -1 : 1 }); n--; }
    }
  }
  if (!mesmoMundo) caidos = [];
  caidos = caidos.filter((c) => agora - c.t0 < 700);
}

window.__honkAnim = () => ({ caidos: caidos.length, comVel: retrato ? retrato.sprites.filter((s) => s.vx || s.vy).length : 0, n: retrato ? retrato.sprites.length : 0 });

function imprimirSprites(lista, bob, t, perto = 0.2, longe = 1e9) {
  const agoraMs = relogio * 1000;
  for (const s of lista) {
    if (s.ty <= Math.max(0.2, perto) || s.ty > longe) continue;
    const base = VH / s.ty, chao = HORIZ + bob + CAMZ * base, cx = Math.round(s.sx);
    if (s.kind === 'efeito') { imprimirEfeitoMundo(s, base, chao, cx); continue; }
    if (s.kind === 'texto') {                          // números de dano: saltam, sobem desacelerando e somem
      if (cx < 0 || cx >= W || s.ty >= zbuf[cx]) continue;
      const i = s.idade;
      ctx.globalAlpha = limita(1 - (i - 0.5) / 0.4, 0, 1);
      const tam = Math.max(7, Math.min(16, 44 / s.ty)) * (0.6 + 0.4 * saiComMola(i / 0.22));
      const sobe = 26 * (1 - Math.exp(-i * 3.2)) / 0.96;
      letreiro(s.texto, cx + Math.sin(i * 7 + s.wx) * 1.5, chao - base * s.alt - sobe, tam, s.tipo === '#ffd35a' ? COR.destaque : COR.tinta, COR.papel, 'Rye', 2.2);
      ctx.globalAlpha = 1; continue;
    }
    const arte = imagens[s.tipo]; if (!arte) continue;
    const g = s.flash > 0 ? arte.flash : arte.normal;
    let alto = base * s.escala, largo = alto * g.w / g.h, inclina = 0, ergue = 0, solta = 0;
    if (s.kind === 'inimigo') {
      // andar: o passo acompanha a velocidade real (parado só respira), estica/encolhe e balança
      const vel = Math.min(1, Math.hypot(s.vx || 0, s.vy || 0) / 1.2);
      const fase = t * (4 + 6 * vel) + s.wx * 3 + s.wy * 2;
      const pulo = Math.abs(Math.sin(fase)) * (0.02 + 0.07 * vel); alto *= 1 + pulo; largo *= 1 - pulo * 0.5;
      inclina = Math.cos(fase) * 0.12 * vel;
      // inclina para o lado em que está andando na tela
      const lat = projetaDelta(s, (s.vx || 0) * 0.1, (s.vy || 0) * 0.1, ultimoAng).sx - s.sx;
      inclina += limita(lat * 0.01, -0.08, 0.08);
      // golpe: achata e volta oscilando (mola), em vez de um quadro só
      if (s.flash > 0) { const f = Math.min(1, s.flash * 7), osc = Math.cos((1 - f) * 9) * f; alto *= 1 - 0.16 * osc; largo *= 1 + 0.18 * osc; inclina *= 0.3; }
      // nascimento: brota do chão crescendo e passando do ponto
      const idade = (agoraMs - s.nasceu) / 1000;
      if (idade < 0.45) { const k = saiComMola(idade / 0.45); alto *= Math.max(0.02, k); largo *= 0.6 + 0.4 * Math.max(0, k); solta = 1 - Math.min(1, idade / 0.45); }
    }
    if (s.kind === 'proj') {
      inclina = Math.sin(t * 20 + s.wx * 7) * 0.5;      // projéteis giram...
      // ...e deixam um rastro de bolinhas de tinta para trás
      if ((s.vx || s.vy) && cx >= 0 && cx < W && s.ty < zbuf[cx]) {
        ctx.fillStyle = COR.tinta;
        for (let k = 1; k <= 4; k++) {
          const r = projetaDelta(s, -s.vx * k * 0.035, -s.vy * k * 0.035, ultimoAng);
          const bb = VH / r.ty, yy = HORIZ + bob + CAMZ * bb - bb * s.alt - alto * 0.5;
          ctx.globalAlpha = 0.5 - k * 0.1; ctx.beginPath(); ctx.arc(r.sx, yy, Math.max(0.6, bb * 0.05 * (1 - k * 0.18)), 0, 7); ctx.fill();
        }
        ctx.globalAlpha = 1;
      }
    }
    const pe = chao - base * s.alt + ergue, topo = pe - alto, esq = s.sx - largo / 2;
    if (s.kind === 'proj' && cx >= 0 && cx < W && s.ty < zbuf[cx]) {     // sombra no chão: dá para ler onde vai cair
      ctx.fillStyle = COR.tinta; ctx.globalAlpha = 0.45;
      ctx.beginPath(); ctx.ellipse(s.sx, chao, Math.max(1, base * 0.09), Math.max(0.6, base * 0.025), 0, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
    }
    // a imagem tem margem (halo); calcula o retângulo inteiro
    const mx = largo * g.m / g.w, my = alto * g.m / g.h;
    const L = largo + 2 * mx, A = alto + 2 * my, E = esq - mx, Tt = topo - my;
    if (s.kind === 'inimigo' && cx >= 0 && cx < W && s.ty < zbuf[cx]) {      // sombra chapada (+ anel de terra ao nascer)
      ctx.fillStyle = COR.tinta; ctx.beginPath(); ctx.ellipse(s.sx, chao, largo * 0.4, Math.max(0.8, base * 0.045), 0, 0, 7); ctx.fill();
      if (solta > 0) { ctx.strokeStyle = COR.tinta; ctx.lineWidth = 1.2; ctx.globalAlpha = solta; ctx.setLineDash([3, 3]);
        ctx.beginPath(); ctx.ellipse(s.sx, chao, base * 0.5 * (1.4 - solta), base * 0.1 * (1.4 - solta), 0, 0, 7); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1; }
    }
    const larguraFonte = g.img.width / L;
    for (let x = Math.max(0, Math.floor(E)); x < Math.min(W, E + L); x++) {
      if (s.ty >= zbuf[x]) continue;
      const sx = Math.min(g.img.width - 1, Math.floor((x - E) * larguraFonte));
      const desloca = inclina * (x - s.sx);          // cada coluna sobe ou desce um pouco: o corpo inclina
      ctx.drawImage(g.img, sx, 0, Math.max(1, Math.floor(larguraFonte)), g.img.height, x, Tt + desloca, 1, A);
    }
    // AVISO: quem vai atirar acende um "!" que enche; chefes ainda riscam uma linha até o ganso
    if (s.kind === 'inimigo' && cx >= 0 && cx < W && s.ty < zbuf[cx] && (s.idade > 0.02 || s.texto === 'invoca')) {
      const chefe = s.escala >= 1.4, k = Math.min(1, s.idade || 0), pisca = 0.6 + 0.4 * Math.sin(relogio * 30);
      const tam = (chefe ? 14 : 8) * (0.7 + 0.5 * k);
      if (s.idade > 0.02) {
        if (chefe && terceiraPessoa) {
          ctx.strokeStyle = COR.destaque; ctx.lineWidth = 1 + k * 1.5; ctx.globalAlpha = 0.35 + 0.5 * k; ctx.setLineDash([4, 3]);
          ctx.beginPath(); ctx.moveTo(s.sx, pe - alto * 0.5); ctx.lineTo(W / 2, VH * 0.78); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1;
        }
        ctx.globalAlpha = k > 0.75 ? pisca : 0.5 + k * 0.5;
        letreiro('!', s.sx, topo - 10 - (chefe ? 6 : 0), tam, COR.destaque, COR.papel, 'Rye', 2);
        ctx.globalAlpha = 1;
      }
      if (s.texto === 'invoca') { ctx.globalAlpha = pisca; letreiro('+', s.sx + largo * 0.45, topo - 2, chefe ? 13 : 9, COR.destaque, COR.papel, 'Rye', 2); ctx.globalAlpha = 1; }
    }
    if (s.kind === 'inimigo' && s.vida < s.vida_max && cx >= 0 && cx < W && s.ty < zbuf[cx]) {
      const bw = Math.min(44, Math.max(12, largo * 0.8));
      ctx.fillStyle = COR.papel; ctx.fillRect(s.sx - bw / 2 - 1, topo - 7, bw + 2, 5);
      ctx.fillStyle = COR.tinta; ctx.fillRect(s.sx - bw / 2 - 0.5, topo - 6.5, bw + 1, 4);
      ctx.fillStyle = COR.destaque; ctx.fillRect(s.sx - bw / 2, topo - 6, bw * Math.max(0, s.vida / s.vida_max), 3);
    }
  }
}

// inimigos derrotados: tombam para o lado com um quique, afundam e somem (0,7 s)
function imprimirCaidos(bob, ang, perto = 0.2, longe = 1e9) {
  const agoraMs = relogio * 1000;
  for (const c of caidos) {
    const i = (agoraMs - c.t0) / 1000;
    const sx = c.sx - Math.tan(limita(ang - c.ang0, -1, 1)) / 0.66 * (W / 2);
    if (c.ty <= Math.max(0.2, perto) || c.ty > longe) continue;
    const cx = Math.round(sx); if (cx < 0 || cx >= W || c.ty >= zbuf[cx]) continue;
    const arte = imagens[c.tipo]; if (!arte) continue;
    const g = arte.flash, base = VH / c.ty, chao = HORIZ + bob + CAMZ * base;
    const alto = base * c.escala, largo = alto * g.w / g.h;
    const giro = c.lado * 1.45 * quica(i / 0.45), afunda = Math.max(0, i - 0.45) / 0.25;
    ctx.save(); ctx.globalAlpha = limita(1 - afunda, 0, 1);
    ctx.translate(sx, chao - base * c.alt + afunda * alto * 0.15); ctx.rotate(giro);
    ctx.drawImage(g.img, -largo / 2 - largo * g.m / g.w, -alto - alto * g.m / g.h, largo * (1 + 2 * g.m / g.w), alto * (1 + 2 * g.m / g.h));
    ctx.restore();
  }
}

// EFEITOS (vêm do SQL com posição e idade): golpe, morte, honk, poeira
function imprimirEfeitoMundo(s, base, chao, cx) {
  if (cx < -40 || cx > W + 40) return;
  const T = COR.tinta, Pp = COR.papel, R = COR.destaque, i = s.idade, rnd = sorteador(s.vida || 1);
  const y = chao - base * 0.35, k = Math.min(3, base / 60);
  ctx.save();
  ctx.globalAlpha = Math.max(0, 1 - i / 0.8);
  if (s.tipo === 'golpe') {                 // estrela de impacto entalhada
    const r0 = 4 * k + i * 30 * k, r1 = r0 + 7 * k;
    ctx.fillStyle = T;
    for (let a = 0; a < 8; a++) {
      const an = a / 8 * Math.PI * 2 + s.vida;
      ctx.beginPath(); ctx.moveTo(s.sx + Math.cos(an - 0.12) * r0, y + Math.sin(an - 0.12) * r0);
      ctx.lineTo(s.sx + Math.cos(an) * r1, y + Math.sin(an) * r1);
      ctx.lineTo(s.sx + Math.cos(an + 0.12) * r0, y + Math.sin(an + 0.12) * r0); ctx.fill();
    }
  } else if (s.tipo === 'morte') {          // nuvem de poeira recortada + penas e lascas voando
    const r = (8 + i * 40) * k;
    ctx.fillStyle = Pp; ctx.strokeStyle = T; ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (let a = 0; a < 9; a++) { const an = a / 9 * Math.PI * 2; ctx.arc(s.sx + Math.cos(an) * r * 0.75, y + Math.sin(an) * r * 0.5, r * 0.35, 0, 7); }
    ctx.fill(); ctx.stroke();
    for (let n = 0; n < 7; n++) {
      const an = rnd() * Math.PI * 2, v = (20 + rnd() * 30) * k;
      const px = s.sx + Math.cos(an) * v * i * 1.6, py = y + Math.sin(an) * v * i - 0 + 60 * k * i * i;
      ctx.fillStyle = n % 3 ? T : R; ctx.save(); ctx.translate(px, py); ctx.rotate(an + i * 8);
      ctx.fillRect(-2 * k, -0.6 * k, 4 * k, 1.2 * k); ctx.restore();
    }
  } else if (s.tipo === 'honk') {           // anel de choque no chão, em volta do ganso
    const r = (20 + i * 160) * Math.min(1.5, k);
    ctx.strokeStyle = T; ctx.lineWidth = 2; ctx.setLineDash([5, 4]);
    ctx.beginPath(); ctx.ellipse(s.sx, chao, r, r * 0.28, 0, 0, 7); ctx.stroke(); ctx.setLineDash([]);
  } else if (s.tipo === 'poeira') {         // projétil que bateu na parede
    ctx.fillStyle = T;
    for (let n = 0; n < 6; n++) { const an = rnd() * 7; ctx.beginPath(); ctx.arc(s.sx + Math.cos(an) * i * 30 * k, y + Math.sin(an) * i * 20 * k, (1.5 - i) * k, 0, 7); ctx.fill(); }
  }
  ctx.restore();
}

