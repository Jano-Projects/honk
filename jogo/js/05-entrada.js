// HONK! — jogo/js/05-entrada.js
// ENTRADA: teclado, mouse (com o ponteiro preso), toque no celular e a pausa automática.
// (ferramentas/montar.py junta todos os .js desta pasta, em ordem, num único <script type="module">)

// ---------- 5. Entrada (teclado, mouse, toque) ----------
const teclas = new Set();
let giroMouse = 0, querBicar = false, querHonk = false, querPena = false, querEsquiva = false, pausado = false;
addEventListener('keydown', (e) => {
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.code)) e.preventDefault();
  teclas.add(e.code);
  if (e.code === 'Space') querBicar = true;
  if (e.code === 'KeyE') querHonk = true;
  if (e.code === 'KeyQ') querPena = true;
  if (['KeyC', 'ControlLeft', 'ControlRight'].includes(e.code) && !e.repeat) querEsquiva = true;
  if (e.code === 'KeyM') mudo = !mudo;
  if (e.code === 'KeyV' && conn) conn.query(sql('sql-camera')).then(invalidarParedes);   // 1ª / 3ª pessoa
  if (e.code === 'KeyF') alternarTelaCheia();
  if (e.code === 'KeyI') $('fps').classList.toggle('oculto');            // mostra/esconde FPS
  if (almanaqueAberto) { if (e.code === 'Escape' || e.code === 'KeyH') fecharAlmanaque(); return; }
  if (e.code === 'KeyH' && P.mover && hudAtual.estado) { if (hudAtual.estado === 'vivo' && !pausado) alternarPausa(); abrirAlmanaque(); return; }
  if ((e.code === 'KeyP' || e.code === 'Escape') && hudAtual.estado === 'vivo' && !(e.code === 'Escape' && pausado && performance.now() - tPausa < 400)) alternarPausa();
  if (hudAtual.estado === 'escolha' && ['Digit1', 'Digit2', 'Digit3'].includes(e.code)) escolher(Number(e.code.slice(-1)));
});
addEventListener('keyup', (e) => teclas.delete(e.code));
addEventListener('blur', () => teclas.clear());
canvas.addEventListener('click', () => {
  if (document.pointerLockElement !== canvas) { try { canvas.requestPointerLock(); } catch (_) {} }
  else querBicar = true;
});
// botão direito do mouse: esquiva
canvas.addEventListener('mousedown', (e) => { if (e.button === 2 && document.pointerLockElement === canvas) { e.preventDefault(); querEsquiva = true; } });
canvas.addEventListener('contextmenu', (e) => e.preventDefault());
addEventListener('mousemove', (e) => { if (document.pointerLockElement === canvas) giroMouse += e.movementX * 0.0025; });
for (const b of document.querySelectorAll('.toque button')) {
  const k = b.dataset.k;
  b.addEventListener('pointerdown', (e) => {
    e.preventDefault(); teclas.add(k);
    if (k === 'Space') querBicar = true; if (k === 'KeyE') querHonk = true; if (k === 'KeyQ') querPena = true; if (k === 'KeyC') querEsquiva = true;
  });
  for (const ev of ['pointerup', 'pointerleave', 'pointercancel']) b.addEventListener(ev, () => teclas.delete(k));
}
function alternarTelaCheia() {
  const palco = $('palco');
  if (document.fullscreenElement) document.exitFullscreen?.();
  else palco.requestFullscreen?.().catch(() => {});
}
$('btnTelaCheia').addEventListener('click', alternarTelaCheia);
let tPausa = 0;
function alternarPausa() {
  pausado = !pausado; tPausa = performance.now();
  $('telaPausa').classList.toggle('oculto', !pausado);
  teclas.clear();                                   // nada fica "preso" apertado ao pausar/voltar
  if (pausado) { if (document.pointerLockElement) { soltandoDePropósito = true; document.exitPointerLock(); } }
  else { try { canvas.requestPointerLock(); } catch (_) {} }
}
const pausarSeJogando = () => { if (hudAtual.estado === 'vivo' && !pausado && !almanaqueAberto) alternarPausa(); };
// O Chrome usa o Esc para soltar o mouse e às vezes nem avisa a página: se o mouse soltar no meio
// da luta, pausa (antes o jogo seguia e o próximo clique só prendia o mouse, sem bicar).
let soltandoDePropósito = false;
document.addEventListener('pointerlockchange', () => {
  if (!document.pointerLockElement && !soltandoDePropósito && !matchMedia('(pointer:coarse)').matches) pausarSeJogando();
  soltandoDePropósito = false;
});
// aba escondida / janela minimizada: pausa (antes os inimigos continuavam batendo no ganso sozinho)
document.addEventListener('visibilitychange', () => { if (document.hidden) pausarSeJogando(); });

