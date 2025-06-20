import express from 'express';
import axios from 'axios';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'node:fs'; // ✅ FIXED for ES modules
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

        // ✅ Start server AFTER both CSVs are ready
        app.listen(3000, () => {
          console.log('🚀 Server running on port 3000');
        });

        // ✅ Chat endpoint
        app.post('/chat', async (req, res) => {
          try {
            const { messages } = req.body;
            const firstProduct = products[0]?.Product_Title || 'No products loaded';

            res.json({
              response: `You asked: ${messages}. First product I know is: ${firstProduct}`
            });
          } catch (err) {
            console.error('❌ Chatbot error:', err);
            res.status(500).json({ error: 'Something went wrong.' });
          }
        });
      });
  });
