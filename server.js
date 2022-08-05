const { SerialPort } = require("serialport");
require("dotenv").config();
const connection = require(__dirname + "/db/connection");
const comPort1 = new SerialPort({
  path: process.env.COM,
  baudRate: 19200,
  dataBits: 8,
  stopBits: 1,
  parity: "none",
});
const express = require("express"),
  app = express();
const { Server } = require("socket.io");
const http = require("http");
const server = http.createServer(app);
const io = new Server(server);
app.use(express.static(__dirname));
var stream;
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});
var oldData = 0;
io.on("connection", (socket) => {
  console.log("a user connected");
  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
  comPort1.setMaxListeners(9000);
  comPort1.on("data", (data) => {
    data = JSON.stringify(data);
    data = JSON.parse(data);
    let survey = data.data[0];
    console.log(survey);
    let value = 2;
    if (survey == 24) {
      value = 1;
    } else if (survey == 30) {
      value = 0;
    }

    socket.emit("data", value);
    if (value != oldData) {
      oldData = value;
      console.log(value);
      connection.query(
        `INSERT INTO survey SET value = ?`,
        [value],
        function (err, rows, fields) {
          if (err) console.log(err);
        }
      );
    }

    setTimeout(function () {
      oldData = 0;
    }, 500);
  });
  socket.on("chat message", (msg) => {
    console.log("message: " + msg);
  });
});

server.listen(3000, () => console.log("Listening to port 3000"));
