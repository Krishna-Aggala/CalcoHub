const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is missing from .env");
    }

    const connection = await mongoose.connect(
      process.env.MONGO_URI
    );

    console.log("MongoDB connected successfully!");

    console.log(
      "Connected database:",
      connection.connection.name
    );

    console.log(
      "Connected host:",
      connection.connection.host
    );
  } catch (error) {
    console.error(
      "MongoDB connection failed:",
      error.message
    );

    process.exit(1);
  }
};

module.exports = connectDB;