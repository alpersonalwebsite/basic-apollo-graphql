const express = require('express')

const { port } = require('../constants').current.http

const app = express()

app.use('/', express.static(__dirname + '/public'))

const server = app.listen(process.env.PORT || port, () => {
  // Was `listener.address().address + listener.address().port`, string-concatenating an
  // address and a number with no separator, so it logged things like `::9091`. And on a
  // default bind the address is `::`, which is not a URL anyone can click.
  const { port: boundPort } = server.address()
  console.log(
    `HTTP server running at http://localhost:${boundPort}`,
    'in', process.env.NODE_ENV || 'dev (NODE_ENV was not set)'
  )
})

server.on('error', (error) => {
  console.error('HTTP server failed to start:', error.message)
  process.exit(1)
})
