require("dotenv").config();

const express = require("express");
const cors = require("cors");

const connectDB = require("./config/db");
const calculationRoutes = require("./routes/calculationRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
  })
);

app.use(express.json({ limit: "10kb" }));

// Health-check endpoint
app.get("/", (req, res) => {
  res.json({
    message: "SmartCalc API is running",
  });
});

// Calculation routes
app.use("/api/calculations", calculationRoutes);

// Not-found handler
app.use((req, res) => {
  res.status(404).json({
    message: "API endpoint not found",
  });
});

// Central error handler
app.use((error, req, res, next) => {
  console.error(error);

  res.status(500).json({
    message: "Internal server error",
  });
});

// Start only after connecting to MongoDB
const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
};

startServer();