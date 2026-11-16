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

## Progresso

- [x] Workspace Nx + app Angular com shell mínimo
- [ ] Domínio: perfis, compatibilidade e perfis fictícios
- [ ] Camada de dados local com Signals
- [ ] Deck com swipe, filtros e ordem por compatibilidade
- [ ] Perfil e onboarding
- [ ] Matches
- [ ] PWA
- [ ] Extras: backend real, e2e, deploy
