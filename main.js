const express = require('express')
const app = express()
const morgan = require('morgan')
const webpush = require('web-push');

let PUBLIC_VAPID_KEY = process.env.PUBLICKEY

let PRIVATE_VAPID_KEY = process.env.PRIVATEKEY

webpush.setVapidDetails(
  'mailto:adriennetjohnson@gmail.com',
  PUBLIC_VAPID_KEY,
  PRIVATE_VAPID_KEY
)

app.use(morgan('dev'))

app.use(express.json())
app.use(express.urlencoded({extended: true}))
app.use(express.static('public'));

app.post("/subscribe", (req, res) => {
  // Get pushSubscription object
  const subscription = req.body;
  // Send 201 - resource created
  res.status(201).json({});
  // Create payload
  const payload = JSON.stringify({ title: "Slouch detected!" });
  // Pass object into sendNotification
  webpush
    .sendNotification(subscription, payload)
    .catch(err => console.error(err));
});

// Handle 404s
app.use((req, res, next) => {
  const err = new Error('Not Found')
  err.status = 404
  next(err)
})

// Error handling endware
app.use((err, req, res, next) => {
  res.status(err.status || 500)
  res.send(err.message || 'Internal server error')
})

app.listen(3333, () => {
  console.log('Listening over here!')
})
