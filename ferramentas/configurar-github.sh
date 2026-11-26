#!/usr/bin/env bash
# Configura o repositório no GitHub com as práticas recomendadas da plataforma.
# Pode rodar quantas vezes quiser: cada etapa cria ou atualiza o que já existe.
#
# Uso (na pasta do projeto, com o gh logado como dono do repositório; o nome é opcional):
#   bash ferramentas/configurar-github.sh [Dono/repositorio]
# O publicar-honk.sh já roda este script na primeira publicação.
set -euo pipefail

REPO="${1:-$(gh repo view --json nameWithOwner --jq .nameWithOwner)}"
ok() { printf '  \033[32m✓\033[0m %s\n' "$1"; }
etapa() { printf '\n\033[1m%s\033[0m\n' "$1"; }
echo "Repositório: $REPO"

etapa "1. Apresentação"
gh repo edit "$REPO" \
  --description "Um ganso acordou com ódio: roguelite em xilogravura de cordel cujo motor é SQL (DuckDB-WASM no navegador)" \
  --homepage "https://github.com/$REPO/releases/latest" \
  --add-topic duckdb,sql,game,roguelite,raycasting,webassembly,javascript,jogo,pixel-art,portugues \
  --enable-issues --enable-wiki=false --enable-projects=false >/dev/null
ok "descrição, página de downloads e tópicos; Wiki e Projects desligados (a documentação fica em docs/)"

etapa "2. Pull requests"
gh repo edit "$REPO" \
  --enable-squash-merge --enable-merge-commit=false --enable-rebase-merge=false \
  --delete-branch-on-merge --enable-auto-merge --allow-update-branch >/dev/null
ok "só squash (histórico linear), ramo apagado ao mesclar, mesclagem automática liberada"

etapa "3. Segurança"
# Algumas opções podem já vir ligadas em repositórios públicos; nesse caso, só avisa e segue
tentar() {
  local desc="$1"; shift
  if "$@" >/dev/null 2>&1; then ok "$desc"; else printf '  \033[33m!\033[0m %s: não foi possível ligar por aqui (confira em Settings > Code security)\n' "$desc"; fi
}
tentar "alertas de dependências vulneráveis (Dependabot)" gh api -X PUT "repos/$REPO/vulnerability-alerts"
tentar "correções de segurança automáticas" gh api -X PUT "repos/$REPO/automated-security-fixes"
tentar "aviso de falhas em sigilo (SECURITY.md)" gh api -X PUT "repos/$REPO/private-vulnerability-reporting"
tentar "varredura de segredos" gh api -X PATCH "repos/$REPO" -f "security_and_analysis[secret_scanning][status]=enabled"
tentar "bloqueio de push com segredo" gh api -X PATCH "repos/$REPO" -f "security_and_analysis[secret_scanning_push_protection][status]=enabled"
tentar "análise de código CodeQL (JavaScript, Python e workflows)" \
  gh api -X PATCH "repos/$REPO/code-scanning/default-setup" -f state=configured -f query_suite=default

etapa "4. GitHub Actions"
gh api -X PUT "repos/$REPO/actions/permissions/workflow" \
  -f default_workflow_permissions=read -F can_approve_pull_request_reviews=false >/dev/null
ok "token das actions só com leitura por padrão (cada workflow pede o que precisa)"

etapa "5. Regras de proteção"
# Cria a regra ou atualiza a que já tem o mesmo nome
regra() {
  local nome="$1" json="$2" id
  id="$(gh api "repos/$REPO/rulesets" --jq ".[] | select(.name == \"$nome\") | .id")"
  if [[ -n "$id" ]]; then
    gh api -X PUT "repos/$REPO/rulesets/$id" --input - <<<"$json" >/dev/null
  else
    gh api -X POST "repos/$REPO/rulesets" --input - <<<"$json" >/dev/null
  fi
}
# Administrador (você) pode publicar direto na main, como sempre; os pedidos de outros
# (inclusive do Dependabot) só entram com a verificação "Testes das regras SQL" aprovada.
regra "Proteção da main" '{
  "name": "Proteção da main", "target": "branch", "enforcement": "active",
  "conditions": {"ref_name": {"include": ["~DEFAULT_BRANCH"], "exclude": []}},
  "bypass_actors": [{"actor_id": 5, "actor_type": "RepositoryRole", "bypass_mode": "always"}],
  "rules": [
    {"type": "deletion"},
    {"type": "non_fast_forward"},
    {"type": "required_linear_history"},
    {"type": "required_status_checks", "parameters": {
      "strict_required_status_checks_policy": false,
      "required_status_checks": [
        {"context": "Testes das regras SQL", "integration_id": 15368}]}}
  ]}'
ok "main: não pode ser apagada nem reescrita; histórico linear; pull requests só com as verificações aprovadas"
regra "Proteção das versões" '{
  "name": "Proteção das versões", "target": "tag", "enforcement": "active",
  "conditions": {"ref_name": {"include": ["refs/tags/v*"], "exclude": []}},
  "bypass_actors": [{"actor_id": 5, "actor_type": "RepositoryRole", "bypass_mode": "always"}],
  "rules": [{"type": "deletion"}, {"type": "update"}]}'
ok "tags v*: só o administrador pode apagar ou mover"

etapa "6. Rótulos"
gh label create problema --repo "$REPO" --color B42318 --description "Não instala, não abre ou trava" --force >/dev/null
gh label create jogo --repo "$REPO" --color A86B12 --description "Bug dentro da partida ou equilíbrio" --force >/dev/null
gh label create ideia --repo "$REPO" --color 0E6B5A --description "Inimigo, poder, mundo ou melhoria" --force >/dev/null
gh label create dependências --repo "$REPO" --color 6B7280 --description "Atualização automática (Dependabot)" --force >/dev/null
ok "problema, jogo, ideia e dependências"

etapa "7. Ramos além da main"
mapfile -t ramos < <(gh api "repos/$REPO/branches" --paginate --jq '.[].name' | grep -vx main || true)
if ((${#ramos[@]} == 0)); then
  ok "só existe a main"
else
  for r in "${ramos[@]}"; do
    pr="$(gh pr list --repo "$REPO" --head "$r" --state open --json number --jq '.[0].number')"
    if [[ -n "$pr" ]]; then gh pr close "$pr" --repo "$REPO" --delete-branch --comment "A atualização já foi aplicada na main." >/dev/null
    else gh api -X DELETE "repos/$REPO/git/refs/heads/$r" >/dev/null; fi
    ok "removido: $r"
  done
fi

echo
echo "Pronto. Falta só a imagem de prévia: Settings > General > Social preview > Edit > Upload,"
echo "com o arquivo docs/capturas/previa-social.png."
