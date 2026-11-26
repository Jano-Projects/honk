# Homologação por plataforma

Cada versão do HONK! é conferida em **Windows**, **Debian**, **Ubuntu**, **Fedora** e **macOS**
de dois jeitos que se completam: o automático confere os instaladores antes de qualquer
publicação, e o manual confere o que só uma pessoa vê (o ícone, a janela abrindo, o jogo rodando).

## Automática (GitHub Actions)

O workflow [Lançamento](../.github/workflows/lancamento.yml) monta os instaladores e, **antes de
publicar**, instala cada um num sistema limpo, confere e desinstala. Se alguma plataforma falhar,
a versão não é publicada.

| Plataforma | Máquina | O que é conferido |
|---|---|---|
| Debian (estável) | `debian:stable` | `.deb` instala sem navegador recomendado; arquivos do jogo, motor e fontes em `/usr/share/honk`; atalho do menu sem terminal; ícone; o lançador escolhe o servidor local quando não há Chromium; o servidor entrega a página e o `.wasm` com o tipo certo; a remoção apaga tudo |
| Ubuntu (LTS) | `ubuntu:latest` | o mesmo, com o `.deb` |
| Ubuntu (mais recente) | `ubuntu:rolling` | o mesmo, com o `.deb` |
| Fedora (mais recente) | `fedora:latest` | o mesmo, com o `.rpm` |
| Windows | `windows-latest` | instalador silencioso só para o usuário; `HONK.exe`, jogo, motor e licença na pasta; atalhos no Menu Iniciar e na Área de Trabalho; o desinstalador remove o programa |
| macOS | `macos-latest` | o `.dmg` abre; o `HONK.app` vai para Aplicativos com lançador executável, ícone, jogo e motor; o `Info.plist` é válido |

A fila de máquinas Mac do GitHub às vezes não anda. Por isso o macOS é **opcional** na publicação: o `.zip` com o `HONK.app` é montado no Linux e sai sempre; o `.dmg` só entra na release quando o Mac conseguiu montá-lo e homologá-lo. Linux e Windows são obrigatórios.

A cada envio para a `main` e em cada pull request, o workflow [Testes](../.github/workflows/testes.yml)
roda os testes das regras SQL e uma rodada curta do caçador de bugs.

Para homologar sem publicar: aba **Actions › Lançamento › Run workflow**. O resumo da execução
traz uma linha por plataforma, e os instaladores ficam em *Artifacts*.

## Manual: roteiro

Para cada versão publicada, em cada sistema disponível (máquina real ou virtual). Marque o que
funcionou e anote o que não funcionou.

| # | O que fazer | O que deve acontecer |
|---|---|---|
| 1 | Baixar o instalador da página de Releases e conferir com o `SHA256SUMS.txt` | A soma bate |
| 2 | Instalar (dois cliques; no macOS, arrastar para Aplicativos) | Termina sem erro; no Windows, sem pedir administrador |
| 3 | Abrir pelo ícone do menu ou da Área de Trabalho | O jogo abre numa janela própria, **sem terminal** e sem barra de endereço |
| 4 | Desligar a internet e abrir de novo | Abre igual: o jogo é 100% offline |
| 5 | Jogar a primeira onda (W A S D, mouse, Espaço, E, C) | O ganso anda, bica, grita e esquiva; os inimigos aparecem e morrem |
| 6 | Apertar **H** | O Almanaque abre com Inimigos, Mundos, Comandos e Poderes |
| 7 | Passar de onda e escolher uma carta (1, 2 ou 3) | A carta entra e o rodapé mostra a onda seguinte |
| 8 | Fechar o jogo e abrir de novo | Moedas e recorde continuam lá |
| 9 | Desinstalar | O programa e o ícone somem; o progresso fica (veja [onde](desenvolvimento.md#onde-ficam-os-dados-do-jogador)) |

### Registro

Copie a linha para cada sistema testado e guarde no texto da release ou numa issue da versão.

| Data | Versão | Sistema | Navegador | 1–9 | Observações |
|---|---|---|---|---|---|
| | | | | | |

### Casos que merecem atenção

- **Ubuntu com Chromium "snap"**: o lançador usa o servidor local. Confira que a janela abre e que, ao fechá-la, nenhum processo `python3` fica rodando.
- **Linux só com Firefox**: o jogo abre numa aba comum do Firefox, pelo servidor local.
- **Windows sem Edge nem Chrome** (raro): o `HONK.exe` mostra um aviso pedindo um navegador compatível.
- **macOS**: na primeira vez, o Gatekeeper pede *botão direito › Abrir*, porque o app não é assinado pela Apple.
- **Máquina virtual sem aceleração 3D**: o jogo deve rodar, com menos quadros por segundo. A tecla `I` mostra o FPS.
