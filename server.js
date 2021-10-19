const express = require('express')
const cors = require('cors')
const mongoose = require("mongoose")
const { User, Exercise } = require('./models');

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

// Init express app
const app = express()

// Basic configurations
app.use(cors())
app.use(express.static('public'))
app.use(express.json());
app.use(express.urlencoded({ extended: false }));


// Home route
app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});


// Add new user
app.post('/api/users', (req, res) => {
  const { username } = req.body
  if (!username) {
    res.json({ error: 'No username submitted' });
  } else {
    const newUser = new User({ username: username });
    newUser
      .save()
      .then(user => res.json(user))
      .catch(err => res.send(err.message));
  }
});


// Get all users
app.get('/api/users', (req, res) => {
  User.find()
    .select('_id username')
    .then(users => res.json(users))
    .catch(err => res.send(err.message));
});


// Add new exercise
app.post('/api/users/:userId/exercises', (req, res) => {
  const userId = req.params.userId
  const { description, duration, date } = req.body
  if (!userId || !description || !duration) {
    res.send('Invalid data submitted');
  }
  
  // find user
  User.findById({ _id: userId }, (err, user) => {
    if (err) res.send('Error while searching for user id');
    if (!user) res.send('User not found');

    const newExercise = new Exercise({
      userId: userId,
      description: description,
      duration: +duration,
      date: date ? new Date(date).toDateString() : new Date().toDateString()
    });
    newExercise
      .save()
      .then(exercise => 
        res.json({
          _id: user._id,
          username: user.username,
          date: exercise.date,
          duration: exercise.duration,
          description: exercise.description,
        })
      )
      .catch(err => res.send(err.message));
  });
});

// Get users's log
app.get('/api/users/:userId/logs', (req, res) => {
  const userId = req.params.userId
  if (!userId) res.send('You must provide an user id')

  // find user name
  User.findOne({ _id: userId }, (err, user) => {
    if (err) res.json({ error: err.message });
    if (!user) res.json({ error: 'Could not find user' });

    const date = {}
    let { from, to } = req.query;
    if (from) {
      from = new Date(from);
      if (from == 'Invalid Date') {
        res.send('from field must be yyyy-mm-dd');
      } else {
        date.$gte = from.toDateString()
      }
    }
    if (to) {
      to = new Date(to);
      if (to == 'Invalid Date') {
        res.send('to field must be yyyy-mm-dd');
      } else {
        date.$lte = to.toDateString()
      }
    }
    const limit = +req.query.limit || 100;
    
    // find exercise log
    Exercise.find({userId}, {date})
      .select('description duration date')
      .limit(limit)
      .sort('-date')
      .exec((err, log) => {
        if (err) res.json({ message: "Could not find user's exercise log" });
        if (log)
          res.json({ 
            _id: user._id,
            username: user.username,
            count: log.length,
            log: log.map(el => ({
              description: el.description,
              duration: el.duration,
              date: el.date,
            }))
          });
      });
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
