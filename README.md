# Gigmate

Um "Tinder" para músicos: encontre gente da sua região para tocar junto, com filtros pelo que
importa numa banda: instrumento, gêneros que a pessoa toca e que gosta, disponibilidade,
objetivo (autoral, cover, freela, jam) e distância. Interesse dos dois lados vira match.

> Projeto de estudo e portfólio. Os perfis são fictícios, gerados para mostrar a usabilidade.

## Stack

- [Nx](https://nx.dev) 24 (monorepo, fronteiras entre libs por tags)
- Angular 22: standalone components, zoneless, Signals e RxJS
- Jest (unitários) e Cypress (e2e)

## Como rodar

```sh
npm install
npx nx serve gigmate
```

Abra http://localhost:4200.

```sh
npx nx run-many -t build,test,lint
```

## Decisões-chave

- **Dados atrás de interfaces.** As telas falam com repositórios abstratos. A primeira
  implementação é local (perfis fictícios + `localStorage`), então o projeto roda sem backend
  nem conta em serviço externo. Um backend real pode entrar depois sem mudar a UI.
- **Localização sempre aproximada.** O app mostra "~5 km", nunca a posição exata.
- **PWA depois.** Primeiro as telas principais; instalação e offline vêm em seguida.
- **Domínio em TypeScript puro.** Tipos, compatibilidade e gerador de perfis ficam em
  `libs/musicians/domain`, sem Angular nem RxJS. O lint proíbe esses imports ali, então a
  regra de negócio é testada sem framework e pode ser reaproveitada em qualquer camada.
- **Compatibilidade simétrica e explicável.** A nota de 0 a 100 soma quatro componentes com
  pesos fixos: gêneros (35%, o que a pessoa toca vale mais do que o que ela ouve),
  disponibilidade (30%), objetivos (20%) e distância (15%). Disponibilidade e objetivos usam
  o coeficiente de sobreposição, e não Jaccard, para não punir quem tem mais horários livres.
  Instrumento procurado e raio são filtros, não entram na nota.
- **Perfis fictícios reproduzíveis.** Gerados em código com um PRNG de semente fixa
  (mulberry32): mesma semente, mesmas pessoas em todo teste e toda demo. Os perfis seguem
  "cenas" de gêneros e rotinas de horário realistas, para a compatibilidade ter o que encontrar.
  Um perfil fictício curte de volta quando a nota passa de 35 e ele procura o seu instrumento.
- **Portas e adaptadores.** `libs/musicians/data-access` define as portas
  (`ProfilesRepository`, `SwipesRepository`) como classes abstratas, que servem de tipo e de
  token de injeção. O adaptador local entra no app por uma linha no `app.config.ts`
  (`provideLocalMusiciansData()`); sem ela, o app falha na injeção em vez de cair num padrão
  escondido. O match dos perfis fictícios é decidido no adaptador, onde um servidor decidiria.
- **Deck com Signals e swipe otimista.** O `DeckStore` guarda o estado num único `signal` e
  expõe só `computed`. A carta sai do deck na hora do swipe e volta, com aviso, se salvar falhar.
  Os salvamentos vão em fila (`concatMap`), na ordem dos swipes. Uma latência artificial de
  300 ms deixa os estados de carregamento visíveis na demo.
- **Camadas com fronteiras no lint.** `domain` (TS puro) ← `data-access` (portas, adaptadores,
  stores) ← `ui` (componentes de apresentação, só inputs e outputs) ← `feature-deck` (página que
  liga store e UI) ← app. O ESLint do Nx bloqueia imports na direção errada.
- **Swipe sem biblioteca.** Uma diretiva com pointer events (mouse, toque e caneta) move o card
  com `transform` ligado a signals. Botões e setas do teclado chamam o mesmo `fling()`, então
  todas as formas de decidir têm a mesma animação. Respeita `prefers-reduced-motion`.
- **Filtros são requisitos; a nota ordena.** Instrumento (principal ou secundário), gêneros,
  objetivos, horário em comum e raio decidem quem entra no deck. O padrão vem do perfil
  ("procuro bateria", até 10 km). Os filtros valem na hora e ficam salvos no aparelho.
- **Acessível por teclado e leitor de tela.** Setas ← → no deck, Esc fecha painéis, foco vai para
  o diálogo aberto, chips com `aria-pressed`, card de trás escondido com `inert`.
- **Onboarding com Signal Forms.** O perfil é um assistente de 5 passos com um único formulário
  do `@angular/forms/signals` (API pública no Angular 22): validação declarada num schema,
  regra entre campos ("segundo instrumento diferente do principal") e cada passo só avança com
  os próprios campos válidos. Rótulos curtos, dicas e erros ligados por `aria-describedby`,
  foco no primeiro campo a corrigir. A última tela mostra o card como os outros vão ver.
- **Bairro em vez de GPS.** No cadastro a pessoa escolhe o bairro; o app guarda o centro dele
  arredondado. Não pede permissão de localização e nunca sabe onde a pessoa mora.
- **Primeira visita.** Sem perfil, o app abre as boas-vindas: criar um perfil ou explorar na
  hora com um perfil de exemplo. Guards de rota decidem para onde cada um vai.
- **Contato só depois do match.** Cada perfil pode mostrar WhatsApp, Instagram ou e-mail
  (validados e normalizados no domínio), e só quem deu match vê. A regra vive no domínio
  (`visibleContact`), e a porta documenta que um backend real nem deve enviar o contato antes.
- **Amostras seguras.** Até 3 links `https` de YouTube, Spotify, SoundCloud, Instagram ou
  Bandcamp. A lista fechada de hosts barra `javascript:` e domínios parecidos, e a tela revalida
  cada link antes de exibir. Perfis fictícios não têm contato nem amostras de verdade, para não
  apontar para pessoas ou vídeos reais; a tela explica isso.

## Progresso

- [x] Workspace Nx + app Angular com shell mínimo
- [x] Domínio: perfis, compatibilidade e perfis fictícios
- [x] Camada de dados local com Signals
- [x] Deck com swipe, filtros e ordem por compatibilidade
- [x] Perfil e onboarding
- [x] Matches: lista, detalhe com contato e amostras
- [ ] PWA
- [ ] Extras: backend real, e2e, deploy
