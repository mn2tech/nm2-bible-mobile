const express = require('express');
const cors = require('cors');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

const app = express();
app.use(cors());
app.use(express.json());

// Simple /image endpoint that accepts multipart/form-data and returns JSON with sessionId
app.post('/api/groq/image', upload.single('image'), (req, res) => {
  console.log('Mock server: received /api/groq/image -> file:', req.file && req.file.originalname);
  // Return a synthetic answer and sessionId
  const response = {
    answer: 'Mock server: I see an image. It looks like a person in prayer. (mock)',
    references: ['Mock:Psalm 23:1'],
    sessionId: 'mock-session-server-5678'
  };
  res.json(response);
});

// Streaming endpoint: sends simple SSE-like chunks, then final JSON
app.post('/api/groq/image/stream', upload.single('image'), (req, res) => {
  console.log('Mock server: received /api/groq/image/stream -> file:', req.file && req.file.originalname);
  // Use chunked transfer to simulate streaming text updates
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Transfer-Encoding', 'chunked');

  const chunks = [
    'Analyzing image...',
    'Looks like a person...',
    'Identifying context...',
  ];

  let i = 0;
  const interval = setInterval(() => {
    if (i < chunks.length) {
      res.write(chunks[i] + '\n');
      i++;
    } else {
      clearInterval(interval);
      // Final JSON payload
      const final = JSON.stringify({ answer: 'Mock server: final analysis — person praying (mock)', references: ['MockRef A'], sessionId: 'mock-session-server-5678' });
      res.write(final);
      res.end();
    }
  }, 500);
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`Mock Groq server listening on http://localhost:${port}`));
