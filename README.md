# Basic GraphQL

[![Greenkeeper badge](https://badges.greenkeeper.io/alpersonalwebsite/basic-graphql.svg)](https://greenkeeper.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-brightgreen.svg)](https://opensource.org/licenses/MIT)

This is an easy, basic and raw (no styles attached) example of **HOW to** implement `Apollo GraphQL`

## Installation
```
npm install
```
## Running the server

### Development
```
npm run dev
```

### Production
```
npm start
```

## Interacting with the `Playground` (dev) or querying.

Query:
```js
query {
  luckyNumber
}
```

Returns: 
```json
{
  "data": {
    "luckyNumber": "Your lucky number is 97"
  }
}
```

<!--
TODO:
  - Arreglar circleci... 
    npm run v1.13.0
    error Command "build" not found.
    Ver plantilla modelo Node
  - Agregar info client a README
  - Manejo de errores 
  - Ver scripts package.json
  - Package.json deberia estar dentro de server o como esta hora? 
    Chequear https://github.com/mirkonasato/graphql-examples
    Y como seria el deployment
-->