import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'node:fs';
import csv from 'csv-parser';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const products = [];

// Load products from CSV
fs.createReadStream('./chatbot-products.csv')
  .pipe(csv())
  .on('data', (row) => products.push(row))
  .on('end', () => {
    console.log(`✅ Loaded ${products.length} products`);

    // Simple chatbot endpoint
    app.post('/chat', (req, res) => {
      const messages = req.body.messages;

      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: "Invalid messages format." });
      }

      const userMessage = messages[0];
      const lowerMsg = userMessage.toLowerCase();
      const priceMatch = userMessage.match(/\$?(\d+)(?!\d)/);
      const maxPrice = priceMatch ? parseInt(priceMatch[1]) : null;

      let filtered = products;

      if (lowerMsg.includes('sectional')) {
        filtered = filtered.filter(p =>
          p.title && p.title.toLowerCase().includes('sectional')
        );
      }

      if (maxPrice) {
        filtered = filtered.filter(p => {
          const price = parseFloat(p.price || '0');
          return !isNaN(price) && price <= maxPrice;
        });
      }

      const firstResult = filtered[0];
      const responseText = firstResult
        ? `You asked: "${userMessage}". First matching product: ${firstResult.title} – $${firstResult.price}`
        : `You asked: "${userMessage}". Sorry, I couldn't find any matching products.`;

      res.json({ response: responseText });
    });

    // Start server after products are loaded
    app.listen(3000, () => {
      console.log('🚀 Server running on port 3000');
    });
  });
