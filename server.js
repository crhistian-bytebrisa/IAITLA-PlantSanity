const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");

dotenv.config();

const app = express();

//Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));

//Que funcione el front
app.use(express.static("public"));

//El endpoint
app.post("/analyze", async (req, res) => {
  try {
    const { imageBase64 } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: "No image provided" });
    }

    const buffer = Buffer.from(imageBase64, "base64");

    const response = await fetch(process.env.AZURE_URL, {
      method: "POST",
      headers: {
        "Prediction-Key": process.env.AZURE_KEY,
        "Content-Type": "application/octet-stream"
      },
      body: buffer
    });

    const data = await response.json();

    res.json(data);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Servidor corriendo...");
});