import express from 'express';
import mysql from 'mysql2/promise';

const app = express();
app.set("view engine", "ejs");
app.use(express.static("public"));

app.use(express.urlencoded({extended:true}));

const pool = mysql.createPool({
    host: "r4919aobtbi97j46.cbetxkdyhwsb.us-east-1.rds.amazonaws.com",
    user: "jl3emjhbuxtut6er",
    password: "x12puhv1c57ihtef",
    database: "epszvsftpp9vtq40",
    connectionLimit: 10,
    waitForConnections: true
});

app.get('/', (req, res) => {
   res.render('login')
});

app.get('/home', (req, res) => {
   res.render('home');
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
