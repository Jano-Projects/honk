// HONK! — jogo/js/13-simulacao.js
// DOIS RITMOS: o laço da SIMULAÇÃO (roda as regras SQL, ~15-60 vezes por segundo) e o da
// IMPRESSÃO (desenha a 60 quadros por segundo, interpolando entre os retratos do banco).
// (ferramentas/montar.py junta todos os .js desta pasta, em ordem, num único <script type="module">)

// ---------- 8. Dois ritmos: SIMULAÇÃO (SQL) e IMPRESSÃO (desenho) ----------
// A simulação roda no ritmo do banco (numa thread separada, o worker do DuckDB) e
// produz "retratos". A impressão roda na taxa do monitor e desenha o último retrato,
// interpolando as animações e reprojetando o giro da câmera que o jogador já fez e
// o banco ainda não devolveu. Assim a tela fica fluida mesmo quando o SQL demora.
const EVENTOS = [['f_ataque', 'sql-ev-ataque'], ['f_tiro', 'sql-ev-tiro'], ['f_invoca', 'sql-ev-invoca'], ['f_proj', 'sql-ev-proj'],
                 ['f_mortos', 'sql-ev-mortos'], ['f_morte', 'sql-ev-morte'], ['f_limpa', 'sql-ev-limpa'],
                 ['f_onda', 'sql-ev-onda'], ['f_campo', 'sql-ev-campo']];
let telaDesde = 0;
let hudAtual = {}, anterior = {}, estadoAnterior = '', giroUltimo = 0;
let retrato = null;              // último resultado completo do SQL (HUD, sprites, paredes)
let paredesCache = null;         // paredes da última saída completa
let cacheValido = false;         // as paredes em cache ainda valem? (câmera parada)
let giroEmVoo = 0, tEnvio = 0;   // giro já enviado ao SQL, mas ainda não devolvido
let ultimaPrev = null, erroPrev = [], desvio = { x: 0, y: 0 };
let entradaAtual = { fwd: 0, lado: 0, corre: 0 }, fatorMove = 1;
let taxaPasso = 0, simulacoes = 0, quadros = 0, tempoFps = performance.now();
const invalidarParedes = () => { cacheValido = false; };
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

function lerColunasParedes(res) {
  const pd = { dist: new Float32Array(W), alt: new Float32Array(W), lado: new Int8Array(W), u: new Float32Array(W), padrao: new Array(W) };
  const c = res.getChild('c').toArray(), dist = res.getChild('dist').toArray(), alt = res.getChild('alt').toArray();
  const lado = res.getChild('lado').toArray(), u = res.getChild('u').toArray(), pad = res.getChild('padrao');
  for (let i = 0; i < c.length; i++) {
    const x = c[i]; if (x < 0 || x >= W) continue;
    pd.dist[x] = dist[i]; pd.alt[x] = alt[i]; pd.lado[x] = lado[i]; pd.u[x] = u[i]; pd.padrao[x] = pad.get(i);
  }
  return pd;
}
function lerSprites(res) {
  const lista = [], sk = res.getChild('s_kind');
  const campos = ['s_tipo', 's_vida', 's_vida_max', 's_flash', 's_escala', 's_alt', 's_texto', 's_idade', 's_wx', 's_wy', 's_sx', 's_ty'].map((n) => res.getChild(n));
  for (let i = 0; i < res.numRows; i++) {
    const k = sk.get(i); if (k === null) continue;
    const [tipo, vida, vida_max, flash, escala, alt, texto, idade, wx, wy, sx, ty] = campos.map((c) => c.get(i));
    lista.push({ kind: k, tipo, vida, vida_max, flash, escala, alt, texto, idade, wx, wy, sx, ty });
  }
  return lista;
}

async function simular() {
  let ultimo = performance.now(), forcaCompleta = 0;
  while (!window.__honkParar) {
    const inicio = performance.now();
    const dt = Math.min(0.1, (inicio - ultimo) / 1000); ultimo = inicio;
    let movendo = false;
    // "pega" os ataques pedidos AGORA; o que for apertado durante o cálculo fica para o próximo ciclo
    const fazBicar = querBicar, fazHonk = querHonk, fazPena = querPena, fazEsquiva = querEsquiva;
    querBicar = querHonk = querPena = querEsquiva = false;
    if (hudAtual.estado === 'vivo' && !pausado) {
      let fwd  = (teclas.has('KeyW') || teclas.has('ArrowUp') ? 1 : 0) - (teclas.has('KeyS') || teclas.has('ArrowDown') ? 1 : 0);
      let lado = (teclas.has('KeyD') ? 1 : 0) - (teclas.has('KeyA') ? 1 : 0);
      if (fwd && lado) { fwd *= Math.SQRT1_2; lado *= Math.SQRT1_2; }     // diagonal não é mais rápida
      const corre = teclas.has('ShiftLeft') || teclas.has('ShiftRight') ? 1 : 0;
      const giro = ((teclas.has('ArrowRight') ? 1 : 0) - (teclas.has('ArrowLeft') ? 1 : 0)) * 2.6 * dt + giroMouse;
      giroMouse = 0; giroUltimo = giro; giroEmVoo = giro; tEnvio = inicio;
      movendo = fwd !== 0 || lado !== 0 || Math.abs(giro) > 1e-6 || fazBicar || fazEsquiva || (hudAtual.esquiva > 0);
      entradaAtual = { fwd, lado, corre };
      // ESQUIVA PERFEITA: o tempo do jogo anda a 35% enquanto dura (câmera lenta)
      const dtJogo = hudAtual.perfeita > 0 ? dt * 0.35 : dt;
      const vals = { fwd, lado, giro, corre, dt: dtJogo };
      // inimigos pensam a cada 2 passos (ou se acumulou tempo demais), com o tempo somado
      dtInimigos += dtJogo; passoSim++;
      const pensam = passoSim % 2 === 0 || dtInimigos > 0.15 || hudAtual.n_inimigos <= 1;
      await gravarEntrada(dtJogo, fwd, lado, giro, corre, pensam ? Math.min(0.2, dtInimigos) : 0);      // grava a entrada do quadro
      if (fazEsquiva) await rodarBloco(P['sql-esquiva'], vals);
      await rodarBloco(P.mover, vals);
      if (hudAtual.esquiva > 0 || fazEsquiva) await rodarBloco(P['sql-perfeita'], vals);
      if (fazBicar) await rodarBloco(P['sql-bicar'], vals);
      if (fazHonk)  await rodarBloco(P['sql-honk'], vals);
      if (fazPena)  await rodarBloco(P['sql-pena'], vals);
      for (const [sinal, bloco] of EVENTOS) if (hudAtual[sinal]) await rodarBloco(P[bloco], vals);   // só quando o SQL pede
      if (pensam) { await rodarBloco(P.inimigos, vals); dtInimigos = 0; }
      await rodarBloco(P.tick, vals);
    } else { giroMouse = 0; tEnvio = inicio; }

    if (repreparar && hudAtual.n_inimigos > 0) { repreparar = false; await prepararQuentes(); }
    // paredes: só recalcula quando a câmera pode ter mudado
    const completa = movendo || !cacheValido || ++forcaCompleta > 30;
    const res = await rodarBloco(completa ? P.saida : P.saidaLeve);
    if (completa) { paredesCache = lerColunasParedes(res); cacheValido = true; forcaCompleta = 0; }
    const h = { ...res.get(0) };
    const sprites = lerSprites(res);
    const agora = performance.now();
    acompanhar(sprites, h, agora);
    // ritmo dos passos para a interpolação; parado = 0 (senão o corpo "passa do ponto" e dá um tranco)
    taxaPasso = movendo && retrato ? Math.max(0, (h.passo - retrato.h.passo) / Math.max(0.001, (agora - retrato.t) / 1000)) : 0;
    // quanto do movimento pedido aconteceu de verdade (0 = travado na parede): freia a previsão
    if (retrato && movendo && hudAtual.estado === 'vivo') {
      const pedido = Math.hypot(entradaAtual.fwd, entradaAtual.lado) * (h.vel || 3) * (1 + 0.45 * entradaAtual.corre) * Math.max(0.001, (agora - retrato.t) / 1000);
      const feito = Math.hypot(h.px - retrato.h.px, h.py - retrato.h.py);
      if (pedido > 0.005 && !(h.esquiva > 0)) fatorMove = fatorMove * 0.5 + limita(feito / pedido, 0, 1) * 0.5;
    }
    giroEmVoo = 0;

    if (h.mundo !== mundoCarregado) {
      await carregarMundoVisual(h.mundo); invalidarParedes(); repreparar = true;
      if (h.estado === 'vivo') falar(h.ciclo > (anterior.ciclo || 1) ? 'ciclo' : 'mundo' + h.mundo, 3000, 3200);   // depois da capa do mundo
    }
    musica.tocar(h.estado === 'vivo' && !pausado ? (h.onda % 5 === 0 && h.n_inimigos > 0 ? 2 : 1) : 0);
    if (anterior.estado === 'vivo') {                // sons a partir das mudanças de estado
      if (h.honk_anim > (anterior.honk_anim || 0) + 0.1) { som('honk'); trauma = Math.max(trauma, 0.5); zoomMola.v += 0.9; }
      if (h.bico_anim > (anterior.bico_anim || 0) + 0.05) {
        som('bica'); zoomMola.v += 0.25;
        // acertou alguém? pancada mais forte na câmera
        if (sprites.some((s) => s.kind === 'inimigo' && s.flash > 0.12)) { trauma = Math.max(trauma, 0.35); zoomMola.v += 0.5; }
      }
      if (h.dor > (anterior.dor || 0) + 0.05) { som('dor'); trauma = Math.max(trauma, 0.75); }
      if (h.esquiva > (anterior.esquiva || 0) + 0.1) { som('esquiva'); zoomMola.v += 0.5; M.corpo.v -= 1.2; }
      if (h.perfeita > (anterior.perfeita || 0) + 0.1) { som('perfeita'); carimbo = { texto: 'PERFEITA!', t0: agora }; zoomMola.v += 1.2; falar('perfeita'); }
      if (h.vida > 0 && h.vida < h.vida_max * 0.25 && (anterior.vida || 0) >= anterior.vida_max * 0.25) falar('ferido');
      if (h.abates > (anterior.abates || 0)) {
        som('abate'); trauma = Math.max(trauma, 0.28);
        if (h.onda % 5 === 0 && h.n_inimigos === 0) falar('chefe', 1800);     // o chefe caiu
      }
      if (h.onda > (anterior.onda || 0)) { som('onda'); carimbo = { texto: h.onda % 5 === 0 ? 'CHEFE!' : 'ONDA ' + h.onda_ciclo, t0: agora + (h.titulo ? Math.max(0, h.titulo_resta) * 1000 : 0) }; }
    }
    retrato = { h, sprites, paredes: paredesCache, t: agora, t0: inicio, ent: { ...entradaAtual } };
    atualizarLog(h);
    anterior = hudAtual; hudAtual = h;
    if (h.estado !== estadoAnterior) { estadoAnterior = h.estado; invalidarParedes(); await mudouEstado(h); }
    simulacoes++;
    window.__honkProf = { sql: agora - inicio };
    // no máximo ~60 simulações por segundo (não adianta mais, e poupa a CPU)
    const gasto = performance.now() - inicio;
    await dormir(Math.max(0, 15 - gasto));
  }
}

// interpola as animações entre dois retratos do SQL (os tempos "andam" sozinhos)
function interpolar(h, e) {
  const menos = (v) => Math.max(0, (v || 0) - e);
  return { ...h, t: h.t + e, passo: h.passo + taxaPasso * e, honk_anim: menos(h.honk_anim), bico_anim: menos(h.bico_anim),
           dor: menos(h.dor), feliz: menos(h.feliz), titulo_resta: (h.titulo_resta || 0) - e, titulo: (h.titulo_resta || 0) - e > 0 };
}

let intervalos = [], ultimoDesenho = 0, limiteDesenho = 0;
// câmera v6: 'trauma' decai e o tremor é o quadrado dele (pancada forte, sossega rápido); zoom e rolagem com mola
let trauma = 0; const zoomMola = { x: 0, v: 0 }, rolaMola = { x: 0, v: 0 };   // limiteDesenho: ms mínimos entre quadros (0 = livre)
function imprimir(agora) {
  if (window.__honkParar) return;
  requestAnimationFrame(imprimir);
  // RITMO ADAPTATIVO: se o banco estiver ficando sem CPU (máquina sem placa de vídeo),
  // a tela desenha um pouco menos para devolver processador à simulação.
  const limite = window.__honkLimite ?? limiteDesenho;
  if (limite && agora - ultimoDesenho < limite - 1) return;
  if (!retrato || !retrato.paredes) return;
  const ativo = hudAtual.estado === 'vivo' && !pausado;
  // tempo desde o último retrato. O horário do requestAnimationFrame é o do INÍCIO do
  // quadro e pode ser um pouco anterior à chegada do retrato: sem o "max(0, ...)" o
  // tempo ficava negativo e animações zeradas viravam positivas (HONK e dor piscando).
  const e = (ativo ? Math.max(0, Math.min(0.12, (agora - retrato.t) / 1000)) : 0) * (retrato.h.perfeita > 0 ? 0.35 : 1);
  const agoraS = performance.now() / 1000;
  dtQuadro = limita(agoraS - relogio, 0.001, 0.1); relogio = agoraS;
  const h = interpolar(retrato.h, e);
  // REPROJEÇÃO: o giro que o jogador já fez e o SQL ainda não devolveu
  const taxaGiro = ativo ? ((teclas.has('ArrowRight') ? 1 : 0) - (teclas.has('ArrowLeft') ? 1 : 0)) * 2.6 : 0;
  const pendente = ativo ? giroEmVoo + giroMouse + taxaGiro * Math.max(0, Math.min(0.1, (agora - tEnvio) / 1000)) : 0;
  h.ang += pendente;
  const dx = Math.max(-60, Math.min(60, -Math.tan(pendente) / 0.66 * (W / 2)));
  ultimoAng = retrato.h.ang; terceiraPessoa = h.recuo > 0.3;
  // PREVISÃO DO GANSO: anda com as teclas de AGORA pelo tempo desde o retrato (no espaço da câmera)
  let camF = 0, camL = 0, vF = 0, vL = 0;
  if (ativo && retrato.h.estado === 'vivo') {
    let fw = (teclas.has('KeyW') || teclas.has('ArrowUp') ? 1 : 0) - (teclas.has('KeyS') || teclas.has('ArrowDown') ? 1 : 0);
    let la = (teclas.has('KeyD') ? 1 : 0) - (teclas.has('KeyA') ? 1 : 0);
    if (fw && la) { fw *= Math.SQRT1_2; la *= Math.SQRT1_2; }
    const co = teclas.has('ShiftLeft') || teclas.has('ShiftRight') ? 1 : 0;
    const spd = (retrato.h.vel || 3) * (1 + 0.45 * co) * fatorMove;
    const em = limita((agora - (retrato.t0 ?? retrato.t)) / 1000, 0, 0.2);   // desde o INÍCIO do cálculo do retrato
    camF = fw * spd * em; camL = la * spd * em; vF = fw * spd; vL = la * spd;
    if (retrato.h.esquiva > 0) {                       // a arrancada da esquiva também é prevista
      const te = Math.min(em, retrato.h.esquiva) * (retrato.h.vel || 3) * 3.0, c = Math.cos(ultimoAng), sn = Math.sin(ultimoAng);
      camF += (retrato.h.esq_x * c + retrato.h.esq_y * sn) * te; camL += (-retrato.h.esq_x * sn + retrato.h.esq_y * c) * te;
    }
  }
  const cA = Math.cos(ultimoAng), sA = Math.sin(ultimoAng);
  let camWx = cA * camF - sA * camL, camWy = sA * camF + cA * camL;     // o mesmo deslocamento no mundo
  // SUAVIZAÇÃO DO ACERTO: quando chega um retrato novo, a diferença entre o que já estava desenhado
  // e a nova previsão vira um desvio que some em ~80 ms (em vez de um tranco num quadro só)
  if (ativo && ultimaPrev && ultimaPrev.r !== retrato) {
    const passoX = (cA * vF - sA * vL) * dtQuadro, passoY = (sA * vF + cA * vL) * dtQuadro;
    const ox = ultimaPrev.x + passoX - (retrato.h.px + camWx), oy = ultimaPrev.y + passoY - (retrato.h.py + camWy);
    if (Math.hypot(ox, oy) < 0.6) { desvio.x = ox; desvio.y = oy; } else desvio.x = desvio.y = 0;   // longe demais = teleporte
  }
  if (!ativo) desvio.x = desvio.y = 0;
  const some = Math.exp(-dtQuadro * 13); desvio.x *= some; desvio.y *= some;
  camWx += desvio.x; camWy += desvio.y;
  camF = cA * camWx + sA * camWy; camL = -sA * camWx + cA * camWy;       // de volta ao espaço da câmera (paredes)
  if (window.__honkSemPrevisao) { camWx = camWy = camF = camL = 0; }   // só para comparar nos testes
  // PREVISÃO: inimigos e projéteis continuam andando com a velocidade que tinham entre os retratos
  const sprites = retrato.sprites.map((s) => {
    const n = { ...s, idade: s.idade + e, flash: s.flash - e };
    const mx = (ativo ? (s.vx || 0) * e : 0) - camWx, my = (ativo ? (s.vy || 0) * e : 0) - camWy;
    if (mx || my) { const p = projetaDelta(s, mx, my, ultimoAng); n.sx = p.sx; n.ty = p.ty; }
    n.sx += dx; return n;
  });
  h.px += camWx; h.py += camWy;
  // diagnóstico de fluidez: quanto a posição desenhada anda de um quadro para o outro
  // (n = quadro normal, r = primeiro quadro depois de chegar um retrato novo: se for bem maior, há tranco)
  if (ultimaPrev && ativo) { erroPrev.push([Math.hypot(h.px - ultimaPrev.x, h.py - ultimaPrev.y) / dtQuadro, ultimaPrev.r !== retrato ? 1 : 0]);
    if (erroPrev.length > 600) erroPrev.shift(); window.__honkPrev = erroPrev; }
  ultimaPrev = { x: h.px, y: h.py, r: retrato };

  const tDesenho = performance.now();
  // projeção: em 3ª pessoa o horizonte sobe e a câmera fica mais alta (vê mais chão)
  const terceira = Math.max(0, Math.min(1, (h.cam_cfg || 0) / 1.6));
  HORIZ = 80 - 18 * terceira; CAMZ = 0.5 + 0.12 * terceira;
  const giroAlvo = Math.max(-1, Math.min(1, taxaGiro / 2.6 + giroUltimo * 25));
  giroVisual += (giroAlvo - giroVisual) * 0.2;
  // TREMOR suave (ondas somadas, não sorteio) que some sozinho
  trauma = Math.max(0, trauma - dtQuadro * 1.6);
  const forca = trauma * trauma * 7, q = relogio;
  const tx = (Math.sin(q * 47) + Math.sin(q * 29.3) * 0.6) * forca * 0.6, ty = (Math.sin(q * 39.7 + 1) + Math.sin(q * 23.1) * 0.6) * forca * 0.5;
  // ZOOM: soco no HONK (mola) + leve aproximação correndo; ROLAGEM: inclina ao andar de lado e virar
  const correndo = ativo && (teclas.has('ShiftLeft') || teclas.has('ShiftRight')) && (teclas.has('KeyW') || teclas.has('ArrowUp')) ? 0.035 : 0;
  const zoom = mola(zoomMola, correndo, 120, 12);
  const ladoTecla = ativo ? (teclas.has('KeyD') ? 1 : 0) - (teclas.has('KeyA') ? 1 : 0) : 0;
  const rola = mola(rolaMola, ativo ? ladoTecla * 0.012 + giroVisual * 0.014 : 0, 60, 11);
  // escala mínima para que tremor e rolagem nunca mostrem a borda da tela
  const esc = 1 + Math.max(0, zoom) + Math.abs(rola) * 2.2 + (Math.abs(tx) + Math.abs(ty)) * 2.2 / VH;
  ctx.setTransform(ESC, 0, 0, ESC, 0, 0);
  ctx.translate(W / 2 + tx, VH / 2 + ty); ctx.rotate(rola); ctx.scale(esc, esc); ctx.translate(-W / 2, -VH / 2);
  ctx.imageSmoothingEnabled = false;
  // quanto está andando: pela VELOCIDADE do passo (independe do FPS), com transição suave
  andando = suave(andando, ativo ? Math.min(1, taxaPasso / 2) : 0, 9);
  const bob = Math.sin(h.passo * 5) * (terceira ? 0.6 : 1.5) * (0.3 + 0.7 * andando);
  imprimirCeuEChao(h, bob);
  imprimirParedes(retrato.paredes, bob, dx, camF, camL);
  let centroHonk = VH / 2;
  if (terceira > 0.5 && h.recuo > 0.3 && h.estado !== 'inicio') {
    imprimirCaidos(bob, h.ang, h.recuo, 1e9);
    imprimirSprites(sprites, bob, h.t, h.recuo, 1e9);   // atrás do ganso
    centroHonk = imprimirGanso(h, bob, h.t);
    imprimirCaidos(bob, h.ang, 0.2, h.recuo);
    imprimirSprites(sprites, bob, h.t, 0.2, h.recuo);   // entre a câmera e o ganso
  } else {
    imprimirCaidos(bob, h.ang);
    imprimirSprites(sprites, bob, h.t);
    if (h.estado !== 'inicio') imprimirBico(h);
  }
  if (h.estado === 'vivo') { imprimirAlvo(h, sprites); imprimirAmeacas(h, sprites); }
  if (h.esquiva > 0) imprimirArrancada(h);
  if (h.ev_noite) imprimirNoite();
  imprimirEfeitos(h, centroHonk);
  if (h.perfeita > 0) imprimirCameraLenta(h);
  imprimirFala(centroHonk, terceira);
  imprimirCarimbo(agora);
  ctx.setTransform(ESC, 0, 0, ESC, 0, 0);
  ctx.strokeStyle = COR.tinta; ctx.lineWidth = 1.5; ctx.strokeRect(1.5, 1.5, W - 3, VH - 3);   // moldura da gravura (fica parada)
  imprimirMinimapa(h, sprites);
  imprimirStatus(h);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  window.__honkDesenho = performance.now() - tDesenho;

  if (ultimoDesenho) { intervalos.push(agora - ultimoDesenho); if (intervalos.length > 600) intervalos.shift(); }
  ultimoDesenho = agora;
  quadros++;
  if (agora - tempoFps > 1000) {
    if (hudAtual.estado === 'vivo' && !pausado) {
      if (simulacoes < 18 && quadros > 30) limiteDesenho = Math.min(33, limiteDesenho + 4);        // devolve CPU ao banco
      else if (simulacoes >= 24 && limiteDesenho > 0) limiteDesenho = Math.max(0, limiteDesenho - 4); // sobrou CPU: mais quadros
    }
    $('fps').textContent = `${quadros} FPS · simulação ${simulacoes}/s`;
    window.__honkFps = quadros; window.__honkSim = simulacoes; window.__honkIntervalos = intervalos.slice();
    quadros = 0; simulacoes = 0; tempoFps = agora;
  }
}

