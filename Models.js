const mongoose = require("mongoose")

const { Schema } = mongoose

// Schemas
const userSchema = new Schema({
    // _id: mongoose.Types.ObjectId(),
    username: { type: String, required: true, unique: true },
})
const exerciseSchema = new Schema({
    userId: { type: String },
    description: { type: String, required: true },
    duration: { type: Number, required: true },
    date: { type: Date }
})

// Models
const User = mongoose.model("User", userSchema)
const Exercise = mongoose.model("Exercise", exerciseSchema)


// Exports Modules
exports.User = User
exports.Exercise = Exercise