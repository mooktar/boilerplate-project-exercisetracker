const mongoose = require("mongoose");
const { body, query, validationResult } = require("express-validator")
const { User } = require("./Models");

// Register a new user
exports.post_new_user = function(req, res, next) {
    const username = req.body.username;

    User.findOne(
        { username: username },
        (err, user) => {
            if (err) next(err)
            if (user) next(new Error("Username already taken"))

            const newUser = new User({ username: username })
            newUser.save((err, savedUser) => {
                if (err) next(err)
                res.json({ _id: savedUser._id, username: savedUser.username })
            })
        })
};

// Return all users
exports.get_users = function(req, res, next) {
    User.find({})
        .select({ log: 0, __v: 0 })
        .exec((err, users) => {
            if (err) next(err)
            res.json(users)
        })
};

// Add exercices to an existing user
exports.post_new_exercise = function(req, res, next) {
    const { userId } = req.params
    const { description, duration } = req.body;
    const date = req.body.date || new Date().toISOString();

    User.findOneAndUpdate(
        { _id: userId },
        { $push: {
            log: {
                description: description,
                duration: duration,
                date: date
            }
        }},
        { new: true },
        (err, user) => {
            if (err) next(err)
            res.json({
                _id: user._id,
                username: user.username,
                description: user.log[user.log.length - 1].description,
                duration: user.log[user.log.length - 1].duration,
                date: user.log[user.log.length - 1].date,
            })
        }
    )
};

// Return a user`s exercise log
exports.get_logs = function(req, res, next) {
    const userId = req.params.userId.toString();
    const from = new Date(req.query.from || 0)
    const limit = parseInt(req.query.limit || 100)
    let to = req.query.to
    if (req.query.from) {
        to = new Date(to || '2999-12-31')
    }

    User.aggregate([
        { $match: { _id: mongoose.Types.ObjectId(userId) }},
        { $project: {
            _id: 1,
            username: 1,
            log: { 
                $slice: [
                    {
                        $filter: { 
                            input: "$log", 
                            as: "log", 
                            cond: { 
                                $and: [
                                    { $gte: [ "$$log.date", from ] },
                                    { $lte: [ "$$log.date", to ] }
                                ]
                            } 
                        }
                    }, 
                    limit
                ]
            }
        }}
        ])
        .exec((err, log) => {
            if (err) next(err.message)

            res.json(
                {
                    _id: log[count - 1]._id,
                    username: log[count - 1].username,
                    count: log[count - 1].log.length,
                    log: log[count - 1].log
                }
            );
        })
}

// Validating params sent via body or query
exports.validate = (method) => {

    switch(method) {
        case "post_new_user":
            return [
                body("username")
                    .exists({ checkFalsy: true }).withMessage("username is required")
                    .trim()
                    .isLength({ min: 3, max: 20 }).withMessage("username must have between 3 and 20 characters")
                    .isAlphanumeric().withMessage("username can only have alphanumeric characters")
            ];
        case "post_new_exercise":
            return [
                body("userId")
                    .exists({ checkFalsy: true }).withMessage("userId is required")
                    .trim()
                    .isLength({ min: 12, max: 24 }).withMessage('userId must have 12 or 24 characters')
                    .isAlphanumeric().withMessage("username can only have alphanumeric characters"),
                body("description")
                    .exists({ checkFalsy: true }).withMessage("description is required")
                    .trim()
                    .isLength({ min: 3, max: 50 }).withMessage('description must have between 3 and 50 characters')
                    .isAscii().withMessage('description must contain only valid ASCII characters'),
                body("duration")
                    .exists({ checkFalsy: true }).withMessage("duration is required")
                    .trim()
                    .isLength({ min: 1, max: 9999 }).withMessage('duration must have between 1 and 9999 characters')
                    .isNumeric().withMessage('duration must be a number'),
                body("date")
                    .optional({ checkFalsy: true })
                    .trim()    
                    .isISO8601()
                    .withMessage('invalid date format')
                    .isAfter(new Date(0).toJSON())
                    .isBefore(new Date('2999-12-31').toJSON())
                    .withMessage("invalid date format")
            ];
        case "get_logs":
            return [
                query("ulid")
                    .exists({ checkFalsy: true }).withMessage("userId is required")
                    .trim()
                    .isLength({ min: 12, max: 24 }).withMessage('userId must have 12 or 24 characters')
                    .isAlphanumeric().withMessage("username can only have alphanumeric characters"),
                query("from")
                    .optional()
                    .trim()    
                    .isISO8601()
                    .withMessage('invalid date format')
                    .isAfter(new Date(0).toJSON())
                    .isBefore(new Date('2999-12-31').toJSON())
                    .withMessage("invalid date format"),
                query("to")
                    .optional()
                    .trim()    
                    .isISO8601()
                    .withMessage('invalid date format')
                    .isAfter(new Date(0).toJSON())
                    .isBefore(new Date('2999-12-31').toJSON())
                    .withMessage("invalid date format"),
                query("limit")
                    .optional()
                    .trim()
                    .isNumeric({ no_symbols: true }).withMessage('limit must a number')
            ];
        default:
            return [];
    }

}
