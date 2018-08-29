// Import express files and routers
const express = require("express");
const app = express();
const apiRouter = require("./api/api");

// Import error handlers, parsers and resource sharing libraries
const cors = require("cors");
const bodyParser = require("body-parser");
const morgan = require("morgan");
const errorhandlder = require("errorhandler");

// Setup PORT value
const PORT = process.env.PORT || 4000;

// Use libraries
app.use(cors());
app.use(bodyParser.json());
app.use(morgan("tiny"));
app.use(errorhandlder());

// Mount router @ROUTE '/api'
app.use("/api", apiRouter);

// Start server and listen at PORT specified
app.listen(PORT, () => {
  console.log(`Listening on server port ${PORT}`);
});

module.exports = app;
