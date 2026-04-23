import express from 'express';
import mysql from 'mysql2/promise';

const app = express();
app.set("view engine", "ejs");
app.use(express.static("public"));

app.use(express.urlencoded({extended:true}));

const pool = mysql.createPool({
    host: "your_hostname",
    user: "your_username",
    password: "your_password",
    database: "your_database",
    connectionLimit: 10,
    waitForConnections: true
});

app.get('/', (req, res) => {
   res.render('index')
});


app.listen(3000, () => {
   console.log('server started');
});
