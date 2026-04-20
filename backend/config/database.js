import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { config } from "./env.js";

let mongod = null;

export async function connectDatabase() {
    try {
        // If no URI provided, or explicitly requested in-memory
        if (!config.MONGODB_URI || config.MONGODB_URI === "in-memory") {
            console.log("No MongoDB URI provided. Starting in-memory MongoDB for development...");
            mongod = await MongoMemoryServer.create();
            const uri = mongod.getUri();
            const conn = await mongoose.connect(uri);
            console.log(`In-memory MongoDB Connected: ${conn.connection.host}`);
            return conn;
        }

        const conn = await mongoose.connect(config.MONGODB_URI, {
            serverSelectionTimeoutMS: 5000, // Fail fast if can't connect
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        return conn;
    } catch (error) {
        console.error(`Error connecting to MongoDB: ${error.message}`);

        if (!mongod) {
            console.log("Falling back to in-memory MongoDB...");
            try {
                mongod = await MongoMemoryServer.create();
                const uri = mongod.getUri();
                const conn = await mongoose.connect(uri);
                console.log(`Fallback In-memory MongoDB Connected: ${conn.connection.host}`);
                return conn;
            } catch (fallbackError) {
                console.error(`Critical: Fallback to in-memory MongoDB failed: ${fallbackError.message}`);
                process.exit(1);
            }
        }

        process.exit(1);
    }
}

export async function closeDatabase() {
    await mongoose.disconnect();
    if (mongod) {
        await mongod.stop();
    }
}
