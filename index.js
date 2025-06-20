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

// ✅ Declare data containers
const products = [];
const reviews = [];

// ✅ Load products first
fs.createReadStream('./main-products-cleaned.csv')
  .pipe(csv())
  .on('data', (row) => products.push(row))
  .on('end', () => {
    console.log(`✅ Loaded ${products.length} products into memory`);

    // ✅ Then load reviews
    fs.createReadStream('./reviews.csv')
      .pipe(csv())
      .on('data', (row) => reviews.push(row))
      .on('end', () => {
        console.log(`✅ Loaded ${reviews.length} reviews into memory`);

        // ✅ Start server AFTER loading
        app.listen(3000, () => {
          console.log('🚀 Server running on port 3000');
        });
      });
  });

// ✅ Chat endpoint (OUTSIDE of CSV loaders)
app.post('/chat', async (req, res) => {
  try {
    console.log('🧪 Chatbot hit!');
    const { messages } = req.body;
    console.log('🔍 First product object:', products[0]);

    const firstProduct = products[0]?.Title || 'No products loaded';
    res.json({
      response: `You asked: ${messages}. First product I know is: ${firstProduct}`
    });
  } catch (err) {
    console.error('❌ Chatbot error:', err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});
