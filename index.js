const express = require('express');
const axios = require('axios');
const cors = require('cors');
const dotenv = require('dotenv');
const fs = require('fs');
const csv = require('csv-parser');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const products = [];
const reviews = [];

fs.createReadStream('./main-products-cleaned.csv')
  .pipe(csv())
  .on('data', (row) => products.push(row))
  .on('end', () => {
    console.log(`✅ Loaded ${products.length} products into memory`);

    fs.createReadStream('./reviews.csv')
      .pipe(csv())
      .on('data', (row) => reviews.push(row))
      .on('end', () => {
        console.log(`✅ Loaded ${reviews.length} reviews into memory`);

        // Start server after data is loaded
        app.listen(3000, () => {
          console.log('🚀 Server running on port 3000');
        });

        // Define chatbot route
        app.post('/chat', async (req, res) => {
          try {
            console.log('🧪 /chat endpoint hit');
            console.log('products length:', products.length);
            console.log('first product:', products[0]?.Product_Title);

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
