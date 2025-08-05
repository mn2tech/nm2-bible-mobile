// Set your backend API URL here
const API_URL = 'http://192.168.1.159:4000/api/groq'; // Updated to your computer's IP address

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
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question }),
      });
      const data = await res.json();
      return {
        answer: data.answer,
        references: data.references || [],
        error: data.error,
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
      const res = await fetch(`${API_URL}/verse`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reference }),
      });
      const data = await res.json();
      return {
        answer: data.answer,
        references: data.references || [reference],
        error: data.error,
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
      const res = await fetch(`${API_URL}/daily`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const data = await res.json();
      return {
        answer: data.answer,
        references: data.references || [],
        error: data.error,
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
