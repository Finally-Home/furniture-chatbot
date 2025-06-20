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

// Load product CSV into memory
fs.createReadStream('./main-products-cleaned.csv')
  .pipe(csv())
  .on('data', (row) => products.push(row))
  .on('end', () => console.log(`✅ Loaded ${products.length} products into memory`));

// Chat endpoint
app.post('/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    const lastUserMessage = messages[messages.length - 1].content.toLowerCase();

    // Basic product match on keywords like "sofa", "black", etc.
    const matchedProducts = products.filter(p =>
      p.Title && lastUserMessage.includes('sofa') && p.Title.toLowerCase().includes('sofa')
    );

    let productContext = '';
    if (matchedProducts.length > 0) {
      const top = matchedProducts.slice(0, 3);
      productContext = `\n\nHere are a few sofa options:\n${top.map(p => `• ${p.Title} - $${p['Variant Price']}`).join('\n')}`;
    }

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant for a furniture store called Finally Home Furnishings. Be warm, informative, and suggest products when relevant.'
          },
          ...messages,
          { role: 'user', content: lastUserMessage + productContext }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    res.json({ reply: response.data.choices[0].message });
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

app.listen(3000, () => {
  console.log('🚀 Server listening on port 3000');
});
