// HONK! — jogo/js/04-som.js
// SOM e MÚSICA: efeitos sintetizados na hora (Web Audio, sem arquivos) e a trilha
// gerada por código, que acelera nas ondas de chefe.
// (ferramentas/montar.py junta todos os .js desta pasta, em ordem, num único <script type="module">)

// ---------- 4. Som (sintetizado na hora, sem arquivos) ----------
let audio = null, mudo = false;
function som(tipo) {
  if (mudo) return;
  try {
    audio ??= new (window.AudioContext || window.webkitAudioContext)();
    const a = audio, t = a.currentTime, saida = a.createGain(); saida.connect(a.destination);
    const osc = (forma, f0, f1, dur, vol, atraso = 0) => {
      const o = a.createOscillator(), g = a.createGain();
      o.type = forma; o.frequency.setValueAtTime(f0, t + atraso); o.frequency.exponentialRampToValueAtTime(f1, t + atraso + dur);
      g.gain.setValueAtTime(0.0001, t + atraso); g.gain.exponentialRampToValueAtTime(vol, t + atraso + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + atraso + dur);
      o.connect(g); g.connect(saida); o.start(t + atraso); o.stop(t + atraso + dur + 0.05);
    };
    if (tipo === 'honk') {
      const filtro = a.createBiquadFilter(); filtro.type = 'bandpass'; filtro.frequency.value = 1100; filtro.Q.value = 2;
      saida.disconnect(); saida.connect(filtro); filtro.connect(a.destination);
      osc('sawtooth', 370, 300, 0.32, 0.5); osc('sawtooth', 376, 296, 0.32, 0.4); osc('square', 185, 150, 0.3, 0.12);
    } else if (tipo === 'bica') osc('square', 900, 300, 0.06, 0.12);
    else if (tipo === 'dor')   osc('square', 140, 60, 0.18, 0.25);
    else if (tipo === 'abate') { osc('triangle', 520, 780, 0.08, 0.2); osc('triangle', 780, 1040, 0.1, 0.18, 0.07); }
    else if (tipo === 'esquiva') osc('sawtooth', 900, 250, 0.12, 0.08);
    else if (tipo === 'perfeita') { osc('sine', 1400, 300, 0.5, 0.12); osc('triangle', 1760, 1760, 0.25, 0.1, 0.12); osc('triangle', 2637, 2637, 0.3, 0.08, 0.2); }
    else if (tipo === 'combo') { [523, 659, 784, 1047].forEach((f, i) => osc('square', f, f, 0.12, 0.07, i * 0.07)); }
    else if (tipo === 'onda')  [392, 523, 659].forEach((f, i) => osc('square', f, f, 0.12, 0.12, i * 0.1));
    else if (tipo === 'morte') [392, 330, 262, 196].forEach((f, i) => osc('square', f, f * 0.97, 0.2, 0.15, i * 0.18));
  } catch (_) {}
}


// MÚSICA gerada na hora (Web Audio): baixo em lá menor, bumbo, caixa e chimbal de ruído.
// Intensidade 0 = silêncio (menus), 1 = luta (100 bpm), 2 = chefe (138 bpm, com melodia).
const musica = {
  nivel: 0, alvo: 0, passo: 0, prox: 0, ruido: null, vol: null, timer: null,
  BAIXO: [45, 45, 48, 45, 43, 45, 40, 43, 45, 45, 48, 50, 52, 50, 48, 43],
  MELODIA: [69, 0, 72, 69, 0, 76, 74, 72, 69, 0, 67, 69, 72, 0, 74, 76],
  tocar(alvo) {
    this.alvo = mudo ? 0 : alvo;
    if (this.alvo > 0 && !this.timer && audio) this.iniciar();
    if (this.vol && audio) this.vol.gain.setTargetAtTime(this.alvo === 0 ? 0 : 0.5, audio.currentTime, 0.4);
  },
  iniciar() {
    const a = audio;
    this.vol = a.createGain(); this.vol.gain.value = 0; this.vol.connect(a.destination);
    const n = a.sampleRate * 0.3, buf = a.createBuffer(1, n, a.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    this.ruido = buf; this.prox = a.currentTime + 0.1;
    this.timer = setInterval(() => this.agendar(), 50);
  },
  nota(freq, t, dur, forma, vol) {
    const a = audio, o = a.createOscillator(), g = a.createGain();
    o.type = forma; o.frequency.value = freq;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(this.vol); o.start(t); o.stop(t + dur + 0.02);
  },
  batida(t, dur, vol, corte) {
    const a = audio, src = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain();
    src.buffer = this.ruido; f.type = 'highpass'; f.frequency.value = corte;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(this.vol); src.start(t); src.stop(t + dur + 0.02);
  },
  agendar() {
    if (!audio) return;
    if (this.alvo === 0 && this.vol && this.vol.gain.value < 0.01) return;   // silêncio: não agenda nada
    const intenso = this.alvo === 2, colcheia = 60 / (intenso ? 138 : 100) / 2, hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
    while (this.prox < audio.currentTime + 0.2) {
      const t = this.prox, p = this.passo % 16;
      this.nota(hz(this.BAIXO[p] - 12), t, colcheia * 0.9, 'triangle', 0.22);
      if (p % 4 === 0) this.nota(70, t, 0.18, 'sine', 0.5);                      // bumbo
      if (p % 8 === 4) this.batida(t, 0.16, 0.22, 1200);                        // caixa
      if (intenso || p % 2 === 0) this.batida(t, 0.04, 0.05, 6000);             // chimbal
      if (intenso && this.MELODIA[p]) this.nota(hz(this.MELODIA[p]), t, colcheia * 0.8, 'square', 0.035);
      this.prox += colcheia; this.passo++;
    }
  },
};

window.__honkMusica = musica;   // (diagnóstico)
