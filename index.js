// Define arrays at the top
const products = [];
const reviews = [];

// Load product CSV
fs.createReadStream('./main-products-cleaned.csv')
  .pipe(csv())
  .on('data', (row) => products.push(row))
  .on('end', () => {
    console.log(`✅ Loaded ${products.length} products into memory`);

    // Load reviews next
    fs.createReadStream('./reviews.csv')
      .pipe(csv())
      .on('data', (row) => reviews.push(row))
      .on('end', () => {
        console.log(`✅ Loaded ${reviews.length} reviews into memory`);

        // ✅ Start server AFTER both CSVs are fully loaded
        app.listen(3000, () => {
          console.log('🚀 Server running on port 3000');
        });

        // ✅ Chatbot route — defined AFTER products are available
        app.post('/chat', async (req, res) => {
          try {
            console.log('🧪 /chat endpoint hit');
            console.log('products length:', products.length);
            console.log('first product:', products[0]?.Product_Title);

            const { messages } = req.body;

            // Replace this with your actual logic later
            const firstProduct = products[0]?.Product_Title || 'No products loaded';

            res.json({
              response: `You asked: ${messages}. Here's one of our products: ${firstProduct}`
            });
          } catch (err) {
            console.error('❌ Chatbot error:', err);
            res.status(500).json({ error: 'Something went wrong.' });
          }
        });
      });
  });
