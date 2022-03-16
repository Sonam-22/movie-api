const express = require("express"), //express framework
  morgan = require("morgan"), //morgan framework
  app = express(), //express framework beeing used
  bodyParser = require("body-parser");

//list of favorite movies
let topMovies = [
  {
    title: "The Intern",
    director: "Nancy Meyers",
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

app.get("/", (req, res) => {
  res.send("Welcome to my movie list!");
});

//topMovies array served
app.get("/movies", (req, res) => {
  res.json(topMovies);
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
