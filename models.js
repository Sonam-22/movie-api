// Import statements.
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const movieSchema = mongoose.Schema({
  Title: { type: String, required: true },
  Description: { type: String, required: true },
  Genre: {
    Name: String,
    Description: String,
  },
  Director: {
    Name: String,
    Bio: String,
    Birth: String,
    Death: String,
  },
  ImagePath: String,
  Featured: Boolean,
});

const userSchema = mongoose.Schema({
  userName: { type: String, required: true },
  password: { type: String, required: true },
  email: { type: String, required: true },
  birthday: Date,
  favouriteMovies: [{ type: mongoose.Schema.Types.ObjectId, ref: "movies" }],
});

// Hashing of submitted passwords using bcrypt
userSchema.statics.hashPassword = (password) => {
  return bcrypt.hashSync(password, 10);
};

// Validating submitted passwords
userSchema.methods.validatePassword = function (password) {
  return bcrypt.compareSync(password, this.password);
};

const moviesCollection = mongoose.model("movies", movieSchema);
const usersCollection = mongoose.model("users", userSchema);

module.exports.Movies = moviesCollection;
module.exports.Users = usersCollection;
