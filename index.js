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
  .on('end', () => console.log(`✅ Loaded ${products.length} products`));

// Load review CSV
fs.createReadStream('./reviews.csv')
  .pipe(csv())
  .on('data', (row) => reviews.push(row))
  .on('end', () => console.log(`✅ Loaded ${reviews.length} reviews`));

app.post('/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    const lastUserMessage = messages[messages.length - 1].content.toLowerCase();

    // Match products
    const matchedProducts = products.filter(p =>
      p.Title &&
      lastUserMessage.includes('sofa') &&
      p.Title.toLowerCase().includes('sofa')
    );

    let productContext = '';
    if (matchedProducts.length > 0) {
      const topProducts = matchedProducts.slice(0, 3);
      productContext += `\n\nHere are a few sofa options:\n`;
      for (const p of topProducts) {
        const matchedReviews = reviews.filter(r =>
          r.productcode && p.Handle && r.productcode.toLowerCase() === p.Handle.toLowerCase()
        ).slice(0, 2);

        const reviewText = matchedReviews.map(r => `  - "${r.body}" — ${r.author}`).join('\n') || '  - No reviews available';

        productContext += `• ${p.Title} - $${p['Variant Price']}\n${reviewText}\n`;
      }
    }

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant for a furniture store called Finally Home Furnishings. Be warm, informative, and suggest products when relevant.'
          },
          ...messages,
          { role: 'user', content: lastUserMessage + productContext }
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error('❌ Error in /chat:', error);
    res.status(500).send('Something went wrong');
  }
});

app.listen(3000, () => {
  console.log('🚀 Server listening on port 3000');
});
