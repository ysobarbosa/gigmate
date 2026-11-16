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

## Progresso

- [x] Workspace Nx + app Angular com shell mínimo
- [x] Domínio: perfis, compatibilidade e perfis fictícios
- [ ] Camada de dados local com Signals
- [ ] Deck com swipe, filtros e ordem por compatibilidade
- [ ] Perfil e onboarding
- [ ] Matches
- [ ] PWA
- [ ] Extras: backend real, e2e, deploy
