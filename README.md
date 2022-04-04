# API for movies web application

## Description

The web application will provide users with access to information about different movies, directors, and genres. Users will be able to sign up, update their personal information, and create a list of their favorite movies.

## Tech Stack

- Node JS
- Html
- Passport
- Mongoose
- MongoDb
- Bootstrap

## How to use this repo

- Clone this repository first and open it in favourite editor.
- Install the depedencies. Execute `$ npm install`.
- To start the live reload development server, run `$ npm run dev`
- Access the app on `http://localhost:8080`
- Documentation of API,s are available at `http://localhost:8080/documentation`

## Vital Features of this APP ( API ENDPOINTS )

- Return a list of ALL movies to the user
- Return data (description, genre, director, image URL, whether it’s featured or not) about a single movie by title to the user
- Return data about a genre (description) by name/title (e.g., “Thriller”)
- Return data about a director (bio, birth year, death year) by name
- Allow new users to register
- Allow users to update their user info (username, password, email, date of birth)
- Allow users to add a movie to their list of favorites
- Allow users to remove a movie from their list of favorites
- Allow existing users to deregister

## Authentication and Authorization

When the user logs in, the backend creates a signed token and returns it in response. That will be the authorization token (Bearer Token) that will be used in every request to interact with the API.
