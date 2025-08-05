import Groq from 'groq-sdk';

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.EXPO_PUBLIC_GROQ_API_KEY || 'your-groq-api-key-here',
});

export interface BibleQueryResponse {
  answer: string;
  references?: string[];
  error?: string;
}

export class GroqBibleService {
  private static instance: GroqBibleService;

  private constructor() {}

  public static getInstance(): GroqBibleService {
    if (!GroqBibleService.instance) {
      GroqBibleService.instance = new GroqBibleService();
    }
    return GroqBibleService.instance;
  }

  async queryBible(question: string): Promise<BibleQueryResponse> {
    try {
      const prompt = `You are a knowledgeable Bible AI assistant. Answer the following question about the Bible with accuracy and provide relevant biblical references when possible. Keep responses concise but informative.

Question: ${question}

Please provide:
1. A clear, helpful answer
2. Relevant Bible verses or references if applicable
3. Context when necessary

Answer:`;

      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are a helpful Bible AI assistant with deep knowledge of Christian scripture. Provide accurate, respectful, and informative responses about biblical topics, verses, and Christian theology.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        model: 'llama3-8b-8192', // Using Llama 3 8B model
        temperature: 0.7,
        max_tokens: 1024,
        top_p: 1,
        stream: false,
      });

      const response = completion.choices[0]?.message?.content || 'No response received';
      
      // Extract references (simple regex to find Bible references)
      const referencePattern = /\b\d?\s?[A-Z][a-z]+\s+\d+:\d+(-\d+)?\b/g;
      const references = response.match(referencePattern) || [];

      return {
        answer: response,
        references: references,
      };
    } catch (error) {
      console.error('Groq API Error:', error);
      return {
        answer: 'Sorry, I encountered an error while processing your question. Please try again.',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getBibleVerse(reference: string): Promise<BibleQueryResponse> {
    try {
      const prompt = `Please provide the Bible verse for ${reference} in a clear, readable format. Include the book, chapter, verse, and the text itself.`;

      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are a Bible verse lookup assistant. Provide accurate Bible verses in a clear format.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        model: 'llama3-8b-8192',
        temperature: 0.3,
        max_tokens: 512,
        top_p: 1,
        stream: false,
      });

      const response = completion.choices[0]?.message?.content || 'Verse not found';

      return {
        answer: response,
        references: [reference],
      };
    } catch (error) {
      console.error('Groq API Error:', error);
      return {
        answer: 'Sorry, I could not retrieve that verse. Please check the reference and try again.',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getDailyReading(): Promise<BibleQueryResponse> {
    try {
      const prompt = `Suggest a meaningful Bible verse or short passage for daily reflection today. Include the reference and a brief inspirational thought about its meaning.`;

      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are a devotional assistant providing daily Bible readings with inspirational insights.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        model: 'llama3-8b-8192',
        temperature: 0.8,
        max_tokens: 512,
        top_p: 1,
        stream: false,
      });

      const response = completion.choices[0]?.message?.content || 'No daily reading available';

      return {
        answer: response,
      };
    } catch (error) {
      console.error('Groq API Error:', error);
      return {
        answer: 'Sorry, I could not generate a daily reading at this time.',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

export default GroqBibleService.getInstance();
