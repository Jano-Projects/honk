// HONK! — jogo/js/06-cenario.js
// CENÁRIO: céu, chão e as paredes do raycasting (as distâncias vêm do SQL); inclui a
// previsão de movimento que deforma as paredes entre um cálculo do banco e outro.
// (ferramentas/montar.py junta todos os .js desta pasta, em ordem, num único <script type="module">)

// ---------- 6. A IMPRESSÃO de cada quadro ----------
const zbuf = new Float32Array(W);
const nuvens = Array.from({ length: 7 }, (_, i) => ({ a: i * 0.9 + 0.3, y: 14 + (i * 13) % 30, w: 22 + (i * 7) % 18 }));
const passaros = Array.from({ length: 5 }, (_, i) => ({ a: i * 1.25, y: 20 + (i * 11) % 26 }));
const estrelas = Array.from({ length: 60 }, (_, i) => ({ a: (i * 2.399) % (Math.PI * 2), y: 4 + (i * 37) % 64, b: i }));

const colunaDoAngulo = (a, ang) => {
  let d = a - ang; d = Math.atan2(Math.sin(d), Math.cos(d));
  if (Math.abs(d) > 1.1) return null;
  return W / 2 + Math.tan(d) / 0.66 * (W / 2);
};
const fonte = (tam, familia = 'Rye') => `${tam}px ${familia === 'Rye' ? 'Rye, RyeLocal, Georgia, serif' : '"Special Elite", EliteLocal, "Courier New", monospace'}`;
function letreiro(texto, x, y, tam, cor, contorno = COR.papel, familia = 'Rye', larg = 2.5) {
  ctx.font = fonte(tam, familia); ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  ctx.lineJoin = 'round'; ctx.lineWidth = larg; ctx.strokeStyle = contorno; ctx.strokeText(texto, x, y);
  ctx.fillStyle = cor; ctx.fillText(texto, x, y);
}

function imprimirCeuEChao(h, bob) {
  const T = COR.tinta, Pp = COR.papel, R = COR.destaque, meio = HORIZ + bob;
  ctx.fillStyle = Pp; ctx.fillRect(0, 0, W, VH);
  if (h.noite) {                                       // estrelas e lua na matriz invertida
    for (const s of estrelas) {
      const x = colunaDoAngulo(s.a, h.ang); if (x === null || s.y > meio - 8) continue;
      const brilho = Math.sin(h.t * 2 + s.b) > 0.2;
      ctx.fillStyle = T; ctx.fillRect(x, s.y, 0.8, 0.8);
      if (brilho && s.b % 4 === 0) { ctx.fillRect(x - 1.5, s.y + 0.3, 3.8, 0.4); ctx.fillRect(x + 0.2, s.y - 1.5, 0.4, 3.8); }
    }
    const lx = colunaDoAngulo(-2.2, h.ang);
    if (lx !== null) { ctx.fillStyle = T; ctx.beginPath(); ctx.arc(lx, 24, 11, 0, 7); ctx.fill();
                       ctx.fillStyle = Pp; ctx.beginPath(); ctx.arc(lx + 5, 21, 10, 0, 7); ctx.fill(); }
  } else if (h.mundo === 2) {                          // pôr do sol listrado da fazenda
    const sx = colunaDoAngulo(0.6, h.ang);
    if (sx !== null) {
      ctx.save(); ctx.beginPath(); ctx.arc(sx, meio - 4, 30, 0, 7); ctx.clip();
      ctx.fillStyle = R; ctx.fillRect(sx - 30, meio - 34, 60, 60);
      ctx.fillStyle = Pp; for (let k = 0; k < 6; k++) ctx.fillRect(sx - 30, meio - 18 + k * 4.5, 60, 1 + k * 0.4);
      ctx.restore();
      ctx.strokeStyle = T; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(sx, meio - 4, 30, Math.PI, 2 * Math.PI); ctx.stroke();
    }
    ctx.strokeStyle = T; ctx.lineWidth = 0.8;
    for (const n of nuvens) {
      const x = colunaDoAngulo(n.a + h.t * 0.008, h.ang); if (x === null) continue;
      for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.moveTo(x - n.w / 2 + k * 4, n.y + k * 2.2); ctx.lineTo(x + n.w / 2 - k * 3, n.y + k * 2.2); ctx.stroke(); }
    }
  } else {                                             // sol de raios e nuvens recortadas do parque
    const sx = colunaDoAngulo(-2.2, h.ang);
    if (sx !== null) {
      ctx.fillStyle = T;
      for (let k = 0; k < 16; k++) {
        const a = k / 16 * Math.PI * 2 + h.t * 0.15, a2 = a + 0.1;
        ctx.beginPath(); ctx.moveTo(sx + Math.cos(a) * 13, 26 + Math.sin(a) * 13);
        ctx.lineTo(sx + Math.cos(a + 0.05) * (k % 2 ? 20 : 25), 26 + Math.sin(a + 0.05) * (k % 2 ? 20 : 25));
        ctx.lineTo(sx + Math.cos(a2) * 13, 26 + Math.sin(a2) * 13); ctx.fill();
      }
      ctx.beginPath(); ctx.arc(sx, 26, 10, 0, 7); ctx.fill();
      ctx.strokeStyle = Pp; ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.arc(sx - 3.5, 24, 1.3, 0, 7); ctx.arc(sx + 3.5, 24, 1.3, 0, 7); ctx.stroke();
      ctx.beginPath(); ctx.arc(sx, 27, 4.5, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
    }
    for (const n of nuvens) {
      const x = colunaDoAngulo(n.a + h.t * 0.01, h.ang); if (x === null) continue;
      ctx.fillStyle = Pp; ctx.strokeStyle = T; ctx.lineWidth = 1;
      ctx.beginPath();
      const bolas = 4, r = n.w / (bolas * 1.6);
      for (let k = 0; k < bolas; k++) ctx.arc(x - n.w / 2 + r + k * r * 1.6, n.y - (k % 2 ? r * 0.7 : 0), r, Math.PI, 0);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(x - n.w / 3, n.y - 1.5); ctx.lineTo(x + n.w / 4, n.y - 1.5); ctx.stroke();
    }
    ctx.strokeStyle = T; ctx.lineWidth = 0.9;
    for (const p of passaros) {
      const x = colunaDoAngulo(p.a + h.t * 0.03, h.ang); if (x === null) continue;
      const bate = Math.sin(h.t * 8 + p.a * 5) * 1.5;
      ctx.beginPath(); ctx.moveTo(x - 3, p.y - bate); ctx.quadraticCurveTo(x - 1, p.y - 1, x, p.y); ctx.quadraticCurveTo(x + 1, p.y - 1, x + 3, p.y - bate); ctx.stroke();
    }
  }
  // horizonte (silhuetas calculadas no SQL); de noite, só o contorno com janelinhas
  ctx.fillStyle = T; ctx.strokeStyle = T; ctx.lineWidth = 0.8;
  ctx.beginPath(); ctx.moveTo(0, meio);
  for (let x = 0; x <= W; x += 1) {
    const a = h.ang + Math.atan((x - W / 2) / (W / 2) * 0.66);
    const i = ((Math.floor((a / (Math.PI * 2)) * 256) % 256) + 256) % 256;
    ctx.lineTo(x, meio - (horizonte[i] || 0));
  }
  ctx.lineTo(W, meio); ctx.closePath();
  if (h.noite) {
    ctx.stroke();
    for (let x = 2; x < W; x += 5) {
      const a = h.ang + Math.atan((x - W / 2) / (W / 2) * 0.66);
      const i = ((Math.floor((a / (Math.PI * 2)) * 256) % 256) + 256) % 256;
      if ((horizonte[i] || 0) > 9 && (i * 7) % 3 === 0) { ctx.fillRect(x, meio - (horizonte[i] * 0.6), 1, 1); }
    }
  } else ctx.fill();
  // chão: papel com riscos de goiva em perspectiva, que correm quando o ganso anda
  ctx.fillStyle = Pp; ctx.fillRect(0, meio, W, VH - meio);
  ctx.fillStyle = T;
  let ultimo = null;
  for (let y = Math.ceil(meio) + 0.5; y < VH; y += 0.5) {
    const d = CAMZ * VH / (y - meio);
    const faixa = Math.floor(d * 1.1 + h.passo * 1.1);
    if (ultimo !== null && faixa !== ultimo) ctx.fillRect(0, y, W, Math.max(0.5, 1.2 / d));
    ultimo = faixa;
  }
  ctx.fillRect(0, meio - 0.4, W, 0.9);
}

// pd = colunas devolvidas pelo SQL (indexadas pela coluna da tela);
// dx = deslocamento da reprojeção (o giro que o jogador já fez e o SQL ainda não devolveu)
// PREVISÃO DE MOVIMENTO (v7): o ganso anda na hora em que a tecla é apertada; o SQL confirma depois.
// Cada coluna de parede devolvida pelo banco é um ponto (profundidade z, lateral X) no espaço da câmera;
// andando f para a frente e l para o lado, ela vai para (z - f, X - l) e é reprojetada na tela.
const AW = { dist: new Float32Array(W), alt: new Float32Array(W), lado: new Int8Array(W), u: new Float32Array(W), padrao: new Array(W) };
function deformarParedes(pd, dx, f, l) {
  const o = AW; o.alt.fill(0); o.dist.fill(1e9);
  const xs = new Float32Array(W + 1), ok = new Uint8Array(W + 1);
  for (let i = 0; i <= W; i++) {
    const k = Math.min(W - 1, i), z = pd.dist[k];
    if (!(pd.alt[k] > 0)) continue;
    const X = z * ((i - W / 2) / (W / 2)) * 0.66, z2 = z - f;     // borda esquerda da coluna i
    if (z2 < 0.12) continue;
    xs[i] = W / 2 + (X - l) / z2 / 0.66 * (W / 2) + dx; ok[i] = 1;
  }
  for (let i = 0; i < W; i++) {
    if (!ok[i] || !ok[i + 1]) continue;
    const z2 = pd.dist[i] - f, a = xs[i], b = xs[i + 1];
    if (b - a > 40 || b < a) continue;                              // salto (quina): deixa o vizinho cobrir
    const alt2 = pd.alt[i] * pd.dist[i] / z2;
    const vizinho = i + 1 < W && pd.lado[i + 1] === pd.lado[i] && pd.padrao[i + 1] === pd.padrao[i] && Math.abs(pd.u[i + 1] - pd.u[i]) < 0.3;
    for (let x = Math.max(0, Math.ceil(a - 0.5)); x < Math.min(W, Math.ceil(b - 0.5)); x++) {
      if (z2 >= o.dist[x]) continue;                                // a mais perto ganha
      const t = b > a ? (x + 0.5 - a) / (b - a) : 0;
      o.dist[x] = z2; o.alt[x] = alt2; o.lado[x] = pd.lado[i]; o.padrao[x] = pd.padrao[i];
      o.u[x] = vizinho ? pd.u[i] + (pd.u[i + 1] - pd.u[i]) * t : pd.u[i];
    }
  }
  // buracos (bordas da tela, quinas que se abriram): copia o vizinho mais próximo
  for (let pass = 0; pass < 2; pass++) for (let x = 0; x < W; x++) {
    if (o.alt[x] > 0) continue;
    const v = pass === 0 ? x - 1 : x + 1; const j = pass === 0 ? (x > 0 ? v : -1) : (x < W - 1 ? v : -1);
    if (j >= 0 && o.alt[j] > 0) { o.dist[x] = o.dist[j]; o.alt[x] = o.alt[j]; o.lado[x] = o.lado[j]; o.padrao[x] = o.padrao[j]; o.u[x] = o.u[j]; }
  }
  for (let x = W - 2; x >= 0; x--) if (!(o.alt[x] > 0) && o.alt[x + 1] > 0) { o.dist[x] = o.dist[x + 1]; o.alt[x] = o.alt[x + 1]; o.lado[x] = o.lado[x + 1]; o.padrao[x] = o.padrao[x + 1]; o.u[x] = o.u[x + 1]; }
  return o;
}

function imprimirParedes(pd0, bob, dx = 0, f = 0, l = 0) {
  const usaWarp = Math.abs(f) > 1e-4 || Math.abs(l) > 1e-4;
  const pd = usaWarp ? deformarParedes(pd0, dx, f, l) : pd0;
  if (usaWarp) dx = 0;
  const { dist, alt, lado, u, padrao } = pd;
  zbuf.fill(1e9);
  const topo = new Float32Array(W), base = new Float32Array(W);
  for (let x = 0; x < W; x++) {
    const i = Math.max(0, Math.min(W - 1, Math.round(x - dx)));   // nas bordas, repete a coluna da ponta
    if (!(alt[i] > 0)) continue;
    const h = Math.min(alt[i], VH * 6), t0 = HORIZ + bob + CAMZ * h - h;
    topo[x] = t0; base[x] = t0 + h; zbuf[x] = dist[i];
    const tex = texturas[padrao[i]] || texturas.madeira;
    const sx = Math.min(TEX - 1, Math.floor((lado[i] ? 1 - u[i] : u[i]) * TEX));
    ctx.drawImage(tex, sx, 0, 1, TEX, x, t0, 1, h);
    // sombreamento de xilogravura: hachuras de papel conforme a distância e o lado
    const nivel = Math.min(5, Math.max(0, Math.floor((dist[i] - 2.5) / 2.6) + lado[i]));
    if (nivel > 0) ctx.drawImage(hachuras[nivel - 1], x * ESC, Math.max(0, t0) * ESC, ESC, Math.min(VH, h) * ESC, x, Math.max(0, t0), 1, Math.min(VH, h));
  }
  // contornos de tinta: em cima, embaixo e onde a profundidade "salta" (quinas e bordas)
  ctx.fillStyle = COR.tinta;
  for (let x = 0; x < W; x++) {
    if (!base[x]) continue;
    ctx.fillRect(x, topo[x] - 0.6, 1, 1.2); ctx.fillRect(x, base[x] - 0.6, 1, 1.2);
    if (x > 0 && base[x - 1] && (Math.abs(zbuf[x] - zbuf[x - 1]) > 0.35 * Math.min(zbuf[x], zbuf[x - 1]))) {
      const y0 = Math.min(topo[x], topo[x - 1]), y1 = Math.max(base[x], base[x - 1]);
      ctx.fillRect(x - 0.4, y0, 0.9, y1 - y0);
    }
  }
}

// ---- utilidades de animação (v6) ----
