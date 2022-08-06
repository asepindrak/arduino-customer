const { SerialPort } = require("serialport");
require("dotenv").config();
const connection = require(__dirname + "/db/connection");
// const comPort1 = new SerialPort({
//   path: process.env.COM,
//   baudRate: 19200,
//   dataBits: 8,
//   stopBits: 1,
//   parity: "none",
// });
const excelJS = require("exceljs");
const express = require("express"),
  app = express();
const { Server } = require("socket.io");
const http = require("http");
var bodyParser = require("body-parser");
const server = http.createServer(app);
const io = new Server(server);
app.use(express.static(__dirname));
app.use(bodyParser.urlencoded({ extended: false }));
var stream;
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});
app.get("/admin", (req, res) => {
  res.sendFile(__dirname + "/public/login.html");
});
app.get("/auth", (req, res) => {
  const { username, password } = req.query;
  connection.query(
    `SELECT name FROM admin WHERE trash=0 AND username = "${username}" AND password = md5("${password}")`,
    function (err, rows, fields) {
      if (err) console.log(err);
      // console.log(rows.length);
      res.send(rows);
    }
  );
});
app.get("/dashboard", (req, res) => {
  res.sendFile(__dirname + "/public/dashboard.html");
});
app.get("/get-total", (req, res) => {
  const { date_start, date_end, review } = req.query;
  // console.log(req.query);
  let filter = "";
  if (date_start != "" && date_end != "") {
    if (review == "") {
      filter = `WHERE created_at BETWEEN '${date_start}' AND '${date_end}'`;
    } else {
      filter = `WHERE review = '${review}' AND created_at BETWEEN '${date_start}' AND '${date_end}'`;
    }
  }
  // console.log(filter);
  connection.query(
    `SELECT COUNT(*) AS total FROM survey ${filter}`,
    function (err, rows, fields) {
      if (err) console.log(err);
      // console.log(rows);
      res.send(rows);
    }
  );
});

app.get("/get-review", (req, res) => {
  let { date_start, date_end, review } = req.query;

  let page = 1;
  let limit = req.query.limit;
  let offset = page > 1 ? page * limit - limit : 0;
  let limitoffset = `limit ${limit} offset ${offset}`;
  if (req.query.page) {
    page = req.query.page;
    offset = page > 1 ? page * limit - limit : 0;
    limitoffset = `limit ${limit} offset ${offset}`;
  } else {
    limitoffset = ``;
  }
  let filter = "";
  if (date_start != "" && date_end != "") {
    if (review == "") {
      filter = `WHERE created_at BETWEEN '${date_start}' AND '${date_end}'`;
    } else {
      filter = `WHERE review = '${review}' AND created_at BETWEEN '${date_start}' AND '${date_end}'`;
    }
  }
  // console.log("filter " + filter);
  connection.query(
    `SELECT * FROM survey ${filter} ORDER BY id DESC ${limitoffset}`,
    function (err, rows, fields) {
      if (err) console.log(err);
      // console.log(rows);
      res.send(rows);
    }
  );
});

app.get("/get-total-data", (req, res) => {
  let { date_start, date_end, review } = req.query;

  let filter = "";
  if (date_start != "" && date_end != "") {
    if (review == "") {
      filter = `WHERE created_at BETWEEN '${date_start}' AND '${date_end}'`;
    } else {
      filter = `WHERE review = '${review}' AND created_at BETWEEN '${date_start}' AND '${date_end}'`;
    }
  }
  // console.log("filter " + filter);
  connection.query(
    `SELECT * FROM survey ${filter} ORDER BY id DESC`,
    function (err, rows, fields) {
      if (err) console.log(err);
      // console.log(rows);
      if (rows.length > 0) {
        let data = {
          totalTP: 0,
          totalP: 0,
          totalSP: 0,
        };
        for (var i = 0; i < rows.length; i++) {
          let item = rows[i];
          if (item.review == 0) {
            data.totalTP += 1;
          } else if (item.review == 1) {
            data.totalP += 1;
          } else if (item.review == 2) {
            data.totalSP += 1;
          }
        }
        // console.log(data);
        res.send(data);
      } else {
        let data = {
          totalTP: 0,
          totalP: 0,
          totalSP: 0,
        };
        res.send(data);
      }
    }
  );
});

app.get("/create-review", (req, res) => {
  let { review } = req.query;

  connection.query(
    `INSERT INTO survey SET review = ?, created_at = ?`,
    [review, today()],
    function (err, rows, fields) {
      if (err) console.log(err);
      res.send([]);
    }
  );
});

app.get("/export", (req, res) => {
  let { date_start, date_end, review } = req.query;

  let filter = "";
  if (date_start != "" && date_end != "") {
    if (review == "") {
      filter = `WHERE created_at BETWEEN '${date_start}' AND '${date_end}'`;
    } else {
      filter = `WHERE review = '${review}' AND created_at BETWEEN '${date_start}' AND '${date_end}'`;
    }
  }
  // console.log("filter " + filter);
  connection.query(
    `SELECT * FROM survey ${filter} ORDER BY id DESC`,
    async function (err, rows, fields) {
      if (err) console.log(err);
      // console.log(rows);
      let data = {
        totalTP: 0,
        totalP: 0,
        totalSP: 0,
      };
      for (var i = 0; i < rows.length; i++) {
        let item = rows[i];
        if (item.review == 0) {
          data.totalTP += 1;
        } else if (item.review == 1) {
          data.totalP += 1;
        } else if (item.review == 2) {
          data.totalSP += 1;
        }
      }

      const workbook = new excelJS.Workbook(); // Create a new workbook
      const worksheet = workbook.addWorksheet("My Users"); // New Worksheet
      const path = "./files"; // Path to download excel
      // Column for data in excel. key must match data key
      worksheet.columns = [
        { header: "", key: "no", width: 20 },
        { header: "", key: "created_at", width: 20 },
        { header: "", key: "review", width: 20 },
      ];
      // Looping through User data

      let breakRow = {
        no: "",
        created_at: "",
        review: "",
      };

      let counter = 1;
      let header = {
        no: "",
        created_at: "Laporan Ulasan Polres Garut",
        review: "",
      };
      worksheet.addRow(header);

      worksheet.addRow(breakRow);

      let statistikHeader = {
        no: ((data.totalTP / rows.length) * 100).toFixed(1) + "%",
        created_at: ((data.totalP / rows.length) * 100).toFixed(1) + "%",
        review: ((data.totalSP / rows.length) * 100).toFixed(1) + "%",
      };
      worksheet.addRow(statistikHeader);

      let statistik = {
        no: "Tidak Puas",
        created_at: "Puas",
        review: "Sangat Puas",
      };
      worksheet.addRow(statistik);

      worksheet.addRow(breakRow);

      worksheet.addRow(breakRow);

      worksheet.addRow(breakRow);

      let thead = {
        no: "No",
        created_at: "Tanggal",
        review: "Ulasan",
      };
      worksheet.addRow(thead);

      rows.forEach((item) => {
        item.no = counter;
        if (item.review == 0) {
          item.review = "Tidak Puas";
        } else if (item.review == 1) {
          item.review = "Puas";
        } else if (item.review == 2) {
          item.review = "Sangat Puas";
        }
        worksheet.addRow(item); // Add data in worksheet
        counter++;
      });
      // Making first line in excel bold
      worksheet.getRow(2).eachCell((cell) => {
        cell.font = { bold: true, size: 18 };
      });
      worksheet.getRow(4).eachCell((cell) => {
        cell.font = { bold: true, size: 30 };
      });
      worksheet.getRow(5).eachCell((cell) => {
        cell.font = { bold: true, size: 18 };
      });
      worksheet.getRow(7).eachCell((cell) => {
        cell.font = { bold: true, size: 16 };
      });
      worksheet.getRow(9).eachCell((cell) => {
        cell.font = { bold: true, size: 12 };
      });
      let date = formatDate(new Date());
      worksheet.mergeCells("A2:C2");
      worksheet.getCell("C2").value = "Laporan Survey Kepuasan Polres Garut";
      worksheet.getCell("A7").value = "Total";
      worksheet.getCell("B7").value = rows.length + " Ulasan";
      worksheet.getCell("C2").alignment = {
        vertical: "middle",
        horizontal: "center",
      };
      worksheet.getCell("A4").alignment = {
        vertical: "middle",
        horizontal: "center",
      };
      worksheet.getCell("A5").alignment = {
        vertical: "middle",
        horizontal: "center",
      };
      worksheet.getCell("B4").alignment = {
        vertical: "middle",
        horizontal: "center",
      };
      worksheet.getCell("B5").alignment = {
        vertical: "middle",
        horizontal: "center",
      };
      worksheet.getCell("C4").alignment = {
        vertical: "middle",
        horizontal: "center",
      };
      worksheet.getCell("C5").alignment = {
        vertical: "middle",
        horizontal: "center",
      };
      try {
        const data = await workbook.xlsx
          .writeFile(`${path}/laporan-ulasan-${date}.xlsx`)
          .then(() => {
            res.send({
              status: "success",
              message: "file successfully downloaded",
              path: `laporan-ulasan-${date}.xlsx`,
            });
          });
      } catch (err) {
        res.send({
          status: "error",
          message: "Something went wrong",
        });
      }
    }
  );
});

var oldData = 0;
io.on("connection", (socket) => {
  //console.log("a user connected");
  socket.on("disconnect", () => {
    //console.log("user disconnected");
  });
  // comPort1.setMaxListeners(9000);
  // comPort1.on("data", (data) => {
  //   data = JSON.stringify(data);
  //   data = JSON.parse(data);
  //   let survey = data.data[0];
  //   //console.log(survey);
  //   let review = 2;
  //   if (survey == 24) {
  //     review = 1;
  //   } else if (survey == 30) {
  //     review = 0;
  //   }

  //   socket.emit("data", review);
  //   if (review != oldData) {
  //     oldData = review;
  //     //console.log(review);
  //     connection.query(
  //       `INSERT INTO survey SET review = ?, created_at = ?`,
  //       [review, today()],
  //       function (err, rows, fields) {
  //         if (err) console.log(err);
  //       }
  //     );
  //   }

  //   setTimeout(function () {
  //     oldData = 0;
  //   }, 500);
  // });
});

server.listen(process.env.PORT, () =>
  console.log(`Listening to port ${process.env.PORT}`)
);

function today() {
  const d = new Date();
  const ye = new Intl.DateTimeFormat("en", { year: "numeric" }).format(d);
  const mo = new Intl.DateTimeFormat("en", { month: "2-digit" }).format(d);
  const da = new Intl.DateTimeFormat("en", { day: "2-digit" }).format(d);

  return `${da}-${mo}-${ye}`;
}

function formatDate(d) {
  const ye = new Intl.DateTimeFormat("en", { year: "numeric" }).format(d);
  const mo = new Intl.DateTimeFormat("en", { month: "2-digit" }).format(d);
  const da = new Intl.DateTimeFormat("en", { day: "2-digit" }).format(d);

  return `${da}-${mo}-${ye}`;
}
