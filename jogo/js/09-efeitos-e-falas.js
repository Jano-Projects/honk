// HONK! — jogo/js/09-efeitos-e-falas.js
// EFEITOS DE TELA: noite, câmera lenta, falas do ganso, o carimbo "ONDA N", o bico em
// primeira pessoa e os efeitos de HONK/dor/bicada.
// (ferramentas/montar.py junta todos os .js desta pasta, em ordem, num único <script type="module">)

// NOITE NO PARQUE (regra de ciclo): só se enxerga perto. Uma vinheta de tinta fecha a visão.
function imprimirNoite() {
  const g = ctx.createRadialGradient(W / 2, VH * 0.62, 26, W / 2, VH * 0.62, 150);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.55, 'rgba(8,8,18,0.55)'); g.addColorStop(1, 'rgba(8,8,18,0.97)');
  ctx.fillStyle = g; ctx.fillRect(-20, -20, W + 40, VH + 40);
}
// CÂMERA LENTA da esquiva perfeita: bordas hachuradas em vermelho, como um quadro congelado
function imprimirCameraLenta(h) {
  const k = Math.min(1, h.perfeita / 0.28);
  ctx.save(); ctx.globalAlpha = 0.35 * k; ctx.strokeStyle = COR.destaque; ctx.lineWidth = 1.4;
  for (let x = -VH; x < W; x += 6) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 26, 26); ctx.moveTo(x + VH - 26, VH - 26); ctx.lineTo(x + VH, VH); ctx.stroke(); }
  ctx.globalAlpha = 0.18 * k; ctx.fillStyle = COR.tinta; ctx.fillRect(0, 0, 18, VH); ctx.fillRect(W - 18, 0, 18, VH);
  ctx.restore();
}

// FALAS DO GANSO: curtas e ranzinzas, num balão de gravura sobre a cabeça
const FALAS = {
  mundo1: ['Pão velho no MEU lago. Hoje alguém paga.', 'Acordei. Escolhi a violência.', 'Bom dia pra quem? Pra ninguém.'],
  mundo2: ['Fazenda. Ração. Família. Odeio tudo.', 'Cheiro de milho e de medo.', 'Vou devolver cada grão.'],
  mundo3: ['Pastel de vento? Vento vai ser você.', 'Feira de domingo. Bico de segunda.', 'Hoje o desconto é no bico.'],
  mundo4: ['Ar-condicionado não esfria o ódio.', 'Liquidação de bicada. Leve três.', 'Anda mais devagar. Eu te alcanço.'],
  mundo5: ['Ninguém foge de avião. Ninguém.', 'Portão de embarque: o meu bico.', 'Check-in na vingança.'],
  ciclo: ['De novo. Ainda estou com raiva.', 'Achou que tinha acabado?', 'O ódio não tira férias.', 'Volta completa. Agora é pessoal.'],
  chefe: ['Grandão? Cai igual.', 'Próximo.', 'Isso foi o chefe? Tá.', 'Nem suei. Ganso não sua.'],
  perfeita: ['Errou.', 'Lento.', 'Hah!', 'Passou longe.'],
  ferido: ['Isso... me deixou com MAIS raiva.', 'Arranhão. Só um arranhão.', 'Agora você me irritou.'],
  combo: ['Ah, agora sim.', 'Ódio combinado rende mais.', 'Interessante...'],
};
let fala = null;
function falar(tipo, ms = 2400, atraso = 0) {
  const op = FALAS[tipo]; if (!op) return;
  fala = { texto: op[Math.floor(Math.random() * op.length)], t0: performance.now() + atraso, ms };
}
function imprimirFala(centroHonk, terceira) {
  if (!fala) return;
  const i = (performance.now() - fala.t0) / fala.ms;
  if (i < 0) return;
  if (i > 1) { fala = null; return; }
  const entra = Math.min(1, i * 8), sai = i > 0.85 ? (1 - i) / 0.15 : 1;
  ctx.save(); ctx.globalAlpha = sai; ctx.font = fonte(8, 'Elite');
  const tw = Math.min(W - 30, ctx.measureText(fala.texto).width + 14), th = 16;
  const bx = W / 2 + (terceira ? 26 : 0) - tw / 2, by = (terceira && centroHonk ? centroHonk - 58 : 26) - (1 - entra) * 6;
  ctx.fillStyle = COR.papel; ctx.strokeStyle = COR.tinta; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.rect(bx, by, tw, th); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(bx + 14, by + th); ctx.lineTo(bx + 8, by + th + 7); ctx.lineTo(bx + 22, by + th); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = COR.papel; ctx.fillRect(bx + 15, by + th - 1, 6, 2);
  ctx.fillStyle = COR.tinta; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(fala.texto, bx + tw / 2, by + th / 2 + 0.5, tw - 8);
  ctx.restore();
}


// carimbo "ONDA N" que cai na tela quando a onda começa
let carimbo = null;
function imprimirCarimbo(agora) {
  if (!carimbo) return;
  const i = (agora - carimbo.t0) / 1000;
  if (i < 0) return;                                   // ainda esperando a capa do mundo sair
  if (i > 1.6) { carimbo = null; return; }
  const esc = i < 0.12 ? 2.2 - i / 0.12 * 1.2 : 1;
  ctx.save(); ctx.globalAlpha = i > 1.2 ? 1 - (i - 1.2) / 0.4 : 1;
  ctx.translate(W / 2, VH * 0.32); ctx.rotate(-0.08); ctx.scale(esc, esc);
  ctx.strokeStyle = COR.destaque; ctx.lineWidth = 2.5; ctx.strokeRect(-58, -16, 116, 30); ctx.lineWidth = 0.8; ctx.strokeRect(-54, -12, 108, 22);
  letreiro(carimbo.texto, 0, 6, 16, COR.destaque, COR.papel, 'Rye', 0);
  ctx.restore();
}

// O bico do ganso: vermelho de carimbo, contorno grosso e cortes de goiva
function imprimirBico(h) {
  const T = COR.tinta, Pp = COR.papel, R = COR.destaque;
  const bal = Math.sin(h.passo * 5) * 3;
  const bicada = h.bico_anim > 0 ? bote(1 - h.bico_anim / 0.18) : 0;
  const abre = h.honk_anim > 0 ? Math.min(1, h.honk_anim * 4) : 0;
  const cx = W / 2, base = VH + 10 + bal - bicada * 22, ponta = 96 - bicada * 30;
  const cunha = (larg, topo, cor, dy = 0, contorno = true) => {
    ctx.beginPath(); ctx.moveTo(cx - larg, base + dy);
    ctx.quadraticCurveTo(cx - larg * 0.8, topo + 26 + dy, cx, topo + dy);
    ctx.quadraticCurveTo(cx + larg * 0.8, topo + 26 + dy, cx + larg, base + dy); ctx.closePath();
    ctx.fillStyle = cor; ctx.fill();
    if (contorno) { ctx.strokeStyle = T; ctx.lineWidth = 2.4; ctx.lineJoin = 'round'; ctx.stroke(); }
  };
  if (abre > 0) {
    cunha(36, ponta + 20, R); cunha(26, ponta + 26, T, 0, false);
    ctx.strokeStyle = Pp; ctx.lineWidth = 1;
    for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(cx - 10 + k * 6, base); ctx.lineTo(cx - 6 + k * 4, ponta + 44); ctx.stroke(); }
  }
  const sobe = -abre * 30;
  cunha(42, ponta, R, sobe);
  ctx.strokeStyle = Pp; ctx.lineWidth = 1.3; ctx.lineCap = 'round';
  for (const [dx, curva] of [[-14, -6], [-7, -3], [9, 4]]) {
    ctx.beginPath(); ctx.moveTo(cx + dx * 1.6, base - 8 + sobe); ctx.quadraticCurveTo(cx + dx + curva, ponta + 40 + sobe, cx + dx * 0.3, ponta + 16 + sobe); ctx.stroke();
  }
  ctx.fillStyle = Pp; ctx.strokeStyle = T; ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.ellipse(cx, ponta + 7 + sobe, 7, 5.5, 0, 0, 7); ctx.fill(); ctx.stroke();
  ctx.fillStyle = T;
  ctx.beginPath(); ctx.ellipse(cx - 16, base - 38 + sobe, 2, 4, 0.3, 0, 7); ctx.ellipse(cx + 16, base - 38 + sobe, 2, 4, -0.3, 0, 7); ctx.fill();
}

function imprimirEfeitos(h, centroY = VH / 2) {
  const T = COR.tinta, Pp = COR.papel, R = COR.destaque;
  if (h.honk_anim > 0) {                               // explosão de raios entalhados + letreiro que salta
    const p = 1 - h.honk_anim / 0.6;
    ctx.fillStyle = T;
    for (let k = 0; k < 28; k++) {
      const a = k / 28 * Math.PI * 2, r0 = 30 + p * 90, r1 = r0 + 14 + (k % 2) * 10;
      ctx.beginPath(); ctx.moveTo(W / 2 + Math.cos(a - 0.03) * r0, centroY + Math.sin(a - 0.03) * r0);
      ctx.lineTo(W / 2 + Math.cos(a) * r1, centroY + Math.sin(a) * r1);
      ctx.lineTo(W / 2 + Math.cos(a + 0.03) * r0, centroY + Math.sin(a + 0.03) * r0); ctx.fill();
    }
    const salto = p < 0.15 ? 1.6 - p / 0.15 * 0.6 : 1;
    ctx.save(); ctx.translate(W / 2, 44); ctx.scale(salto, salto); ctx.rotate(-0.05 + Math.sin(p * 30) * 0.02);
    letreiro('HONK!', 0, 0, 32, R, T, 'Rye', 5); ctx.restore();
  }
  if (h.dor > 0) {                                      // moldura vermelha de dor
    ctx.globalAlpha = Math.min(1, h.dor * 3); ctx.strokeStyle = R; ctx.lineWidth = 10; ctx.strokeRect(5, 5, W - 10, VH - 10);
    ctx.globalAlpha = 1;
  }
  if (h.estado === 'vivo' && h.vida * 3 < h.vida_max) {  // pouca vida: hachura vermelha nos cantos, pulsando
    ctx.strokeStyle = R; ctx.lineWidth = 1.2; ctx.globalAlpha = 0.55 + 0.35 * Math.sin(h.t * 6);
    for (let k = 0; k < 9; k++) {
      ctx.beginPath(); ctx.moveTo(0, 6 + k * 5); ctx.lineTo(6 + k * 5, 0); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(W, VH - 6 - k * 5); ctx.lineTo(W - 6 - k * 5, VH); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  const my = HORIZ;                                     // mira: no horizonte, à frente do ganso
  ctx.fillStyle = Pp; ctx.fillRect(W / 2 - 2, my - 0.5, 4, 1); ctx.fillRect(W / 2 - 0.5, my - 2, 1, 4);
  ctx.fillStyle = T; ctx.fillRect(W / 2 - 1.5, my - 0.25, 3, 0.5); ctx.fillRect(W / 2 - 0.25, my - 1.5, 0.5, 3);
  if (h.titulo) {                                       // capa do mundo: cai girando e some no fim
    const passou = 3 - h.titulo_resta;
    const entra = Math.min(1, passou / 0.35), sai = Math.min(1, Math.max(0, h.titulo_resta / 0.4));
    ctx.save(); ctx.globalAlpha = sai;
    ctx.translate(W / 2, 63); ctx.rotate((1 - entra) * -0.5); ctx.scale(0.4 + entra * 0.6, 0.4 + entra * 0.6); ctx.translate(-W / 2, -63);
    const w = 190, hh = h.evento_nome ? 82 : 66, x0 = W / 2 - w / 2, y0 = 30;
    ctx.fillStyle = Pp; ctx.fillRect(x0, y0, w, hh);
    ctx.strokeStyle = T; ctx.lineWidth = 2.5; ctx.strokeRect(x0, y0, w, hh); ctx.lineWidth = 0.8; ctx.strokeRect(x0 + 4, y0 + 4, w - 8, hh - 8);
    ctx.fillStyle = T; for (const [qx, qy] of [[x0 + 4, y0 + 4], [x0 + w - 4, y0 + 4], [x0 + 4, y0 + hh - 4], [x0 + w - 4, y0 + hh - 4]]) {
      ctx.beginPath(); ctx.moveTo(qx, qy - 3); ctx.lineTo(qx + 3, qy); ctx.lineTo(qx, qy + 3); ctx.lineTo(qx - 3, qy); ctx.fill(); }
    letreiro(`MUNDO ${h.mundo} DE 5` + (h.ciclo > 1 ? ` · CICLO ${h.ciclo}` : ''), W / 2, y0 + 18, 9, h.ciclo > 1 ? R : T, Pp, 'Elite', 0);
    letreiro(h.mundo_nome, W / 2, y0 + 42, 22, T, R, 'Rye', 0);
    ctx.fillStyle = R; ctx.fillRect(W / 2 - 40, y0 + 47, 80, 1.2);
    if (h.evento_nome) letreiro('REGRA DO CICLO: ' + h.evento_nome, W / 2, y0 + 74, 7, R, Pp, 'Elite', 0);
    ctx.font = fonte(9, 'Elite'); const larg = ctx.measureText(h.mundo_sub).width;     // subtítulo longo encolhe para caber
    letreiro(h.mundo_sub, W / 2, y0 + 59, Math.min(9, 9 * (w - 18) / Math.max(1, larg)), T, Pp, 'Elite', 0);
    ctx.restore();
  }
}

