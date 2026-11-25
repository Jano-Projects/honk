// HONK! — jogo/js/12-almanaque.js
// ALMANAQUE DO GANSO: o livreto de consulta (inimigos, mundos e ciclos, comandos, poderes),
// montado a partir das mesmas tabelas SQL que o jogo usa.
// (ferramentas/montar.py junta todos os .js desta pasta, em ordem, num único <script type="module">)

// ---------- 7b. ALMANAQUE DO GANSO ----------
// Livreto de consulta, fora da luta. Tudo vem das MESMAS tabelas que o jogo usa
// (tipo_inimigo, mundo, balanco, carta, loja): se alguém mudar o equilíbrio no SQL, o almanaque acompanha.
let almanaqueAberto = false, almanaqueDe = null, abaAtual = 'inimigos';
const DICAS = {
  pombo: 'Fraco e rápido, vem em bando. Um HONK limpa a roda toda.',
  crianca: 'Fica de longe jogando pão. Corra até ela em zigue-zague ou esquive o pão.',
  cachorro: 'O mais veloz do parque. Espere ele chegar e bique; não adianta fugir.',
  senhora: 'Chama pombos sem parar. Derrube-a primeiro ou o parque enche.',
  guarda: 'Chefe do parque. Atira multas: esquive na hora do tiro e bique entre um e outro.',
  galinha: 'Fraca, mas ziguezagueia. Bique quando ela parar de desviar.',
  bode: 'Bate forte. Esquive a chifrada e contra-ataque pelas costas.',
  fazendeiro: 'Joga ovos de longe e aguenta bastante. Use paredes para cortar a linha de tiro.',
  corvo: 'Voa e ziguezagueia. Difícil de mirar: deixe que ele venha e use o HONK.',
  espantalho: 'Chefe da fazenda. Lento, muita vida e chama corvos. Não fique parado perto dele.',
  drone: 'Voa e atira lasers. O HONK destrói projéteis próximos.',
  carrinho: 'Vem em linha reta e muito rápido. Uma esquiva de lado e ele passa direto.',
  controlador: 'Carimba NEGADO de longe. Aproxime-se esquivando.',
  seguranca: 'Resistente e insistente. Bique, recue, bique de novo.',
  airbus: 'Chefe do Aeroporto e do fim de cada ciclo. Atira malas e solta carrinhos de bagagem. Guarde a esquiva para as malas.',
  gato: 'Rápido e traiçoeiro. Não corra atrás: deixe vir e bique.',
  feirante: 'Joga tomates de longe. Use as barracas para cortar a linha de tiro.',
  vovo: 'Aguenta muito e o carrinho machuca. Bique e esquive para o lado.',
  pasteleiro: 'Arremessa pastéis e foge. Encurrale ele num canto entre as barracas.',
  caminhao: 'Chefe da Feira. Enorme, atira botijões e chama gatos. Fique fora da frente dele e bique pelos lados.',
  aspirador: 'Baixinho e rápido. O HONK resolve quando vêm vários.',
  promotor: 'Persegue de longe jogando panfletos. Corra até ele esquivando: de perto ele é fraco.',
  mascote: 'Muita vida e abraço forte. Lute perto de um pilar para não ficar cercado.',
  patinete: 'Passa voando em linha reta. Esquive de lado e ele vira as costas para você.',
  noel: 'Chefe do Shopping. Atira presentes e solta robôs aspiradores. Derrube os robôs com HONK e volte ao Noel.',
};
const PROJETIL = { pao: 'pão', multa: 'multas', ovo: 'ovos', raio: 'lasers', negado: 'carimbos', mala: 'malas',
                   tomate: 'tomates', pastel: 'pastéis', botijao: 'botijões', panfleto: 'panfletos', presente: 'presentes' };
const esc = (t) => String(t ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

async function abrirAlmanaque() {
  if (almanaqueAberto) return;
  almanaqueDe = [...document.querySelectorAll('.tela:not(.oculto)')].find((t) => t.id !== 'telaAlmanaque') || null;
  if (almanaqueDe) almanaqueDe.classList.add('oculto');
  almanaqueAberto = true;
  $('telaAlmanaque').classList.remove('oculto');
  if (document.pointerLockElement) { soltandoDePropósito = true; document.exitPointerLock(); }
  await mostrarAba(abaAtual);
  document.querySelector(`#telaAlmanaque [data-aba="${abaAtual}"]`)?.focus();
}
function fecharAlmanaque() {
  almanaqueAberto = false;
  $('telaAlmanaque').classList.add('oculto');
  if (almanaqueDe && document.body.contains(almanaqueDe)) almanaqueDe.classList.remove('oculto');
  almanaqueDe = null;
}
for (const b of document.querySelectorAll('[data-almanaque]')) b.addEventListener('click', abrirAlmanaque);
$('btnFecharAlmanaque').addEventListener('click', fecharAlmanaque);
for (const b of document.querySelectorAll('#telaAlmanaque [data-aba]')) b.addEventListener('click', () => mostrarAba(b.dataset.aba));
// setas esquerda/direita trocam de aba (navegação de teclado das abas)
document.querySelector('#telaAlmanaque .abas').addEventListener('keydown', (e) => {
  if (e.code !== 'ArrowLeft' && e.code !== 'ArrowRight') return;
  const abas = [...document.querySelectorAll('#telaAlmanaque [data-aba]')];
  const i = abas.findIndex((b) => b.dataset.aba === abaAtual), n = abas[(i + (e.code === 'ArrowRight' ? 1 : abas.length - 1)) % abas.length];
  e.preventDefault(); e.stopPropagation(); mostrarAba(n.dataset.aba); n.focus();
});

async function mostrarAba(aba) {
  abaAtual = aba;
  for (const b of document.querySelectorAll('#telaAlmanaque [data-aba]')) b.setAttribute('aria-selected', String(b.dataset.aba === aba));
  const livro = $('livro');
  if (aba === 'inimigos') await abaInimigos(livro);
  if (aba === 'mundos') await abaMundos(livro);
  if (aba === 'comandos') abaComandos(livro);
  if (aba === 'poderes') await abaPoderes(livro);
  $('telaAlmanaque').scrollTop = 0;
}

async function abaInimigos(livro) {
  const b = (await linhas('SELECT nome, cresc_vida, cresc_dano FROM b'))[0];
  const mundos = await linhas('SELECT id, nome, subtitulo FROM mundo ORDER BY id');
  const tipos = await linhas('SELECT * FROM tipo_inimigo ORDER BY mundo, chefe, onda_min, vida');
  const max = { vida: 40, dano: 4, vel: 2.6 };      // escala das barrinhas (chefes passam do topo)
  livro.innerHTML = `<p class="nota">Quem entrou no caminho do ganso. Valores-base do 1º ciclo: a cada onda eles ficam mais fortes
    (na dificuldade <b>${esc(b.nome)}</b>: +${(Math.round((b.cresc_vida - 1) * 1000) / 10).toString().replace('.', ',')}% de vida e
    +${(Math.round((b.cresc_dano - 1) * 1000) / 10).toString().replace('.', ',')}% de dano por onda), e a cada ciclo muito mais (veja "Mundos e ciclos").</p>` +
    mundos.map((m) => `<h3>Mundo ${m.id}: ${esc(m.nome)}<small>${esc(m.subtitulo)}</small></h3><div class="bestas">` +
      tipos.filter((t) => t.mundo === m.id).map((t) => {
        const onda = (t.mundo - 1) * 5 + (t.chefe ? 5 : t.onda_min);
        const barra = (rot, v, mx, txt) => `<span>${rot}</span><i style="--f:${Math.min(100, v / mx * 100).toFixed(0)}%"></i><span>${txt}</span>`;
        const ataque = t.projetil ? `atira ${PROJETIL[t.projetil] || t.projetil}`
          : t.comportamento === 'distancia' ? 'mantém distância' : 'corpo a corpo';
        return `<article class="besta${t.chefe ? ' chefe' : ''}">
          <canvas data-tipo="${esc(t.tipo)}" width="48" height="48" aria-hidden="true"></canvas>
          <div><b>${esc(t.nome)}</b>
            ${t.chefe ? '<span class="selo vermelho">CHEFE</span>' : ''}<span class="selo">onda ${onda}</span>
            ${t.voa > 0 ? '<span class="selo">voa</span>' : ''}${t.invoca ? `<span class="selo">chama ${esc((tipos.find((x) => x.tipo === t.invoca) || {}).nome || t.invoca)}</span>` : ''}</div>
          <div class="stats">${barra('Vida', t.vida, max.vida, t.vida)}${barra('Dano', t.dano, max.dano, t.dano)}${barra('Veloc.', t.vel, max.vel, t.vel.toFixed(1))}</div>
          <p>Ataque: ${ataque} · Recompensa: ${t.recompensa} migalha${t.recompensa === 1 ? '' : 's'}</p>
          <p><q>${esc(t.frase)}</q></p>
          <p>${esc(DICAS[t.tipo] || '')}</p>
        </article>`;
      }).join('') + '</div>').join('');
  // retratos: a mesma xilogravura usada no jogo, centralizada no quadradinho
  for (const c of livro.querySelectorAll('canvas[data-tipo]')) {
    const arte = imagens[c.dataset.tipo]; if (!arte) continue;
    const img = arte.normal.img, g = c.getContext('2d'), k = Math.min(48 / img.width, 48 / img.height);
    g.imageSmoothingEnabled = false;
    g.drawImage(img, (48 - img.width * k) / 2, (48 - img.height * k) / 2, img.width * k, img.height * k);
  }
}

async function abaMundos(livro) {
  const mundos = await linhas('SELECT id, nome, subtitulo FROM mundo ORDER BY id');
  const tipos = await linhas('SELECT tipo, nome, mundo, onda_min, chefe FROM tipo_inimigo ORDER BY onda_min, nome');
  const bal = await linhas('SELECT nome, vida_ini, dano_ini, cresc_vida, cresc_dano, mult_migalhas, cura_onda, (id = (SELECT dificuldade FROM config)) AS atual FROM balanco ORDER BY id');
  const pct = (v) => `${v >= 1 ? '+' : ''}${Math.round((v - 1) * 100)}%`;
  const rec = (await linhas('SELECT recorde, vitorias FROM ninho'))[0];
  livro.innerHTML = `<p class="nota"><b>Um ganso acordou com ódio</b> e saiu do lago para se vingar de todo mundo.
      Cada <b>ciclo</b> passa por <b>5 lugares</b>, com <b>5 ondas</b> cada (<b>25 ondas</b>). A 5ª onda de cada lugar é um <b>chefe</b>.
      Ao limpar uma onda, você escolhe 1 de 3 cartas de poder e recupera um pouco de vida.</p>
    <p class="nota"><b>O jogo não acaba.</b> Depois do Airbus, o ganso ainda está com raiva e volta ao Parque num ciclo novo
      (e ganha 50 migalhas por ciclo completado). O mais longe que você já foi: <b>${rec.recorde > 0 ? `onda ${(rec.recorde - 1) % 25 + 1} do ciclo ${Math.floor((rec.recorde - 1) / 25) + 1}` : 'ainda nenhum'}</b>.</p>
    <div class="mundos">` + mundos.map((m) => `<section><h3>Mundo ${m.id}: ${esc(m.nome)}<small>${esc(m.subtitulo)} · ondas ${(m.id - 1) * 5 + 1}–${m.id * 5} do ciclo</small></h3>
      <div class="trilha">` + [1, 2, 3, 4, 5].map((k) => {
        const n = (m.id - 1) * 5 + k;
        if (k === 5) { const c = tipos.find((t) => t.mundo === m.id && t.chefe); return `<div class="boss"><b>Onda ${n}</b>CHEFE: ${esc(c?.nome)}</div>`; }
        const novos = tipos.filter((t) => t.mundo === m.id && !t.chefe && t.onda_min === k).map((t) => esc(t.nome));
        return `<div><b>Onda ${n}</b>${Math.min(1 + k + Math.min(m.id, 3), 12)} inimigos${novos.length ? `<br>novo: ${novos.join(', ')}` : ''}</div>`;
      }).join('') + '</div></section>').join('') + `</div>
    <h3>Como o ódio escala</h3>
    <table class="tabela"><thead><tr><th></th><th>Inimigos</th></tr></thead><tbody>
      <tr><td>Ciclo 1</td><td>Crescem um pouco a cada onda (tabela abaixo). É o ciclo para aprender.</td></tr>
      <tr><td>Ciclo 2 em diante</td><td>Medem a <b>sua</b> força: a vida deles acompanha o seu ataque (dano e crítico), e o dano deles acompanha a sua vida máxima.
        Por cima disso, a cada ciclo: vida <b>×1,5</b>, dano <b>×1,3</b>, velocidade +5% (até +30%), +1 inimigo por onda. Eles também deixam +50% de migalhas por ciclo.</td></tr>
      <tr><td>Regra do ciclo</td><td>Do 2º ciclo em diante, cada volta sorteia uma regra especial: ${(await linhas("SELECT string_agg(lower(nome), ', ') AS n FROM evento WHERE id > 0"))[0].n}.</td></tr>
      <tr><td>Esquiva perfeita</td><td>Esquivar no último instante de um ataque desacelera o tempo e garante crítico na próxima bicada. Chefes avisam antes de atirar (um "!" acende; o "+" avisa reforços).</td></tr>
      <tr><td>Desafio do dia</td><td>Botão na tela inicial: todos começam iguais (sem loja), com a mesma regra, os mesmos inimigos e as mesmas cartas no dia.</td></tr>
      <tr><td>Os dois tetos</td><td>1º: as cartas têm limite por partida e a loja tem nível máximo. Quando tudo enche, você para de crescer e o expoente segue.
        2º: a partir daí, só a <b>sua habilidade</b> segura (esquiva, mira, posição).</td></tr>
    </tbody></table>
    <h3>Dificuldades</h3>
    <table class="tabela"><thead><tr><th>Dificuldade</th><th>Vida dos inimigos</th><th>Dano dos inimigos</th><th>Crescimento por onda</th><th>Cura entre ondas</th><th>Migalhas</th></tr></thead><tbody>` +
      bal.map((d) => `<tr><td>${esc(d.nome)}${d.atual ? ' (atual)' : ''}</td><td>${pct(d.vida_ini)}</td><td>${pct(d.dano_ini)}</td>
        <td>vida ${pct(d.cresc_vida)}, dano ${pct(d.cresc_dano)}</td><td>${Math.round(d.cura_onda * 100)}% da vida</td><td>${pct(d.mult_migalhas)}</td></tr>`).join('') +
    `</tbody></table>
    <h3>O ninho</h3>
    <p class="nota">Ao cair, as migalhas que você juntou viram <b>moedas</b> no ninho. Gaste na loja (tela inicial ou de derrota)
      em melhorias que valem para sempre. O progresso e o recorde ficam salvos neste navegador.</p>`;
}

function abaComandos(livro) {
  const linha = (teclas, acao) => `<tr><td>${teclas}</td><td>${acao}</td></tr>`;
  const k = (t) => `<kbd>${t}</kbd>`;
  livro.innerHTML = `<h3>Teclado e mouse</h3><table class="tabela"><thead><tr><th>Tecla</th><th>O que faz</th></tr></thead><tbody>
    ${linha(`${k('W')} ${k('A')} ${k('S')} ${k('D')} ou ${k('↑')} ${k('↓')}`, 'Andar (A e D andam de lado)')}
    ${linha(k('Shift'), 'Correr (segure junto com a direção)')}
    ${linha(`${k('←')} ${k('→')} ou mouse`, 'Virar. Clique na tela para prender o mouse')}
    ${linha(`${k('Espaço')} ou clique`, '<b>Bicar</b> com raiva: o inimigo marcado com colchetes vermelhos leva dano. Pode dar crítico (dano x2)')}
    ${linha(k('E'), '<b>HONK</b>: dano em volta, empurra todo mundo e destrói projéteis próximos. Recarrega em alguns segundos')}
    ${linha(`${k('C')}, ${k('Ctrl')} ou botão direito`, '<b>Esquiva</b>: arrancada curta, invencível enquanto dura (recarga 0,9 s)')}
    ${linha(k('Q'), '<b>Pena</b>: tiro à distância (só com a carta Penas Arremessáveis)')}
    ${linha(`${k('1')} ${k('2')} ${k('3')}`, 'Escolher a carta de poder entre as ondas')}
    ${linha(k('V'), 'Câmera: terceira pessoa (atrás do ganso) ou primeira pessoa')}
    ${linha(k('H'), 'Abrir este almanaque (pausa o jogo)')}
    ${linha(`${k('P')} ou ${k('Esc')}`, 'Pausa')}
    ${linha(k('F'), 'Tela cheia')}
    ${linha(k('M'), 'Som liga/desliga')}
    ${linha(k('I'), 'Mostra o FPS (quadros por segundo)')}
  </tbody></table>
  <h3>Celular e tablet</h3><p class="nota">Aparecem botões na tela: setas para andar e virar; BICAR, HONK, PENA e ESQUIVA para agir.</p>
  <h3>Na tela</h3><table class="tabela"><tbody>
    ${linha('Colchetes vermelhos', 'Quem vai levar a próxima bicada')}
    ${linha('Setas na borda', 'Inimigos chegando pelos lados ou por trás (vermelhas) e projéteis perto (pretas). Piscando = colado em você')}
    ${linha('Barra HONK', 'Vermelha e pulsando = pronto. A barrinha fina embaixo é a esquiva')}
    ${linha('Barra de vida', 'A parte raspada mostra o tamanho do último golpe')}
    ${linha('Mapa (canto)', 'Paredes, você (seta) e os inimigos (pontos vermelhos)')}
  </tbody></table>`;
}

async function abaPoderes(livro) {
  const cartas = await linhas('SELECT nome, descricao, rara, max_vezes FROM carta ORDER BY rara, id');
  const loja = await linhas('SELECT nome, descricao, nivel, nivel_max FROM loja ORDER BY idx');
  const ouro = await linhas('SELECT nome, descricao, nivel FROM loja_ouro ORDER BY idx');
  const combos = await linhas('SELECT cb.nome, cb.descricao, ca.nome AS na, cbb.nome AS nb FROM combo cb JOIN carta ca ON ca.efeito = cb.a JOIN carta cbb ON cbb.efeito = cb.b');
  livro.innerHTML = `<h3>Cartas de poder<small>escolha 1 de 3 a cada onda limpa · valem só para a partida · cada uma tem limite</small></h3>
    <table class="tabela"><tbody>${cartas.map((c) => `<tr><td><b>${esc(c.nome)}</b>${c.rara ? ' <span class="moedas">(rara)</span>' : ''}</td><td>${esc(c.descricao)}</td>
      <td>${c.max_vezes >= 99 ? 'sem limite' : `até ${c.max_vezes}×`}</td></tr>`).join('')}</tbody></table>
    <h3>Combos<small>duas cartas juntas liberam um efeito extra · a carta mostra "COMBO!" quando completa um</small></h3>
    <table class="tabela"><tbody>${combos.map((c) => `<tr><td><b>${esc(c.nome)}</b></td><td>${esc(c.na)} + ${esc(c.nb)}</td><td>${esc(c.descricao)}</td></tr>`).join('')}</tbody></table>
    <h3>Loja do ninho<small>compradas com moedas · valem para sempre</small></h3>
    <table class="tabela"><tbody>${loja.map((l) => `<tr><td><b>${esc(l.nome)}</b></td><td>${esc(l.descricao)}</td><td>nível ${l.nivel} de ${l.nivel_max}</td></tr>`).join('')}</tbody></table>
    <h3>Penas de Ouro<small>ganhas a partir do 2º ciclo (chefes e ciclos completos) · sem limite</small></h3>
    <p class="nota">Os inimigos medem a sua força pela loja comum e pelas cartas, não pelo ouro: é a vantagem que fica de verdade. As melhorias são pequenas para nunca alcançar o ×1,5 de cada ciclo.</p>
    <table class="tabela"><tbody>${ouro.map((l) => `<tr><td><b>${esc(l.nome)}</b></td><td>${esc(l.descricao)}</td><td>nível ${l.nivel}</td></tr>`).join('')}</tbody></table>`;
}

