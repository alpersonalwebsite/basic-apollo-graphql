// The server's origin. Hardcoded on purpose: this file is served to the browser as a
// plain script, so it cannot require('../../constants') the way the Node processes do.
// If you change the Apollo port in constants.js, change it here too.
const SERVER_URL = 'http://localhost:9090/'

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
