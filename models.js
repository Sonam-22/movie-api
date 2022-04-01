// Import statements.
const mongoose = require("mongoose");

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

const moviesCollection = mongoose.model("movies", movieSchema);
const usersCollection = mongoose.model("users", userSchema);

module.exports.Movies = moviesCollection;
module.exports.Users = usersCollection;
