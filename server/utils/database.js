// db.js
import { config as dotenvConfig } from "dotenv";
import { MongoClient } from "mongodb";

dotenvConfig({ override: true });

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017";
const DB_NAME = process.env.DB_NAME || "phones_db";

let client;
let db;

export async function getDb() {
  if (db) return db;

  client = new MongoClient(MONGODB_URI);
  await client.connect();
  db = client.db(DB_NAME);
  console.log("MongoDB connected");
  return db;
}
