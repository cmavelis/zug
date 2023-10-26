# zug

## Testing flags

- ?player=3 (or greater) to control both players, turn off rules
- ?empty=1 (anything truthy) to start with empty board

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development (using in-memory server)

```sh
npm run dev
```

### Develop using local server

```sh
npm run build && npm run server:dev
```

### Run Unit Tests with [Vitest](https://vitest.dev/)

```sh
npm run test:unit
```

### Run in prod

```sh
npm start
```

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```
