// HONK! — jogo/js/14-partida.js
// PARTIDA!: a sequência de carregamento — motor, esquema, save, preparo das regras — e o
// início dos dois laços.
// (ferramentas/montar.py junta todos os .js desta pasta, em ordem, num único <script type="module">)

// ---------- 9. Partida! ----------
try {
  conn = await carregarDuckDB();
  $('statusCarga').textContent = 'Montando os cinco lugares que o ganso vai visitar...';
  await conn.query(sql('sql-esquema'));
  await conn.query(sql('sql-render') + sql('sql-sprites') + sql('sql-hud'));   // cria as views
  await conn.query(sql('sql-carregar-mundo'));
  await restaurar();
  try { await Promise.race([document.fonts.load('20px Rye'), new Promise((r) => setTimeout(r, 2500))]);
        await Promise.race([document.fonts.load('20px "Special Elite"'), new Promise((r) => setTimeout(r, 1500))]); } catch (_) {}
  await carregarArte();
  ajustarResolucao();
  await carregarMundoVisual(1);
  $('statusCarga').textContent = 'Preparando as consultas do jogo...';
  MODO_VAR = !new URLSearchParams(location.search).has('semvar') && await testarVariaveis();
  if (MODO_VAR) await conn.query('SET VARIABLE dt = 0; SET VARIABLE fwd = 0; SET VARIABLE lado = 0; SET VARIABLE giro = 0; SET VARIABLE corre = 0');
  window.__honkModoVar = MODO_VAR;
  P = { mover: await prepararBloco('sql-mover'), tick: await prepararBloco('sql-tick'), inimigos: await prepararBloco('sql-inimigos'), saida: await prepararBloco('sql-saida'),
        saidaLeve: await prepararBloco('sql-saida-leve'),
        entrada: await conn.prepare('UPDATE entrada SET dt = $1::DOUBLE, fwd = $2::DOUBLE, lado = $3::DOUBLE, giro = $4::DOUBLE, corre = $5::DOUBLE, dt_ini = $6::DOUBLE') };
  for (const id of ['sql-bicar', 'sql-honk', 'sql-pena', 'sql-esquiva', 'sql-perfeita', ...EVENTOS.map((e) => e[1])]) P[id] = await prepararBloco(id);
  window.__honkP = P;
  $('telaCarregando').classList.add('oculto');
  window.__honkConn = conn;
  simular();                                      // ritmo do banco
  requestAnimationFrame(imprimir);                 // ritmo do monitor
} catch (e) {
  console.error(e);
  $('statusCarga').textContent = 'Não consegui carregar o DuckDB: ' + e.message +
    ' — se instalou o jogo, reinstale; na versão portátil, confira a internet (só na 1ª vez) ou rode o preparar-offline.';
}
}
