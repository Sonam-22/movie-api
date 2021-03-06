/**
 * user registration object
 * @typedef {Object} CreateUserPayload
 * @property {string} userName - user name
 * @property {string} password - password
 * @property {string} email - email
 * @property {Date} birthday - birthday
 */

const express = require("express"),
  bodyParser = require("body-parser"),
  morgan = require("morgan"),
  uuid = require("uuid"),
  mongoose = require("mongoose"),
  Models = require("./models.js"),
  Mongo = require("mongodb"),
  passport = require("passport");

// For input validation
const { check, validationResult } = require("express-validator");
const { authProvider, ensureSameUser } = require("./auth");

require("./passport");

const Movies = Models.Movies;
const Users = Models.Users;

mongoose.connect(process.env.CONNECTION_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const app = express();

//morgan function "use"
app.use(morgan("common"));

// CORS integration
const cors = require("cors");
let allowedOrigins = [
  "https://myflix-client-react-redux.netlify.app",
  "https://sonam-22.github.io",
  "http://localhost:8080",
  "http://testsite.com",
  "http://localhost:1234",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        // origin is not included in list of allowedOrigins
        let message =
          "The CORS policy for this application doesn't allow access from origin " +
          origin;
        return callback(new Error(message), false);
      }
      return callback(null, true);
    },
  })
);

//static file given access via express static
app.use(express.static("public"));

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

app.use(bodyParser.json());

//integrating auth.js file for authentication and authorization using HTTP and JWSToken
let auth = authProvider(app);

/**
 * @description Creates or registers a user
 * @name POST /users
 * @function
 * @instance
 * @public
 * @param {CreateUserPayload} userObject
 * @returns The user object
 */
app.post(
  "/users",
  [
    check("userName", "Username is required (min 5 characters).").isLength({
      min: 5,
    }),
    check(
      "userName",
      "Username contains non alphanumeric characters - not allowed."
    ).isAlphanumeric(),
    check("password", "Password is required.").not().isEmpty(),
    check("email", "Email does not appear to be valid.").isEmail(),
  ],
  (req, res) => {
    // Check validation object for errors
    let errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    let hashedPassword = Users.hashPassword(req.body.password); // Create hashedPassword from given Password
    // Create new user
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
            password: hashedPassword,
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
  }
);

/**
 * @description Allow users to update their user info (find by username), expecting request body with updated info
 * @name PUT /users/:userName
 * @function
 * @public
 * @instance
 * @param {CreateUserPayload} userObject
 * @param {string} userName user name of the user
 * @returns The user object
 */
app.put(
  "/users/:userName",
  ensureSameUser,
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const updatedUser = {
      // Info from request body that can be updated
      userName: req.body.userName,
      email: req.body.email,
      birthday: req.body.birthday,
    };
    if (req.body.password) {
      updatedUser.password = Users.hashPassword(req.body.password);
    }
    Users.findOneAndUpdate(
      { userName: req.params.userName }, // Find user by existing username
      {
        $set: updatedUser,
      },
      { new: true }
    ) // Return the updated document
      .then((updatedUser) => {
        const noPassword = updatedUser;
        delete noPassword.password;
        res.json(noPassword); // Return json object of updatedUser
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Error: " + err);
      });
  }
);

/**
 * @description Add movie to favorite
 * @name POST /users/:userName/movies/:MovieID
 * @function
 * @public
 * @instance
 * @param {string} userName user name of the user
 * @param {string} MovieID Id of the favorite movie
 * @returns The user object
 */
app.post(
  "/users/:userName/movies/:MovieID",
  ensureSameUser,
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

/**
 * @description Allow users to remove a movie from their list of favorites
 * @name DELETE /users/:userName/movies/:MovieID
 * @function
 * @public
 * @instance
 * @param {string} userName user name of the user
 * @param {string} MovieID Id of the favorite movie
 * @returns updated user object
 */
app.delete(
  "/users/:userName/movies/:MovieID",
  ensureSameUser,
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

/**
 * @description Deregisters a user
 * @name DELETE /users/:userName
 * @function
 * @instance
 * @public
 * @param {string} userName user name of the user
 * @returns void
 */
app.delete(
  "/users/:userName",
  ensureSameUser,
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
app.get("/", (req, res) => {
  res.send("Welcome to my movie list!");
});

/**
 * @description Gets list of movies
 * @name GET /movies
 * @function
 * @public
 * @instance
 * @returns Array of movies
 */
app.get("/movies", (req, res) => {
  Movies.find()
    .then((movies) => {
      res.status(200).json(movies);
    })
    .catch((err) => {
      res.status(500).send("Error: " + err);
    });
});

/**
 * @description Gets list of movie by title
 * @name GET /movies/:title
 * @function
 * @instance
 * @public
 * @param {string} title title of the movie
 * @returns Movie object
 */
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

/**
 * @description Gets data about a genre (description) by name/title
 * @name GET /movies/genre/:name
 * @function
 * @instance
 * @public
 * @param {string} name name of the genre
 * @returns Genre object
 */
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

/**
 * @description Gets data about a director (bio, birth year, death year) by name
 * @name GET /movies/director/:name
 * @function
 * @instance
 * @public
 * @param {string} name name of the director
 * @returns Directors object
 */
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
const port = process.env.PORT || 8080;
app.listen(port, "0.0.0.0", () => {
  console.log("Listening on Port " + port);
});
