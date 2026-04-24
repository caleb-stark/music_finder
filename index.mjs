import express from 'express';
import mysql from 'mysql2/promise';
import 'dotenv/config';
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
      const accessToken = data.body['access_token'];
      
      spotifyApi.setAccessToken(accessToken);
      console.log('Access token set, expires in', data.body['expires_in'], 'seconds');

      // Auto-refresh before it expires (every 55 minutes)
      setTimeout(getAccessToken, (data.body['expires_in'] - 300) * 1000);
   } catch (err) {
      console.error('Failed to get access token:', err);
   }
}

getAccessToken();

const pool = mysql.createPool({
   host: "r4919aobtbi97j46.cbetxkdyhwsb.us-east-1.rds.amazonaws.com",
   user: process.env.DB_USER,
   password: process.env.DB_PWD,
   database: "epszvsftpp9vtq40",
   connectionLimit: 10,
   waitForConnections: true
});

app.get('/', (req, res) => {
   res.render('index');
});

app.get('/home', (req, res) => {
   res.render('home');
});

app.get('/searchBySong', async (req, res) => {
   let song = req.query.song;

   console.log(`Searching for song ${song}`);

   let data = await spotifyApi.searchTracks(song);
   let songs = data.body.tracks.items;

   console.log(songs);

   res.render("search.ejs", {songs});
});

app.get('/search', (req, res) => {
   res.render('search');
});

app.get('/movie', (req, res) => {
   res.render('movie');
});

app.get('/song', (req, res) => {
   res.render('song');
});

app.get('/playlist', (req, res) => {
   res.render('playlist');
});

app.listen(3000, () => {
   console.log('server started');
});
