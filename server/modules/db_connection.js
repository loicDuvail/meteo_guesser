const mysql = require("mysql2");

const pool = mysql.createPool({
    host: "localhost",
    user: "root",
    password: process.env.MYSQL_PASSWORD,
    database: "meteo_guesser",
    connectionLimit: 10,
});

module.exports = pool;
