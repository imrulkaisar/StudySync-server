const express = require("express");
const app = express();
const port = process.env.PORT || 3333;

// Default API
app.get("/", (req, res) => {
  res.send("App is running...");
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
