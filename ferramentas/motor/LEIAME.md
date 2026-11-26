# Módulo do motor (DuckDB-WASM)

`duckdb-browser.mjs` é o módulo JavaScript do [DuckDB-WASM](https://github.com/duckdb/duckdb-wasm) 1.32.0
com o [Apache Arrow](https://arrow.apache.org/docs/js/) já dentro, num arquivo só. É ele que deixa o
jogo abrir **direto do disco e sem internet**: o módulo publicado no npm chama o `apache-arrow` pelo
nome do pacote, e o navegador não sabe resolver esse nome sem um servidor ou um empacotador.

- Gerado por [`gerar.sh`](gerar.sh) (esbuild). Só muda quando a versão do DuckDB-WASM muda.
- [`ferramentas/baixar-motor.sh`](../baixar-motor.sh) copia este arquivo para `vendor/` e baixa da
  internet o resto (os dois *workers*, os dois `.wasm` e as fontes).
- Licenças: DuckDB e DuckDB-WASM sob MIT; Apache Arrow sob Apache-2.0; tslib sob 0BSD; flatbuffers
  sob Apache-2.0. Os avisos originais estão preservados nos comentários do próprio arquivo, onde existem.
