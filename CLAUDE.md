# Gigmate: "Tinder" para encontrar músicos na região

## Objetivo

Projeto de estudo e portfólio (GitHub). Não é para uso real ainda: os usuários são falsos (seed).
Músicos se encontram por swipe, com filtros por instrumento, gêneros (que toca e que gosta),
disponibilidade, objetivo e distância. Like mútuo vira match.
A usuária é Pleno/Sênior e quer APRENDER: o processo importa tanto quanto o resultado.

## Regras de condução

- **Modo autônomo:** trabalhar sem parar a cada passo nem explicar cada comando antes. Registrar
  decisões e motivos em `.claude/decisoes.md` (local) e mostrar só quando ela pedir.
- Usar sempre os geradores do Nx para apps, libs e aliases. Não editar `paths` do
  `tsconfig.base.json` à mão, salvo para corrigir algo e com explicação.
- Não confiar na memória sobre flags e geradores (versões muito novas): confirmar com
  `npx nx g <gerador> --help` e `--dry-run` antes de gerar. Conferir APIs do Angular nas tipagens.
- Se algo falhar: mostrar o erro, diagnosticar e propor a correção. Não empilhar correções às cegas.
- Responder sempre em português.
- Commit/push só quando ela pedir. Commits pequenos, mensagem em inglês (conventional commits).
- `README.md` (público, em português): atualizar "Progresso" a cada passo e "Decisões-chave"
  quando houver decisão nova. Nada pessoal ou da máquina local no README.

## Stack

- Criado com (`--interactive=false --analytics=false` também):

  ```sh
  npx create-nx-workspace@24.0.6 gigmate --preset=angular-monorepo --appName=gigmate \
    --style=scss --ssr=false --bundler=esbuild --unitTestRunner=jest --e2eTestRunner=cypress \
    --linter=eslint --formatter=prettier --prefix=gm --nxCloud=skip --aiAgents=none --skipGit
  ```

- Versões: Nx 24.0.6, Angular 22.2 (zoneless, standalone), TypeScript 6.0, Jest 30, Cypress 16,
  rxjs 7.8, Node 24, npm 11.19. Prefixo npm `@gigmate`, seletor `gm`. Branch `main`.
- Targets de test/lint/e2e inferidos por plugins no `nx.json` (sem executores deprecados).
- Windows + PowerShell 5.1.

## Arquitetura planejada

- Camada de dados atrás de interfaces (`InjectionToken`): `ProfilesRepository`,
  `SwipesRepository`, `MatchesRepository`. 1ª implementação local (seed JSON + `localStorage`);
  depois, opcionalmente, um adaptador Supabase sem mudar telas e stores (ports & adapters).
- Perfis falsos "curtem de volta" por regra determinística (ex.: compatibilidade acima de X).
- Compatibilidade combina: gêneros em comum, disponibilidade em comum (grade dia × turno),
  distância e objetivo. Localização sempre aproximada.
- MVP só com perfis individuais (perfil de banda depois).

## Fases

1. App gerado no Nx (concluída: shell mínimo, `nx-welcome` removido).
2. Domínio: tipos, função de compatibilidade (bem testada), gerador de seed.
3. Camada de dados local: interfaces, adaptador `localStorage`, stores com Signals.
4. Deck: swipe (pointer events), filtros, ordem por compatibilidade.
5. Perfil e onboarding em etapas.
6. Matches: like mútuo, tela de matches, detalhe com amostras.
7. PWA: instalável, offline básico.
8. Opcional: Supabase + login, e2e Cypress, deploy.

## Armadilhas

- PowerShell 5.1: `Set-Content -Encoding utf8` grava BOM e o Nx recusa JSON com BOM
  (`InvalidSymbol ... at 1:1`). Usar a ferramenta Edit/Write ou
  `[IO.File]::WriteAllText(path, texto, (New-Object Text.UTF8Encoding $false))`.
- Commits: gravar a mensagem num arquivo (UTF-8 sem BOM) e usar `git commit -F <arquivo>`;
  o PowerShell 5.1 estraga aspas em `-m`.
- No PowerShell, colocar entre aspas valores com vírgula (`--tags="a,b"`).
- `@nx/angular:library`: passar `--unitTestRunner=jest` e `--style=scss` (confirmar defaults).
- Arquivo que ninguém importa não é checado por `nx test`/`nx build`: usar
  `npx tsc -p <lib>/tsconfig.lib.json --noEmit`.
- Problemas de cache: `npx nx reset`.

## Dev server

`.claude/launch.json` (local) define `gigmate` (`npx.cmd nx serve gigmate`, porta 4200).
