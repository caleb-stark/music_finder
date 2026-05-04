import express from "express";
import mysql from "mysql2/promise";
import bcrypt from "bcrypt";
import session from "express-session";
import "dotenv/config";
const SpotifyWebApi = (await import("spotify-web-api-node")).default;

const app = express();
app.set("view engine", "ejs");
app.use(express.static("public"));

app.use(express.urlencoded({ extended: true }));

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_PWD,
  redirectUrl: process.env.REDIRECT_URL,
});

async function getAccessToken() {
  try {
    const data = await spotifyApi.clientCredentialsGrant();
    const accessToken = data.body["access_token"];

    spotifyApi.setAccessToken(accessToken);
    console.log(
      "Access token set, expires in",
      data.body["expires_in"],
      "seconds"
    );

    // Auto-refresh before it expires (every 55 minutes)
    setTimeout(getAccessToken, (data.body["expires_in"] - 300) * 1000);
  } catch (err) {
    console.error("Failed to get access token:", err);
  }
}

getAccessToken();

const pool = mysql.createPool({
  host: "r4919aobtbi97j46.cbetxkdyhwsb.us-east-1.rds.amazonaws.com",
  user: process.env.DB_USER,
  password: process.env.DB_PWD,
  database: "epszvsftpp9vtq40",
  connectionLimit: 10,
  waitForConnections: true,
});

app.set("trust proxy", 1);
app.use(
  session({
    secret: "keyboard cat",
    resave: false,
    saveUninitialized: true,
  })
);

function isAuthenticated(req, res, next) {
  if (req.session.authenticated) {
    next();
  } else {
    res.redirect("/");
  }
}

app.get("/", (req, res) => {
  res.render("login");
});

app.post("/login", async (req, res) => {
  let username = req.body.username;
  let password = req.body.password;

  let passwordHash = "";

  let sql = "SELECT * FROM login WHERE UserName = ?";
  let [rows] = await pool.query(sql, [username]);
  if (rows.length > 0) {
    passwordHash = rows[0].UserPwd;
  }
  let match = await bcrypt.compare(password, passwordHash);
  if (match) {
    req.session.authenticated = true;
    req.session.user_id = rows[0].UserId;
    res.render("home");
  } else {
    res.redirect("/");
  }
});

app.get("/newUser", (req, res) => {
  res.render("newUser");
});

app.get("/newUser", (req, res) => {
  res.render("newUser");
});

app.post("/newUser", async (req, res) => {
  let username = req.body.username;
  let password = req.body.password;

  let passwordHash = await bcrypt.hash(password, 10);

  let sql = "INSERT INTO login (UserName, UserPwd) VALUES (?, ?)";
  await pool.query(sql, [username, passwordHash]);
  res.redirect("/");
});

app.get("/home", isAuthenticated, (req, res) => {
  res.render("home");
});

app.post("/searchBySong", isAuthenticated, async (req, res) => {
  try {
    let song = req.body.songName;
    let data = await spotifyApi.searchTracks(song);
    let songs = data.body.tracks.items;
    res.render("songResults", { songs });
  } catch (err) {
    console.log("searchBySong error:", err.statusCode);
    res.render("songResults", { songs: [], error: "Search failed, please try again later." });
  }
});

app.post("/searchByMovie", isAuthenticated, async (req, res) => {
  try {
    let movieTitle = req.body.movieName;
    const response = await fetch(`http://www.omdbapi.com/?t=${movieTitle}&apikey=${process.env.OMDB_API_KEY}`);
    const data = await response.json();
    console.log(data);

    res.render("movie.ejs", { movie: data, error: null });
  } catch (err) {
    res.render("movie.ejs", { movie: null, error: "Failed to fetch movie data." });
  }
});

app.get("/home", isAuthenticated, (req, res) => {
  res.render("home");
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

app.get("/song", isAuthenticated, async (req, res) => {
  try {
    const track = JSON.parse(decodeURIComponent(req.query.data));

    const userId = req.session.user_id;
    const sql = `
      SELECT playlist_id, playlist_name, is_default
      FROM playlists
      WHERE user_id = ?
      ORDER BY is_default DESC, playlist_name ASC
    `;
    const [playlists] = await pool.query(sql, [userId]);
    res.render("song.ejs", { track, playlists, error: null });
  } catch (err) {
    console.log("song error:", err);
    res.render("song.ejs", { track: null, playlists: [], error: "Failed to load song." });
  }
});

// Show playlist center with all playlists for the user
app.get("/playlist", isAuthenticated, async (req, res) => {
  const userId = req.session.user_id;
  const sql = `
    SELECT playlist_id, playlist_name, is_default
    FROM playlists
    WHERE user_id = ?
    ORDER BY is_default DESC, playlist_name ASC
  `;
  const [playlists] = await pool.query(sql, [userId]);
  const [countRows] = await pool.query(
    "SELECT COUNT(*) AS count FROM playlists WHERE user_id = ?",
    [userId]
  );
  const playlistCount = countRows[0].count;
  res.render("playlist_center", {playlists,playlistCount});
});

// Show add playlist form, but limit to 5 playlists per user
app.get("/addplaylist", isAuthenticated, async (req, res) => {
  const userId = req.session.user_id;
  const [rows] = await pool.query(
    "SELECT COUNT(*) AS count FROM playlists WHERE user_id = ?",
    [userId]
  );
  if (rows[0].count >= 5) {
    return res.send("You already have the maximum of 5 playlists.");
  }
  res.render("addplaylist");
});

//add playlist, but limit to 5 playlists per user, and prevent duplicates
app.post("/addplaylist", isAuthenticated, async (req, res) => {
  const userId = req.session.user_id;
  const name = req.body.playlistName;
  const [rows] = await pool.query(
    "SELECT COUNT(*) AS count FROM playlists WHERE user_id = ?",
    [userId]
  );
  if (rows[0].count >= 5) {
    return res.send("You already have 5 playlists.");
  }
  await pool.query(
    "INSERT INTO playlists (user_id, playlist_name, is_default) VALUES (?, ?, 0)",
    [userId, name]
  );
  res.redirect("/playlist");
});

// View playlist details and songs
app.get("/playlist/:id", isAuthenticated, async (req, res) => {
  const playlistId = req.params.id;
  const [playlistRows] = await pool.query(
    "SELECT playlist_name FROM playlists WHERE playlist_id = ?",
    [playlistId]
  );
  if (playlistRows.length === 0) {
    return res.send("Playlist not found.");
  }
  const playlistName = playlistRows[0].playlist_name;
  const [songs] = await pool.query(
    `SELECT spotify_id, song_title, artist_name
     FROM playlist_songs
     WHERE playlist_id = ?`,
    [playlistId]
  );
  res.render("playlist", {playlistId,playlistName,songs});
});

// Delete playlist, but prevent deletion of default "Favorites" playlist
app.get("/deleteplaylist/:id", isAuthenticated, async (req, res) => {
  const playlistId = req.params.id;
  const [rows] = await pool.query(
    "SELECT is_default FROM playlists WHERE playlist_id = ?",
    [playlistId]
  );
  if (rows.length === 0 || rows[0].is_default === 1) {
    return res.send("You cannot delete the default Favorites playlist.");
  }
  await pool.query("DELETE FROM playlist_songs WHERE playlist_id = ?", [
    playlistId,
  ]);
  await pool.query("DELETE FROM playlists WHERE playlist_id = ?", [
    playlistId,
  ]);
  res.redirect("/playlist");
});

// Add song to playlist, only allows 50 songs per playlist, and prevents duplicates with INSERT IGNORE
app.post("/addToPlaylist", isAuthenticated, async (req, res) => {
  const { playlist_id, spotify_id, song_title, artist_name } = req.body;
  const [rows] = await pool.query(
    "SELECT COUNT(*) AS count FROM playlist_songs WHERE playlist_id = ?",
    [playlist_id]
  );
  if (rows[0].count >= 50) {
    return res.send("This playlist already has 50 songs.");
  }
  await pool.query(
    `INSERT IGNORE INTO playlist_songs 
     (playlist_id, spotify_id, song_title, artist_name)
     VALUES (?, ?, ?, ?)`,
    [playlist_id, spotify_id, song_title, artist_name]
  );
  res.redirect("/playlist/" + playlist_id);
});

app.listen(3000, () => {console.log("server started");});