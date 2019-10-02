const express = require('express')
const axios = require('axios')
const bodyParser = require('body-parser')
const fetch = require('node-fetch')


const port = process.env.PORT || 3200
const clientID = process.env.CLIENT_ID
const clientSecret = process.env.CLIENT_SECRET
const apiDomain = process.env.WAVE_OAUTH2_URL
const scope = process.env.WAVE_SCOPE
const url = `${apiDomain}?client_id=${clientID}&response_type=code&scope=${scope}`

const app = express()
app.use(bodyParser.json())

app.get('/waveAuth', async (_, res) => {
  res.redirect(url)
})

// let businessIdentity
app.get('/wave_callback', (req, res) => {
  const { query: { code } } = req;
  const tokenURL = process.env.WAVE_ACCESS_TOKEN_URL
  const grantType = 'authorization_code'
  const callback = process.env.WAVE_CALLBACK_URL
  axios({
    method: 'post',
    url: `${tokenURL}?client_id=${clientID}&client_secret=${clientSecret}&code=${code}&grant_type=${grantType}&redirect_uri=${callback}`
  })
  .then(({ data }) => {
    // destructure the following: access_token, expires_in, token_type,
    // scope, refresh_token, userId, businessId
    // Most important ones are userId and businessId
    // The two above should be used to query data if only they are needed.
    const {
      businessId
    } = data

    businessIdentity = businessId
    res.redirect('/data')
  })
  .catch(error => {
    console.log('Error: ', error)
  })
})

app.get('/data', (_, res) => {
  const waveApiURL = process.env.WAVE_EXPOSED_URL
  const fullAccessToken = process.env.FULL_ACCESS_TOKEN
  fetch(waveApiURL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${fullAccessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `query {
          businesses {
            edges {
              node {
                id
                name
              }
            }
          }
        }`,
        variables: {}
      })
    })
    .then(r => r.json())
    .then(data => res.json(data))
    .catch(error => {
      console.log(error)
    })
})

app.get('/', (_, res) => {
  res.json({
    message: 'It works'
  })
})

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`)
})
