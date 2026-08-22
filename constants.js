// Ports and hosts for both processes, per environment.
//
// This used to hold a `dev` key and nothing else, while the start:* scripts set
// NODE_ENV=production, and server/index.js reached for `.dev` unconditionally. So
// `npm start` announced itself as production and then ran on the development
// configuration, which is the sort of thing that is fine until it is not.
//
// Every value can still be overridden by an environment variable, which is what you
// actually want in production rather than a committed block of settings.
// Ports from the environment are validated rather than coerced. `Number(x) || fallback` passes
// anything truthy, so -1, 99999 and 9090.7 all got through while 0 is falsy and silently became the
// default. What happens next depends on HOW the port reaches listen(), and the two processes here do
// it differently, which is worth knowing before assuming one fix covers both. Measured on node 24:
//
//                        listen(v)                 listen({ port: v })
//   value                (http-client/index.js)    (server/index.js, Apollo)
//   "9091"               tcp 9091                  tcp 9091
//   "abc"                UNIX SOCKET "abc"         RangeError
//   "-1"                 UNIX SOCKET "-1"          RangeError
//   "99999"              RangeError                RangeError
//   "9091.7"             RangeError                RangeError
//
// The positional form takes a string as a SOCKET PATH, so http-client with PORT=abc started
// cleanly, logged success and was unreachable over the network. Apollo's options-object form was
// already safe from that and threw, just without naming the variable at fault.
//
// `port < 1` with Number.isInteger in front, not `port <= 0`: 0.5 satisfies `> 0` while being
// unusable. Probed at both ends and just inside each: 0.999 rejected, 1 accepted, 65535 accepted,
// 65536 rejected. Only an UNSET variable is silent, since a variable set to an empty string is a
// configuration mistake rather than an absent setting.
const readPort = (name, value, fallback) => {
  if (value === undefined) return fallback

  const port = Number(value)

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new RangeError(
      `${name} must be an integer between 1 and 65535, received ${JSON.stringify(value)}`
    )
  }

  return port
}

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
    port: readPort('APOLLO_PORT', process.env.APOLLO_PORT, dev.apollo.port)
  },
  http: {
    url: process.env.HTTP_URL || 'http://localhost',
    port: readPort('HTTP_PORT', process.env.HTTP_PORT, dev.http.port)
  }
}

const environments = { dev, production }

// Resolve once, here, rather than each caller writing `.dev` and hoping. An unknown
// NODE_ENV falls back to dev rather than crashing, which is the friendlier default for
// something people clone to read.
const current = environments[process.env.NODE_ENV] || dev

module.exports = { ...environments, current, readPort }
