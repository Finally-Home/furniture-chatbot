import express from 'express';
import axios from 'axios';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'node:fs';
import csv from 'csv-parser';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const products = [];
const reviews = [];

// ✅ Load products
fs.createReadStream('./main-products-cleaned.csv')
  .pipe(csv())
  .on('data', (row) => products.push(row))
  .on('end', () => {
    console.log(`✅ Loaded ${products.length} products into memory`);

    // ✅ Load reviews
    fs.createReadStream('./reviews.csv')
      .pipe(csv())
      .on('data', (row) => reviews.push(row))
      .on('end', () => {
        console.log(`✅ Loaded ${reviews.length} reviews into memory`);

        // ✅ Chatbot endpoint
        app.post('/chat', (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid messages format.' });
    }

    const userMessage = messages[messages.length - 1]?.content || 'No message found';
    const productName = products[0]?.Title || 'No product found';

    res.json({
      response: `You said: "${userMessage}". First product is: ${productName}.`
    });
  } catch (err) {
    console.error('❌ Chatbot error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

        // ✅ Start server
        app.listen(3000, () => {
          console.log('🚀 Server running on port 3000');
        });
      });
  });
