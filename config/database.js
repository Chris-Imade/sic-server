const mongoose = require("mongoose");
const logger = require("./logger");

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;

    logger.info(
      `Attempting to connect to MongoDB at: ${mongoURI.replace(
        /\/\/.*@/,
        "//***:***@"
      )}`
    );

    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 10000,  // Increased from 5000
      socketTimeoutMS: 60000,           // Increased from 45000
      connectTimeoutMS: 10000,          // Added explicit connection timeout
      maxPoolSize: 10,                  // Maximum number of connections in the connection pool
      retryWrites: true,                // Enable retryable writes
      retryReads: true,                 // Enable retryable reads
    });

    logger.info(
      `MongoDB Connected: ${conn.connection.host}:${conn.connection.port}/${conn.connection.name}`
    );

    // Handle connection events
    mongoose.connection.on("error", (err) => {
      logger.error("MongoDB connection error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      logger.warn("MongoDB disconnected");
    });

    mongoose.connection.on("reconnected", () => {
      logger.info("MongoDB reconnected");
    });

    // Graceful shutdown
    process.on("SIGINT", async () => {
      try {
        await mongoose.connection.close();
        logger.info("MongoDB connection closed through app termination");
        process.exit(0);
      } catch (err) {
        logger.error("Error during MongoDB shutdown:", err);
        process.exit(1);
      }
    });

    return conn;
  } catch (error) {
    logger.error("Database connection failed:", error);
    process.exit(1);
  }
};

module.exports = connectDB;
