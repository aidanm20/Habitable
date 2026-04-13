import "dotenv/config";
import express from "express";
import { MongoClient, ObjectId } from "mongodb";

const app = express();
const PORT = 3001;

app.use(express.json());

// Allow requests from the Vite dev server
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

const client = new MongoClient(process.env.MONGO_URI);
let messages;

async function connect() {
  await client.connect();
  const db = client.db("fireplace");
  messages = db.collection("messages");
  console.log("✅ Connected to MongoDB — fireplace.messages");
}

// GET /api/messages — return last 50, newest first
app.get("/api/messages", async (req, res) => {
  try {
    const docs = await messages
      .find()
      .sort({ timestamp: -1 })
      .limit(50)
      .toArray();
    res.json(docs);
  } catch (err) {
    console.error("GET /api/messages error:", err);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// POST /api/messages — save a new message
app.post("/api/messages", async (req, res) => {
  const { text, nickname } = req.body;
  if (!text || typeof text !== "string" || text.trim().length === 0) {
    return res.status(400).json({ error: "text is required" });
  }
  if (text.trim().length > 200) {
    return res.status(400).json({ error: "text must be 200 characters or fewer" });
  }
  try {
    const doc = {
      text: text.trim(),
      nickname: nickname ? String(nickname).trim().slice(0, 30) : null,
      timestamp: new Date(),
    };
    const result = await messages.insertOne(doc);
    res.status(201).json({ ...doc, _id: result.insertedId });
  } catch (err) {
    console.error("POST /api/messages error:", err);
    res.status(500).json({ error: "Failed to save message" });
  }
});

connect()
  .then(() => {
    app.listen(PORT, () =>
      console.log(`🔥 Server running at http://localhost:${PORT}`)
    );
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err);
    process.exit(1);
  });
