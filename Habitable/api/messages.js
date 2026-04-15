import { MongoClient } from "mongodb";

let client;
let messagesCollection;

async function connect() {
  if (!client) {
    client = new MongoClient(process.env.MONGO_URI);
    await client.connect();
    messagesCollection = client.db("fireplace").collection("messages");
  }
  return messagesCollection;
}

export default async function handler(req, res) {
  const messages = await connect();

  if (req.method === "GET") {
    try {
      const docs = await messages
        .find()
        .sort({ timestamp: -1 })
        .limit(50)
        .toArray();
      res.json(docs);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  } else if (req.method === "POST") {
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
      res.status(500).json({ error: "Failed to save message" });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
