const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const mongoose = require("mongoose")
const router = require('./Router')
require('dotenv').config()

// Connect to a mongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() =>
  console.log("Database successfully connected")
).catch(({ message }) => 
  console.log(`Error connection to DB "${message}"`)
)


const app = express()
app.use(cors())
app.use(express.static('public'))
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())


// Router
app.use('/', router)

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
