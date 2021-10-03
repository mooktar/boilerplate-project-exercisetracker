const router = require("express").Router();
const Controller = require("./Controller");


// Home root
router.get("/", (req, res) => {
    res.sendFile(process.cwd() + "/views/index.html");
});

// Register a new user
router.post(
    "/api/users", 
    Controller.validate("post_new_user"),
    Controller.post_new_user);

// Get all users
router.get("/api/users", Controller.get_users);

// Add exercices to an existing user
router.post(
    "/api/users/:userId/exercises",
    Controller.validate("post_new_exercise"), 
    Controller.post_new_exercise);

// Return a user`s exercise log
router.get(
    "/api/users/:userId/logs", 
    Controller.validate("get_logs"),
    Controller.get_logs);

// Error handler
router.use((err, req, res, next) => {
    res.json({ "error": err.message });
});

module.exports = router;