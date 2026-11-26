# Segurança

## Como avisar sobre uma falha

Não abra uma *issue* pública. Use **[Reportar uma vulnerabilidade](https://github.com/Jano-Projects/honk/security/advisories/new)**, na aba *Security* do repositório. A mensagem fica visível só para quem mantém o projeto.

Diga o que acontece, como reproduzir, qual versão e qual sistema você usa. A resposta vem em alguns dias, e a correção sai numa versão nova com crédito para quem avisou, se você quiser.

## O que o jogo faz no seu computador

- **Roda offline.** O motor (DuckDB-WASM) e as fontes vão dentro do instalador. O jogo não acessa a internet, não tem conta, não coleta dados e não manda nada para servidor nenhum.
- **Abre numa janela própria do navegador** (Edge, Chrome, Brave ou Chromium), com um **perfil só do jogo**, separado do seu perfil normal: o jogo não vê seus favoritos, senhas nem histórico.
- **Lê arquivos só da própria pasta.** Para abrir direto do disco, o lançador usa a opção `--allow-file-access-from-files` **apenas nesse perfil do jogo**.
- **Servidor local, quando precisa.** No Chromium "snap" (Ubuntu) e no macOS sem navegador compatível, o lançador sobe um servidor que só aceita conexões do próprio computador (`127.0.0.1`), só entrega os arquivos do jogo e se desliga sozinho.
- **O progresso** (moedas, recorde, lojas, desafio do dia) fica no armazenamento desse perfil. A tabela de pastas está em [docs/desenvolvimento.md](docs/desenvolvimento.md#onde-ficam-os-dados-do-jogador).
- **Os instaladores não são assinados digitalmente.** O Windows (SmartScreen) e o macOS (Gatekeeper) podem avisar na primeira vez. Baixe só da [página de Releases](https://github.com/Jano-Projects/honk/releases) e, se quiser, confira o arquivo com o `SHA256SUMS.txt` publicado junto.

## Versões que recebem correção

Só a versão mais recente. Baixe a última release.
