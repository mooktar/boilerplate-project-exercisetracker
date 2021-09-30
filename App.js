const mongoose = require("mongoose");
const { User, Exercise } = require("./Models");


const RouteApp = function (app) {
  // Handle errors
  app.use((err, req, res, next) => {
    console.debug(req.params);
    if (err) res.json({ error: err.message });
    next();
  });

  // Home root
  app.get("/", (req, res) => {
    res.sendFile(process.cwd() + "/views/index.html");
  });

  // You can POST to /api/users with form data username 
  // to create a new user
  app.post("/api/users", (req, res, next) => {
    const username = req.body.username;
    User.findOne({ username: username }, (err, data) => {
      if (data) {
        res.json({ username: data.username, _id: data._id });
      } else {
        const newUser = new User({
          _id: mongoose.Types.ObjectId(),
          username: username
        });
        newUser.save((err, savedUser) => {
          if (err) res.json({ error: "Can't post this user!" });
          res.json({
            username: savedUser.username,
            _id: savedUser._id,
          });
        });
      }
    });
  });

  // The GET request to /api/users returns an array.
  app.get("/api/users", (req, res) => {
    User.find({}, (err, users) => {
      const userMap = users.map((user) => {
        return { username: user.username, _id: user._id };
      });
      res.json({ Users: userMap });
    });
  });

  // You can POST to /api/users/:_id/exercises with form data
  // description, duration, and optionally date.
  app.post("/api/users/:uid/exercises", (req, res, next) => {
    const { uid } = req.params;
    const { description, duration, date } = req.body;
    User.findById(uid, (err, user) => {
      if (err) next(new Error(`No user find with id '${uid}'`));

      Exercise.find({ description: description }, (err, data) => {
        if (err) next(new Error(`Exercise with description has find`));
        if (data) {
          const new_exercise = new Exercise({
            userId: uid,
            description: description,
            duration: duration,
            date: new Date(date || '').toDateString(),
          });
          new_exercise.save((err, newExercise) => {
            if (err) next(new Error("Can't save exercise"));
            res.json({
              username: user.username,
              description: newExercise.description,
              duration: newExercise.duration,
              date: newExercise.date,
              _id: user._id,
            });
          });
        } else {
          next(new Error("This exercise exists"))
        }
      });
    })
  });


  // You can make a GET request to /api/users/:_id/logs 
  // to retrieve a full exercise log of any user.
  app.get('/api/users/:_id/logs', (req, res, next) => {
    const uid = req.params._id
    const { from, to, limit } = req.query
    
    User.findById(uid, (err, user) => {
      if (err) new Error("No user find")
      
      Exercise.find({ 
          userId: user._id, 
          date: { $gte: new Date(from), $lt: new Date(to) } 
        })
        .select('description duration date')
        .limit(Number(limit))
        .exec((err, logs) => {
          if (err) next(new Error("No exercise find"))

          res.json({
            username: user.username,
            count: logs.length,
            _id: user._id,
            log: logs
          })
        })
    })

  })
};

module.exports = RouteApp;
