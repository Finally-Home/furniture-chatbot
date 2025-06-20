app.post('/chat', async (req, res) => {
  try {
    const { messages } = req.body;

    const sampleProducts = products.slice(0, 3).map((p, i) => {
      return `${i + 1}. ${p.Title} – ${p.Type || 'Unknown Type'} – $${p['Variant Price']}`;
    }).join('\n');

    const prompt = [
      {
        role: "system",
        content: `You're a helpful furniture assistant. You know about the following products:\n\n${sampleProducts}`
      },
      {
        role: "user",
        content: messages
      }
    ];

    const completion = await openai.createChatCompletion({
      model: "gpt-4",
      messages: prompt
    });

    const reply = completion.data.choices[0]?.message?.content || 'Sorry, I had trouble responding.';
    res.json({ response: reply });

  } catch (err) {
    console.error('Chat error:', err.message);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});
