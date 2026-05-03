import express from "express";
import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config({ path: "./env" });

const app = express();
app.set("view engine", "ejs");
app.use(express.static("public"));

app.use(express.urlencoded({ extended: true }));

const pool = mysql.createPool({
  host: "r4919aobtbi97j46.cbetxkdyhwsb.us-east-1.rds.amazonaws.com",
  user: "jl3emjhbuxtut6er",
  password: "x12puhv1c57ihtef",
  database: "epszvsftpp9vtq40",
  connectionLimit: 10,
  waitForConnections: true,
});

app.get("/", (req, res) => {
  res.render("index.ejs");
});

app.get("/home", (req, res) => {
  res.render("home");
});

app.get("/search", (req, res) => {
  res.render("search");
});

app.get("/movie", async (req, res) => {
  try {
    let movieId = req.query.id || "tt12593682";
     const response = await fetch(`https://www.omdbapi.com/?i=${movieId}&apikey=${process.env.OMDB_API_KEY}`);
  const data = await response.json();
  console.log(data);

  res.render("movie.ejs", { movie: data, error: null });
  } catch (err) {
    res.render("movie.ejs", { movie: null, error: "Failed to fetch movie data." });
  }
});

app.get("/song", (req, res) => {
  res.render("song");
});

app.get("/playlist", (req, res) => {
  res.render("playlist");
});

app.listen(3001, () => {
  console.log("server started");
});
