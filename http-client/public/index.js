// The server's origin, taken from /config.js, which http-client generates from the same
// constants.js the Node processes read. This used to be a hardcoded
// http://localhost:9090, which made the `production` block in constants.js a lie: set
// APOLLO_URL and the two Node processes honoured it while the page still called localhost
// on the visitor's own machine.
//
// A static script cannot require() the repo, so the server serving it does the bridging.
// The fallback is only for the case where /config.js failed to load, so the error message
// below can still name something.
const SERVER_URL =
  (window.__APP_CONFIG__ && window.__APP_CONFIG__.apolloUrl) || 'http://localhost:9090/'

const QUERY = `
  query {
    luckyNumber
  }
`

const render = (message) => {
  document.getElementById('root').textContent = message
}

const getLuckyNumber = async () => {
  const response = await fetch(SERVER_URL, {
    headers: {
      'content-type': 'application/json'
    },
    method: 'POST',
    body: JSON.stringify({ query: QUERY })
  })

  // A GraphQL server answers 200 for a resolver error and 400 for a malformed query, so
  // the status is worth checking before assuming there is a body worth reading.
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`)
  }

  const parsedResponse = await response.json()

  // THE thing to understand about GraphQL over HTTP: `errors` and `data` can both be
  // present, and a request that failed entirely still returns 200 with data: null. The
  // previous version went straight to `parsedResponse.data` and destructured it, so any
  // error response threw "Cannot destructure property 'luckyNumber' of undefined" and
  // the page sat on "I'm loading...!" for ever.
  if (parsedResponse.errors && parsedResponse.errors.length) {
    throw new Error(parsedResponse.errors.map((error) => error.message).join('; '))
  }

  if (!parsedResponse.data || parsedResponse.data.luckyNumber == null) {
    throw new Error('The response contained no luckyNumber')
  }

  return parsedResponse.data
}

getLuckyNumber()
  .then(({ luckyNumber }) => render(luckyNumber))
  // There was no catch at all, so with the server down you got an unhandled rejection in
  // the console and a page that never stopped claiming to be loading.
  .catch((error) => {
    render(`Could not reach the GraphQL server at ${SERVER_URL} - ${error.message}`)
  })
