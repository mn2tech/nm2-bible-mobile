// Simple Express backend for Groq API
const express = require('express');
const cors = require('cors');
const Groq = require('groq-sdk');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const groq = new Groq({
  apiKey: process.env.EXPO_PUBLIC_GROQ_API_KEY,
});

app.post('/api/groq', async (req, res) => {
  const { question } = req.body;
  if (!question) return res.status(400).json({ answer: '', references: [], error: 'Missing question' });
  try {
    const prompt = `You are a knowledgeable Bible AI assistant. Answer the following question about the Bible with accuracy and provide relevant biblical references when possible. Keep responses concise but informative.\n\nQuestion: ${question}\n\nPlease provide:\n1. A clear, helpful answer\n2. Relevant Bible verses or references if applicable\n3. Context when necessary\n\nAnswer:`;
    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: 'You are a helpful Bible AI assistant with deep knowledge of Christian scripture. Provide accurate, respectful, and informative responses about biblical topics, verses, and Christian theology.' },
        { role: 'user', content: prompt },
      ],
      model: 'llama3-8b-8192',
      temperature: 0.7,
      max_tokens: 1024,
      top_p: 1,
      stream: false,
    });
    const response = completion.choices[0]?.message?.content || 'No response received';
    const referencePattern = /\b\d?\s?[A-Z][a-z]+\s+\d+:\d+(-\d+)?\b/g;
    const references = response.match(referencePattern) || [];
    res.json({ answer: response, references });
  } catch (error) {
    console.error('Groq API Error:', error);
    res.status(500).json({ answer: 'Sorry, I encountered an error while processing your question. Please try again.', references: [], error: error.message || 'Unknown error' });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Groq API server running on port ${PORT}`);
});
