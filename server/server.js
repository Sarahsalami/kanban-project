const express = require("express");
const cors = require("cors");
require("dotenv").config();
const taskRoutes = require("./routes/taskRoutes");

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);

connectDB();

app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Kanban backend is running",
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});