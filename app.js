const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "moviesData.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(5000, () => {
      console.log("Server Running at http://localhost:5000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

// first api

app.get("/movies/", async (request, response) => {
  const getMovieNameQuery = `
    SELECT
      movie_name
    FROM
      movie;`;

  const moviesNameArray = await db.all(getMovieNameQuery);
  response.send(
    moviesNameArray.map((eachMovie) => ({ movieName: eachMovie.movie_name }))
  );
});

//2nd api
app.post("/movies/", async (request, response) => {
  const { directorId, movieName, leadActor } = request.body;
  const postMovieQuery = `
    INSERT INTO
      movie (director_id, movie_name, lead_actor)
    VALUES
      (${directorId}, '${movieName}', '${leadActor}');`;

  const dbResponse = await db.run(postMovieQuery);
  const movieId = dbResponse.lastID;

  response.send("Movie Successfully Added");
});

// 3rd api
app.get("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;

  try {
    const getMovieQuery = `
      SELECT 
        *
      FROM 
        movie 
      WHERE 
        movie_id = ${movieId};`;

    const movie = await db.get(getMovieQuery);

    if (!movie) {
      // If no movie is found for the given movieId, send a 404 response
      return response.status(404).json({ error: "Movie not found" });
    }

    // Convert the movie database object to a response object
    const movieResponse = {
      movieId: movie.movie_id,
      directorId: movie.director_id,
      movieName: movie.movie_name,
      leadActor: movie.lead_actor,
    };

    // Send the response with the movie details
    response.json(movieResponse);
  } catch (error) {
    // Handle any errors that may occur during the database operation
    console.error("Error fetching movie:", error);
    response.status(500).json({ error: "Internal Server Error" });
  }
});

//fourth api

app.put("/movies/:movieId/", async (request, response) => {
  const { directorId, movieName, leadActor } = request.body;
  const { movieId } = request.params;
  const updateMovieQuery = `
  UPDATE
    movie
    SET
  director_id = ${directorId},
  movie_name = '${movieName}',
  lead_actor = '${leadActor}'
            WHERE
              movie_id = ${movieId};`;

  await db.run(updateMovieQuery);
  response.send("Movie Details Updated");
});
//fifth api
app.delete("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const deleteMovieQuery = `
  DELETE FROM
    movie
  WHERE
    movie_id = ${movieId};`;
  await db.run(deleteMovieQuery);
  response.send("Movie Removed");
});
//api 6
app.get("/directors/", async (request, response) => {
  const getDirectorsQuery = `
    SELECT
      *
    FROM
      director;`;
  const directorsArray = await db.all(getDirectorsQuery);
  const convertDirectorDbObjectToResponseObject = (dbObject) => {
    return {
      directorId: dbObject.director_id,
      directorName: dbObject.director_name,
    };
  };
  response.send(
    directorsArray.map((eachDirector) =>
      convertDirectorDbObjectToResponseObject(eachDirector)
    )
  );
});
app.get("/directors/:directorId/movies/", async (request, response) => {
  const { directorId } = request.params;
  const getDirectorMoviesQuery = `
    SELECT
      movie_name
    FROM
      movie
    WHERE
      director_id='${directorId}';`;
  const moviesArray = await db.all(getDirectorMoviesQuery);
  response.send(
    moviesArray.map((eachMovie) => ({ movieName: eachMovie.movie_name }))
  );
});

module.exports = app;
