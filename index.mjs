import express from 'express';
import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';
import session from 'express-session';

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

app.set('trust proxy', 1); 
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true
}))

function isAuthenticated(req, res, next) {
   if (req.session.authenticated) {
       next();
   } else {
       res.redirect('/');
   }
}


app.get('/', (req, res) => {
   res.render('login')
});

app.post('/login', async (req, res) => {
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
      res.redirect('/home');
   } else {
      res.redirect('/');
   }
});

app.get('/newUser', (req, res) => {
   res.render('newUser');
});

app.post('/newUser', async (req, res) => {
   let username = req.body.username;
   let password = req.body.password;

   let passwordHash = await bcrypt.hash(password, 10);

   let sql = "INSERT INTO login (UserName, UserPwd) VALUES (?, ?)";
   await pool.query(sql, [username, passwordHash]);
   res.redirect('/');
});

app.get('/home', isAuthenticated, (req, res) => {
   res.render('home');
});

app.get('/search', isAuthenticated, (req, res) => {
   res.render('search');
});

app.get('/movie', isAuthenticated, (req, res) => {
   res.render('movie');
});

app.get('/song', isAuthenticated, (req, res) => {
   res.render('song');
});

app.get('/playlist', isAuthenticated, (req, res) => {
   res.render('playlist');
});

app.listen(3000, () => {
   console.log('server started');
});
