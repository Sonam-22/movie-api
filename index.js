const express = require("express"),
  bodyParser = require("body-parser"),
  morgan = require("morgan"),
  uuid = require("uuid");

const app = express();

let users = [
  {
    id: "1",
    userName: "sam",
    email: "sam14@gmail.com",
    birthday: "19/10/1997",
    favorites: ["The Intern", "Andhadhu", "Chennai Express"],
  },
  {
    id: "2",
    userName: "mini",
    email: "mini14@gmail.com",
    birthday: "15/11/1998",
    favorites: ["Chennai Expres"],
  },
];

//list of favorite movies
let topMovies = [
  {
    title: "The Intern",
    year: "2015",
    genre: {
      name: "Drama",
      description:
        "The drama genre features stories with high stakes and a lot of conflicts. They’re plot-driven and demand that every character and scene move the story forward. Dramas follow a clearly defined narrative plot structure, portraying real-life scenarios or extreme situations with emotionally-driven characters.",
    },

    director: {
      name: "Nancy Meyers",
      bio: "Nancy Meyers was born in Philadelphia.She is American writer, director, and producer who was best known for her romantic comedies, several of which centre on middle-aged women.",
      birth: "1949",
      death: "-",
    },
    imgURL: "-",
    featured: false,
  },
  {
    title: "Andhadhun",
    director: "Sriram Raghavan",
  },
  {
    title: "Mimi",
    director: "Laxman Utekar",
  },
  {
    title: "Chennai Express",
    director: "Rohit Shetty",
  },
  {
    title: "Singham",
    director: "Rohit Shetty",
  },
  {
    title: "Drishyam",
    director: "Nishikant Kamat",
  },
  {
    title: "Raid",
    director: "Raj Kumar Gupta",
  },
  {
    title: "Jolly LLB",
    director: "Subhash Kapoor",
  },
  {
    title: "Pyaar Ka Punchnama",
    director: "Luv Ranjan",
  },
  {
    title: "Queen",
    director: "Vikas Bahl",
  },
];
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

//POST route to add new User
app.post("/users", (req, res) => {
  const newUser = req.body;

  if (newUser.userName) {
    newUser.id = uuid.v4();
    users.push(newUser);
    res.status(201).json(newUser);
  } else {
    res.status(400).send("users need names");
  }
});

//PUT route to update User
app.put("/users/:id", (req, res) => {
  const { id } = req.params;
  const updatedUser = req.body;

  let user = users.find((user) => user.id == id);

  if (user) {
    user.userName = updatedUser.userName;
    res.status(200).json(user);
  } else {
    res.status(400).send("no such user");
  }
});

//POST route to add movie to favorite
app.post("/users/:id/:title", (req, res) => {
  const { id, title } = req.params;
  const updatedUser = req.body;

  let user = users.find((user) => user.id == id);

  if (user) {
    user.favorites.push(title);
    res.status(200).send(`${title} has been added to the user ${id}´s array`);
  } else {
    res.status(400).send("no such user");
  }
});
//DELETE route to delete favorite movie from list
app.delete("/users/:id/:title", (req, res) => {
  const { id, title } = req.params;
  const updatedUser = req.body;

  let user = users.find((user) => user.id == id);

  if (user) {
    user.favorites = user.favorites.filter((title) => title !== title);
    res.status(200).send(`${title} has been deleted to the user ${id}´s array`);
  } else {
    res.status(400).send("no such user");
  }
});

//DELETE route to delete user
app.delete("/users/:id", (req, res) => {
  const { id } = req.params;

  let user = users.find((user) => user.id == id);

  if (user) {
    users = users.filter((user) => user.id != id);
    res.status(200).send(`user ${id} has been deleted`);
  } else {
    res.status(400).send("no such user");
  }
});

app.get("/", (req, res) => {
  res.send("Welcome to my movie list!");
});

//GET route located at the endpoint "/movies" which returns a json object in form of a  list of top 10 movies with the status 200 "ok"
app.get("/movies", (req, res) => {
  res.status(200).json(topMovies);
});

//GET route located at the endpoint "/movies/title" which returns a json object with a single movie
app.get("/movies/:title", (req, res) => {
  const { title } = req.params;
  const movie = topMovies.find((movie) => movie.title === title);

  if (movie) {
    res.status(200).json(movie);
  } else {
    res.status(404).send("no such movie");
  }
});

//GET route located at the endpoint "/movies/title" which returns a json object with a single movie
app.get("/movies/genre/:name", (req, res) => {
  const { genreName } = req.params;
  const genre = topMovies.find((movie) => movie.genre.name === genreName).genre;

  if (genre) {
    res.status(200).json(genre);
  } else {
    res.status(404).send("no such genre");
  }
});

//GET route located at the endpoint "/movies/title" which returns a json object with a single movie
app.get("/movies/director/:name", (req, res) => {
  const { directorName } = req.params;
  const director = topMovies.find(
    (movie) => movie.director.name === directorName
  ).director;
  if (director) {
    res.status(200).json(director);
  } else {
    res.status(404).send("no such director");
  }
});

// error-handling middleware function

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

// listen for requests
app.listen(8080, () => {
  console.log("Your app is listening on port 8080.");
});
