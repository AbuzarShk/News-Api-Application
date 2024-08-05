require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");
const mongoose = require("mongoose");
const Article = require("./models/Article"); // Import the Article model

const app = express();
app.use(cors());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));
db.once("open", () => {
  console.log("Connected to MongoDB");
});

app.get("/all-news", (req, res) => {
  let pageSize = parseInt(req.query.pageSize) || 0;
  let page = parseInt(req.query.page) || 0;
  if (pageSize === undefined || page === undefined || page <= 0) {
    page = 1;
    pageSize = 80;
  }
  let url = `https://newsapi.org/v2/everything?q=page=${page}&pageSize=${pageSize}&apiKey=${process.env.API_KEY}`;
  axios
    .get(url)
    .then((response) => {
      if (response.data.totalResults > page) {
        // Save articles to MongoDB
        const articles = response.data.articles.map((article) => new Article(article));
        Article.insertMany(articles)
          .then(() => {
            res.json({
              status: 200,
              success: true,
              message: "Successfully fetched and saved the data",
              data: response.data,
            });
          })
          .catch((error) => {
            res.json({
              status: 500,
              success: false,
              message: "Failed to save data to MongoDB",
              error: error,
            });
          });
      } else {
        res.json({
          status: 200,
          success: true,
          message: "No more results to show",
        });
      }
    })
    .catch(function (error) {
      res.json({
        status: 500,
        success: false,
        message: "Failed to fetch Data from the API",
        error: error,
      });
    });
});

// Other routes (top-headlines, country/:iso) can be updated similarly

app.listen(3000, function () {
  console.log("Server is running at port 3000");
});
