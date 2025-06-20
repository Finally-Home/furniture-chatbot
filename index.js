import express from 'express';
import axios from 'axios';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import csv from 'csv-parser';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const products = [];
const reviews = [];

// Load product CSV
fs.createReadStream('./main-products-cleaned.csv')
  .pipe(csv())
  .on('data', (row) => products.push(row))
  .on('end', () => {
    console.log(`✅ Loaded ${products.length} products into memory`);

    // ✅ After product file is loaded, THEN load reviews
    fs.createReadStream('./reviews.csv')
      .pipe(csv())
      .on('data', (row) => reviews.push(row))
      .on('end', () => {
        console.log(`✅ Loaded ${reviews.length} reviews into memory`);

        // ✅ After both are loaded, start server
        app.listen(3000, () => {
          console.log('🚀 Server running on port 3000');
        });
      });
  });

// Chat endpoint
app.post('/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    const lastUserMessage = messages[messages.length - 1].content.toLowerCase();

    // Match products by keyword
    const matchedProducts = products.filter(p =>
      p.Title && lastUserMessage.includes('sofa') && p.Title.toLowerCase().includes('sofa')
    );

    // Match reviews by ProductCode (SKU)
    let productContext = '';
    if (matchedProducts.length > 0) {
      const topProducts = matchedProducts.slice(0, 3);
      productContext += `\n\n🛋️ Sofa options:\n${topProducts.map(p => `• ${p.Title} - $${p['Variant Price']}`).join('\n')}`;

      // Attach relevant reviews for each product
      for (const product of topProducts) {
        const productReviews = reviews.filter(r => r.productcode === product['Handle']).slice(0, 2);
        if (productReviews.length > 0) {
          productContext += `\n\n⭐ Reviews for ${product.Title}:\n${productReviews.map(r => `• "${r.body}" — ${r.author}`).join('\n')}`;
        }
      }
    }

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant for a furniture store called Finally Home Furnishings. Provide warm, accurate recommendations based on available product and review data.',
          },
          ...messages,
          { role: 'user', content: lastUserMessage + productContext }
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error('❌ Chat error:', error?.response?.data || error.message);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

app.listen(3000, () => {
  console.log('🚀 Server listening on port 3000');
});
