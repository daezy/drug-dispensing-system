// MongoDB database configuration and connection using Mongoose
// Blockchain-based drug dispensing system

import mongoose from "mongoose";

// Database configuration
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/pharmchain_db";

// Log MongoDB URI (without password) for debugging
if (process.env.NODE_ENV === "development") {
  const maskedUri = MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, "//***:***@");
  console.log("🔗 MongoDB URI:", maskedUri);
}

// Global connection cache to prevent multiple connections in development
interface MongooseConnection {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongoose: MongooseConnection | undefined;
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

// Connect to MongoDB
export async function connectToDatabase(): Promise<typeof mongoose> {
  // Ensure cached is always defined
  if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 30000, // 30 seconds for MongoDB Atlas
      socketTimeoutMS: 45000,
      family: 4, // Use IPv4, skip trying IPv6
    };

    cached.promise = mongoose
      .connect(MONGODB_URI, opts)
      .then((mongoose) => {
        console.log("✅ Connected to MongoDB successfully");
        return mongoose;
      })
      .catch((error) => {
        console.error("❌ MongoDB connection error:", error);
        throw error;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

// Database utility functions
export class DatabaseManager {
  private static instance: DatabaseManager;
  private isConnected: boolean = false;

  private constructor() {}

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  // Ensure database connection
  async ensureConnection(): Promise<void> {
    if (!this.isConnected) {
      await connectToDatabase();
      this.isConnected = true;
    }
  }

  // Check if database is properly initialized
  async checkDatabase(): Promise<boolean> {
    try {
      await this.ensureConnection();
      // Check if models are properly set up by counting collections
      if (mongoose.connection.db) {
        const collections = await mongoose.connection.db
          .listCollections()
          .toArray();
        return collections.length > 0;
      }
      return false;
    } catch (error) {
      console.error("Error checking database:", error);
      return false;
    }
  }

  // Initialize database (for MongoDB, this means ensuring connection and indexes)
  async initializeDatabase(): Promise<void> {
    try {
      await this.ensureConnection();
      console.log("✅ Database initialized successfully");
    } catch (error) {
      console.error("❌ Database initialization error:", error);
      throw error;
    }
  }

  // Get database connection status
  getConnectionStatus(): string {
    const state = mongoose.connection.readyState;
    switch (state) {
      case 0:
        return "disconnected";
      case 1:
        return "connected";
      case 2:
        return "connecting";
      case 3:
        return "disconnecting";
      default:
        return "unknown";
    }
  }
}

export default DatabaseManager;
