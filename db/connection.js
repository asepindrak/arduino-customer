require("dotenv").config();
const mysql = require("mysql");

var connection = mysql.createConnection({
  host: process.env.HOST,
  user: process.env.USER,
  password: process.env.PASSWORD,
  database: process.env.DATABASE,
});
//console.log(process.env.USER);
connection.connect();
module.exports = connection;
