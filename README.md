# Basic Apollo GraphQL: server and browser client

[![Greenkeeper badge](https://badges.greenkeeper.io/alpersonalwebsite/basic-apollo-graphql.svg)](https://greenkeeper.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-brightgreen.svg)](https://opensource.org/licenses/MIT)

An easy, basic and raw (no styles attached) example of **HOW to** stand up an
`Apollo GraphQL` server and query it from a browser, with **no GraphQL client library
at all** on the client side. Just `fetch`.

That last part is the point. A GraphQL request over HTTP is a `POST` with a JSON body
containing a `query` string. Nothing more is required, and seeing it written out once
makes it much clearer what Apollo Client, `vue-apollo` and friends are actually doing
for you.

## Two processes

| Directory | What it is | Port |
| --- | --- | --- |
| `server/` | the Apollo server, one `luckyNumber` query | 9090 |
| `http-client/` | an Express server that serves one static HTML page | 9091 |

They are separate ports, which means separate **origins**, which is why CORS is
involved in a demo this small. `server/index.js` allows exactly the client's origin
and nothing else.

`constants.js` holds both ports for both environments, and everything in the
`production` block can be overridden by an environment variable.

## Installation

```shell
npm ci
```

That is genuinely all of it now. The dependencies live in `server/package.json` and
`http-client/package.json`, and a `postinstall` script installs both. It used to
install only the root, so following this README produced:

```text
Error: Cannot find module 'apollo-server'
```

npm workspaces would be the modern way to express this; they arrived in npm 7 and this
project is pinned to the 2019 era, so a `postinstall` is the period-appropriate shape.

`npm ci` rather than `npm install`, and the `postinstall` uses `npm ci` in the two
subdirectories for the same reason: all three lockfiles are deliberately at
`lockfileVersion` **1**, because npm 6 (the npm that ships with the Node this project
targets) cannot read version 3 at all. It fails with
`Cannot read properties of undefined`. `npm install` **upgrades** a v1 lockfile in place,
so using it in the postinstall silently rewrote the two subdirectory lockfiles to v3 on
any modern machine, which is how that regression got shipped in the first place.

If you run `npm install` at the root anyway, npm will upgrade the root lockfile: that is
standard npm behaviour for any v1 lockfile and not something this repo can prevent. Do
not commit that change.

## Running

```shell
npm run dev      # both processes, NODE_ENV=dev
npm start        # both processes, NODE_ENV=production
```

Then open <http://localhost:9091>. The page fetches the lucky number and renders it.

In dev you also get the **Playground** at <http://localhost:9090>:

```graphql
query {
  luckyNumber
}
```

```json
{
  "data": {
    "luckyNumber": "Your lucky number is 97"
  }
}
```

Playground, introspection and error stack traces are all switched off when `NODE_ENV`
is `production`, and they move together on purpose. `apollo-server` disables
introspection in production by itself but leaves stack traces on unless told otherwise,
and `node server/` with no `NODE_ENV` set counts as "not production": before this was
made explicit, an error response carried absolute filesystem paths to whoever asked.

## What the client has to get right

Three things, and the first version of this repo got all three wrong:

**`errors` and `data` can both be present.** A GraphQL response is not
success-or-failure. A resolver that throws gives you HTTP **200** with
`{"errors": [...], "data": {"luckyNumber": null}}`, so checking the status code is not
enough.

**A failed request still parses.** Going straight to `parsedResponse.data.luckyNumber`
threw `Cannot destructure property 'luckyNumber' of undefined` on any error response,
which is a confusing way to learn that the server said something useful.

**Something has to catch.** With no `.catch`, a stopped server left the page reading
"I'm loading...!" indefinitely with an unhandled rejection as the only clue. It now
says what it could not reach.

## Next step

[apollo-graphql-full](https://github.com/alpersonalwebsite/apollo-graphql-full) is the
same idea with a real schema: users, plus add and delete mutations.
[basic-apollo-graphql-mongodb](https://github.com/alpersonalwebsite/basic-apollo-graphql-mongodb)
backs that schema with MongoDB, and
[basic-apollo-graphql-vue](https://github.com/alpersonalwebsite/basic-apollo-graphql-vue)
replaces this hand-written `fetch` with `vue-apollo`, which is the clearest way to see
what a client library adds.
