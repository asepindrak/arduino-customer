const { SerialPort } = require("serialport");
const comPort1 = new SerialPort({
  path: "COM7",
  baudRate: 19200,
  dataBits: 8,
  stopBits: 1,
  parity: "none",
});
const express = require("express"),
  app = express();

app.use(express.static(__dirname));
var stream;
app.get("/", (req, res) => {
  comPort1.setMaxListeners(9000);
  comPort1.on("data", (data) => {
    data = JSON.stringify(data);
    data = JSON.parse(data);
    console.log(data.data[0]);
  });
  res.json([]);
});

app.get("/", (req, res) => res.sendFile(__dirname + "/public/index.html"));

app.listen(3000, () => console.log("Listening to port 3000"));
