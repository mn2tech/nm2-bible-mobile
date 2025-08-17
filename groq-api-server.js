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

// Streaming endpoint for real-time responses
app.post('/api/groq/stream', async (req, res) => {
  const { question } = req.body;
  if (!question) {
    res.status(400).write('Missing question');
    return res.end();
  }
  try {
    const prompt = `You are a knowledgeable Bible AI assistant. Answer the following question about the Bible with accuracy and provide relevant biblical references when possible. Keep responses concise but informative.\n\nQuestion: ${question}\n\nPlease provide:\n1. A clear, helpful answer\n2. Relevant Bible verses or references if applicable\n3. Context when necessary\n\nAnswer:`;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.flushHeaders && res.flushHeaders();

    let fullText = '';
    const stream = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: 'You are a helpful Bible AI assistant with deep knowledge of Christian scripture. Provide accurate, respectful, and informative responses about biblical topics, verses, and Christian theology.' },
        { role: 'user', content: prompt },
      ],
      model: 'llama3-8b-8192',
      temperature: 0.7,
      max_tokens: 1024,
      top_p: 1,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices?.[0]?.delta?.content || '';
      if (content) {
        fullText += content;
        res.write(content);
      }
    }
    res.end();
  } catch (error) {
    console.error('Groq API Stream Error:', error);
    res.write('Sorry, I encountered an error while processing your question. Please try again.');
    res.end();
  }
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

// GET /api/groq/daily - returns a short daily reading
app.get('/api/groq/daily', async (req, res) => {
  try {
    const prompt = `Provide a short daily Bible reading: one brief passage (1-3 verses) and a one-sentence devotional reflection. Keep it concise.`;
    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: 'You are a helpful Bible AI assistant. Provide accurate, respectful daily readings.' },
        { role: 'user', content: prompt },
      ],
      model: 'llama3-8b-8192',
      temperature: 0.7,
      max_tokens: 512,
      top_p: 1,
      stream: false,
    });
    const response = completion.choices[0]?.message?.content || 'No response received';
    const referencePattern = /\b\d?\s?[A-Z][a-z]+\s+\d+:\d+(-\d+)?\b/g;
    const references = response.match(referencePattern) || [];
    res.json({ answer: response, references });
  } catch (error) {
    console.error('Groq API /daily Error:', error);
    res.status(500).json({ answer: 'Sorry, could not generate a daily reading at this time.', references: [], error: error.message || 'Unknown error' });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Groq API server running on port ${PORT}`);
});
