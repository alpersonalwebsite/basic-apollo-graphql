// Ports and hosts for both processes, per environment.
//
// This used to hold a `dev` key and nothing else, while the start:* scripts set
// NODE_ENV=production, and server/index.js reached for `.dev` unconditionally. So
// `npm start` announced itself as production and then ran on the development
// configuration, which is the sort of thing that is fine until it is not.
//
// Every value can still be overridden by an environment variable, which is what you
// actually want in production rather than a committed block of settings.
const dev = {
  apollo: {
    url: 'http://localhost',
    port: 9090
  },
  http: {
    url: 'http://localhost',
    port: 9091
  }
}

// Same shape, so nothing downstream has to care which one it got. Deliberately no
// hardcoded hostnames here: a real deployment supplies them.
const production = {
  apollo: {
    url: process.env.APOLLO_URL || 'http://localhost',
    port: Number(process.env.APOLLO_PORT) || dev.apollo.port
  },
  http: {
    url: process.env.HTTP_URL || 'http://localhost',
    port: Number(process.env.HTTP_PORT) || dev.http.port
  }
}

const environments = { dev, production }

// Resolve once, here, rather than each caller writing `.dev` and hoping. An unknown
// NODE_ENV falls back to dev rather than crashing, which is the friendlier default for
// something people clone to read.
const current = environments[process.env.NODE_ENV] || dev

module.exports = { ...environments, current }
