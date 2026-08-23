const express = require('express')

const config = require('../constants').current

const app = express()

// Hands the browser the endpoint it should call, generated from the same constants the
// Node processes read.
//
// Without this, public/index.js had to hardcode http://localhost:9090, which quietly made
// the `production` block in constants.js a lie: APOLLO_URL and APOLLO_PORT could be set,
// the two Node processes would honour them, and the page would still call localhost on the
// visitor's own machine. A static script served to a browser cannot require() the repo, so
// something has to bridge the gap, and the server already serving that script is the
// obvious candidate.
//
// Content-Type matters: without it Express would send this as text/html and the browser
// would refuse to execute it.
app.get('/config.js', (_request, response) => {
  const payload = {
    apolloUrl: `${config.apollo.url}:${config.apollo.port}/`
  }

  response.type('application/javascript')
  response.send(`window.__APP_CONFIG__ = ${JSON.stringify(payload)};`)
})

app.use('/', express.static(__dirname + '/public'))

// HTTP_PORT only, already validated in constants.js, and already a number: the positional
// listen() form treats a string as a unix socket path. No `PORT` fallback, because it collided
// with the Apollo server when both processes read it.
const server = app.listen(config.http.port, () => {
  // Was `listener.address().address + listener.address().port`, concatenating an address
  // and a number with no separator, so it printed things like `::9091`. On a default bind
  // the address is `::`, which is not a URL anyone can click.
  const { port: boundPort } = server.address()
  console.log(
    `HTTP server running at http://localhost:${boundPort}`,
    'in', process.env.NODE_ENV || 'dev (NODE_ENV was not set)',
    `| serving /config.js pointing at ${config.apollo.url}:${config.apollo.port}/`
  )
})

server.on('error', (error) => {
  console.error('HTTP server failed to start:', error.message)
  process.exit(1)
})
