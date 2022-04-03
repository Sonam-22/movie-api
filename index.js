const express = require("express"),
  bodyParser = require("body-parser"),
  morgan = require("morgan"),
  uuid = require("uuid"),
  mongoose = require("mongoose"),
  Models = require("./models.js"),
  Mongo = require("mongodb"),
  passport = require("passport");

require("./passport");

const Movies = Models.Movies;
const Users = Models.Users;

mongoose.connect("mongodb://localhost:27017/myFlixDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const app = express();

//morgan function "use"
app.use(morgan("common"));

//static file given access via express static
app.use(express.static("public"));

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

app.use(bodyParser.json());

let auth = require("./auth")(app);

//POST route to add new User
app.post("/users", (req, res) => {
  Users.findOne({ userName: req.body.userName })
    .then((existingUser) => {
      if (existingUser) {
        // If the same username already exists, throw an error
        return res
          .status(400)
          .send(
            "User with the Username " + req.body.userName + " already exists!"
          );
      } else {
        // If the username is unique, create a new user with the given parameters from the request body
        Users.create({
          userName: req.body.userName,
          password: req.body.password,
          email: req.body.email,
          birthday: req.body.birthday,
          favouriteMovies: (req.body.favouriteMovies || []).map(
            (m) => new Mongo.ObjectId(m)
          ),
        })
          .then((createdUser) => {
            res.status(201).json(createdUser);
          })
          .catch((err) => {
            console.error(err);
            res.status(500).send("Error: " + err);
          });
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send("Error: " + err);
    });
});

// UPDATE: Allow users to update their user info (find by username), expecting request body with updated info
app.put(
  "/users/:userName",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Users.findOneAndUpdate(
      { userName: req.params.userName }, // Find user by existing username
      {
        $set: {
          // Info from request body that can be updated
          userName: req.body.userName,
          password: req.body.password,
          email: req.body.email,
          birthday: req.body.birthday,
        },
      },
      { new: true }
    ) // Return the updated document
      .then((updatedUser) => {
        res.json(updatedUser); // Return json object of updatedUser
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Error: " + err);
      });
  }
);

//POST route to add movie to favorite
app.post(
  "/users/:userName/movies/:MovieID",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const movieId = new Mongo.ObjectId(req.params.MovieID);
    const userName = req.params.userName;

    Users.findOneAndUpdate(
      {
        userName: userName,
        favouriteMovies: { $nin: [movieId] },
      }, // Find user by username
      { $push: { favouriteMovies: movieId } }, // Add movie to the list
      { new: true }
    ) // Return the updated document
      .then((updatedUser) => {
        if (!updatedUser) {
          return res
            .status(409)
            .send(`Favourite movie ${movieId} already exists for ${userName}`);
        }
        res.status(200).json(updatedUser);
        // Return json object of updatedUser
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Error: " + err);
      });
  }
);
//DELETE : Allow users to remove a movie from their list of favorites
app.delete(
  "/users/:userName/movies/:MovieID",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Users.findOneAndUpdate(
      { userName: req.params.userName }, // Find user by username
      { $pull: { favouriteMovies: new Mongo.ObjectId(req.params.MovieID) } }, // Remove movie from the list
      { new: true }
    ) // Return the updated document
      .then((updatedUser) => {
        res.json(updatedUser); // Return json object of updatedUser
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Error: " + err);
      });
  }
);

//Allow existing users to deregister
app.delete(
  "/users/:userName",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Users.findOneAndRemove({ userName: req.params.userName }) // Find user by username
      .then((users) => {
        if (users) {
          // If user was found, return success message, else return error
          res
            .status(200)
            .send(
              `User with the Username ${req.params.userName} was sucessfully deleted.`
            );
        } else {
          res
            .status(400)
            .send(
              `User with the Username ${req.params.userName} was not found.`
            );
        }
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Error: " + err);
      });
  }
);
// Read
app.get("/", passport.authenticate("jwt", { session: false }), (req, res) => {
  res.send("Welcome to my movie list!");
});

// Get all movies
app.get(
  "/movies",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Movies.find()
      .then((movies) => {
        res.status(200).json(movies);
      })
      .catch((err) => {
        res.status(500).send("Error: " + err);
      });
  }
);

//Get a movie by title
app.get(
  "/movies/:title",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Movies.findOne({ Title: req.params.title }) // Find the movie by title
      .then((movies) => {
        if (movies) {
          // If movie was found, return json, else throw error
          res.status(200).json(movies);
        } else {
          res.status(400).send("Movie not found");
        }
      })
      .catch((err) => {
        res.status(500).send("Error: " + err);
      });
  }
);

//GET data about a genre (description) by name/title

app.get(
  "/movies/genre/:name",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Movies.findOne({ "Genre.Name": req.params.name }) // Find one movie with the genre by genre name
      .then((movies) => {
        if (movies) {
          // If a movie with the genre was found, return json of genre info, else throw error
          res.status(200).json(movies.Genre);
        } else {
          res.status(400).send("Genre not found");
        }
      })
      .catch((err) => {
        res.status(500).send("Error: " + err);
      });
  }
);

//GET data about a director (bio, birth year, death year) by name

app.get(
  "/movies/director/:name",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Movies.findOne({ "Director.Name": req.params.name }) // Find one movie with the director by name
      .then((movies) => {
        if (movies) {
          // If a movie with the director was found, return json of director info, else throw error
          res.status(200).json(movies.Director);
        } else {
          res.status(400).send("Director not found");
        }
      })
      .catch((err) => {
        res.status(500).send("Error: " + err);
      });
  }
);

// error-handling middleware function

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

// listen for requests
app.listen(8080, () => {
  console.log("Your app is listening on port 8080.");
});
