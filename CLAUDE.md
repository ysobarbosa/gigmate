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
2. Domínio (concluída): `libs/musicians/domain` (`@gigmate/musicians/domain`, `@nx/js:library`,
   não buildable, jest em ambiente node, tags `scope:musicians,type:domain`). Tipos derivados
   de arrays `const`, `distanceKm`/`approximateLocation`, `compatibility` (simétrica, 0 a 100),
   `wouldLikeBack` (limite 35) e `generateFakeMusicians` (60 perfis em SP, semente 42). 101 testes.
3. Camada de dados local (concluída): `libs/musicians/data-access` (`@nx/angular:library`, tags
   `scope:musicians,type:data-access`). Portas `ProfilesRepository`/`SwipesRepository` (classes
   abstratas), adaptadores `Local*` (`@Service({ autoProvided: false })`) ligados por
   `provideLocalMusiciansData()` no `app.config.ts`. `KEY_VALUE_STORAGE` (localStorage com
   fallback em memória), `LOCAL_LATENCY_MS` (300; 0 nos testes = síncrono). `DeckStore` global
   (`cards` ordenados por nota, swipe otimista, `lastMatch`). `DEMO_VIEWER`: guitarrista que
   procura baterista. Página temporária `apps/gigmate/src/app/deck/deck-page` (lista + botões).
   29 testes na lib; mutações `exhaustMap`→`mergeMap` e "sem rollback" pegas.
4. Deck (concluída): `matchesFilters`/`defaultFilters` no domínio (raio padrão 10 km);
   filtros no `DeckStore` (salvos em `gigmate:v1:filters`, mesclados com o padrão),
   `hiddenByFilters`. Libs `musicians/ui` (`type:ui`: rótulos pt-BR, `Avatar`, `ChipSelect` com
   `model()`, `MusicianCard`, diretiva `Swipeable` + `swipeOutcome`) e `musicians/feature-deck`
   (`type:feature`: `DeckPage`, `FiltersPanel`, `MatchDialog`). Rota `''` faz lazy load da feature.
   Tema em tokens `--gm-*` no `apps/gigmate/src/styles.scss` (escuro padrão, claro pelo sistema).
5. Perfil e onboarding (concluída): porta `getViewer()` devolve `null` antes do onboarding;
   `ViewerStore` (`ensureLoaded()` para guards, `save()` assíncrono que avisa o `DeckStore`
   via `replaceViewer`, que zera os filtros salvos). Domínio: `NEIGHBORHOODS`/`NEIGHBORHOOD_NAMES`,
   `neighborhoodLocation`, `PROFILE_LIMITS`. UI: `AvailabilityGrid` (`model()` de slots).
   Lib `musicians/feature-profile` (`type:feature`): `WelcomePage`, `ProfileEditorPage`
   (Signal Forms: `form()`, `[formField]`, schema em `profile-form.ts`, `PROFILE_STEPS`,
   `ProfileDraft` plano ↔ `MusicianProfile`). Guards no app (`profile-guards.ts`): `/` exige
   perfil, `/boas-vindas` só sem perfil, `/perfil` só carrega. `DEMO_VIEWER` em Pinheiros
   arredondado (-23.57, -46.69).
6. Matches (concluída): domínio `contact.ts` (`normalizeContact`, `contactHref`,
   `visibleContact`) e `samples.ts` (`samplePlatform`, `MAX_SAMPLES` 3, só https e hosts
   conhecidos); `contact?`/`samples?` opcionais no perfil; `isFakeMusician`. `MatchesStore`
   (recarrega a cada `load()`, mais recente primeiro, contato liberado pelo match). Assistente
   com 6 passos (novo: "Contato e amostras"). UI: `SampleLinks`, `CONTACT_*`. Lib
   `musicians/feature-matches` (`MatchesPage` em `/matches`, `MatchDetailPage` em
   `/matches/:id` via `withComponentInputBinding`). Diálogo de match tem "Ver perfil e contato".
   `.visually-hidden` global em `apps/gigmate/src/styles.scss`.
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
- Fronteiras: `type:app` → feature/ui/data-access/domain; `type:domain` → só domain e sem
  `@angular/*`/`rxjs` (`bannedExternalImports`). Comprovado com um import de prova.
- Rodar um `.ts` solto (o TS 6 recusa `moduleResolution: node10` sem `ignoreDeprecations`):

  ```sh
  npx ts-node --transpile-only -O '{"module":"commonjs","moduleResolution":"node","ignoreDeprecations":"6.0"}' arquivo.ts
  ```

- Prettier: `.prettierrc` tem override `*.html` → parser `angular`. Sem ele, o Prettier formata
  templates como HTML comum e embaralha `@if`/`@for`.
- Toda tag `type:*` nova precisa de regra em `depConstraints`, senão o lint bloqueia o projeto
  ("A project without tags matching at least one constraint...").
- Testes zoneless: sem `fakeAsync`. Com `LOCAL_LATENCY_MS = 0` os adaptadores são síncronos.
- No navegador, o DOM atualiza num frame depois do clique: medir após ~50 ms, não no mesmo tick.
  Screenshot logo após um clique pode sair com a tela no meio da renderização: confirmar com medidas.
- jsdom: sem `PointerEvent` (usar `MouseEvent('pointerdown')`), sem `setPointerCapture` (chamar com
  `?.`), sem `matchMedia`. `textContent` cola irmãos sem espaço: ler `<dt>`/`<dd>`/`<li>` um a um.
- `keydown` no `document`: `event.target` pode ser o próprio document (sem `closest`).
- Lint de template: nada de `(click)` em `div` (usar `<button>`), outputs sem nome de evento
  nativo (`reset`, `close`, `change`...). `@for` de listas estáticas curtas: `track $index`.
- Dev server: reiniciar ao criar libs novas (aliases novos no `tsconfig.base.json`).
- HMR pode aplicar template novo sobre instância antiga ("Cannot read properties of undefined"
  no template): confirmar com reload limpo e um `console.log` marcador antes de investigar.
- Signal Forms: `form(model, schema)` precisa de contexto de injeção (nos testes,
  `TestBed.runInInjectionContext`). Diretiva `[formField]`. Controles próprios (chips, grade)
  ligados à mão: `value.set` + `markAsTouched()`.
- `[attr.x]="false"` grava `x="false"`; para remover o atributo, use `null`.
- `<label>` envolvendo controle + dica + erro polui o nome acessível (inclui as opções do
  select). Usar `<label for>` só com o texto e `aria-describedby` para dica/erro.
- Foco/scroll depois de mudar estado: `afterNextRender(..., { injector })`, não `queueMicrotask`
  (no zoneless o render vem depois do microtask).
- `aria-label` não vale em `span`/`p`/`div` sem papel: número visível `aria-hidden` + texto
  `.visually-hidden`. O `read_page` não mostra nome de link com conteúdo composto (limitação).
- Spec com `jest.useFakeTimers()`: `fixture.whenStable()` trava (timers não andam); usar
  `await jest.runOnlyPendingTimersAsync()`.
- Componente que injeta `Router` precisa de `provideRouter(...)` no spec, com as rotas para onde
  ele navega (senão NG04002).
- A usuária às vezes usa o app no preview ao mesmo tempo: ler o estado antes de limpar
  `localStorage` ou mexer em filtros.

## Dev server

`.claude/launch.json` (local) define `gigmate` (`npx.cmd nx serve gigmate`, porta 4200).
Numa sessão aberta no `enterprise`, o preview lê o launch.json de lá: entrada `gigmate` com
`cmd.exe /c "cd /d ..\gigmate && npx nx serve gigmate --port 4300"`, porta 4300.
