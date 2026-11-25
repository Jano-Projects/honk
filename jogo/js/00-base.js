// HONK! — jogo/js/00-base.js
// Base: atalhos ($, sql, preencher), o <canvas>, a resolução e as cores do mundo atual.
// (ferramentas/montar.py junta todos os .js desta pasta, em ordem, num único <script type="module">)

{
const $ = (id) => document.getElementById(id);
const sql = (id) => $(id).textContent;
// Preenche {chaves} do SQL só com NÚMEROS gerados aqui (nunca com texto livre)
const preencher = (texto, vals) => texto.replace(/\{(\w+)\}/g, (_, k) => {
  const v = Number(vals[k]); return (Number.isFinite(v) ? v : 0).toFixed(5);
});

const canvas = $('tela');
const ctx = canvas.getContext('2d', { alpha: false });   // opaco: o navegador compõe a tela mais rápido
const W = 320, H = 200, VH = 160;   // coordenadas lógicas; a tela real é ESC vezes maior, para o traço ficar fino
let ESC = 2;                          // ajustado ao tamanho real da tela (2 a 4)
// projeção: altura do horizonte e altura da câmera (0.5 = olho do ganso; maior = vista de cima)
let HORIZ = 62, CAMZ = 0.62;
let conn;

