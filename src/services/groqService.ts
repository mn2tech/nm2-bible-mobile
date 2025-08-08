// Set your backend API URL here
const API_URL = 'http://192.168.1.159:4000/api/groq'; // Updated to your computer's IP address

export interface BibleQueryResponse {
  question: string;
  answer: string;
  references?: string[];
  error?: string;
  isTrueWisdom?: boolean;
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

  /**
   * Streams a Bible answer from the backend. Callback receives partial answer as it arrives.
   * Returns a promise that resolves when the stream is complete.
   */
  async streamBibleAnswer(
    question: string,
    onData: (partial: string) => void,
    onDone?: (full: string) => void,
    onError?: (err: any) => void
  ): Promise<void> {
    try {
      const res = await fetch(API_URL + '/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question }),
      });
      if (!res.body) throw new Error('No response body for streaming');
      const reader = res.body.getReader();
      let decoder = new TextDecoder();
      let fullText = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        fullText += chunk;
        onData(fullText);
      }
      if (onDone) onDone(fullText);
    } catch (error) {
      console.error('Groq API Stream Error:', error);
      if (onError) onError(error);
    }
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
      let answer = data.answer;
      let isTrueWisdom = false;
      if (typeof answer === 'string' && /where wisdom begins/i.test(answer)) {
        answer = answer.replace(/where wisdom begins/gi, 'Where True Wisdom Begins');
        isTrueWisdom = true;
      }
      // Add the question at the top of the answer
      if (typeof answer === 'string') {
        answer = `Q: ${question}\n\n${answer}`;
      }
      return {
        question,
        answer,
        references: data.references || [],
        error: data.error,
        ...(isTrueWisdom ? { isTrueWisdom: true } : {}),
      };
    } catch (error) {
      console.error('Groq API Error:', error);
      return {
        question,
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
      let answer = data.answer;
      let isTrueWisdom = false;
      if (typeof answer === 'string' && /where wisdom begins/i.test(answer)) {
        answer = answer.replace(/where wisdom begins/gi, 'Where True Wisdom Begins');
        isTrueWisdom = true;
      }
      // Add the question at the top of the answer
      if (typeof answer === 'string') {
        answer = `Q: ${reference}\n\n${answer}`;
      }
      return {
        question: reference,
        answer,
        references: data.references || [reference],
        error: data.error,
        ...(isTrueWisdom ? { isTrueWisdom: true } : {}),
      };
    } catch (error) {
      console.error('Groq API Error:', error);
      return {
        question: reference,
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
      let answer = data.answer;
      let isTrueWisdom = false;
      if (typeof answer === 'string' && /where wisdom begins/i.test(answer)) {
        answer = answer.replace(/where wisdom begins/gi, 'Where True Wisdom Begins');
        isTrueWisdom = true;
      }
      // Add the question at the top of the answer
      if (typeof answer === 'string') {
        answer = `Q: daily\n\n${answer}`;
      }
      return {
        question: 'daily',
        answer,
        references: data.references || [],
        error: data.error,
        ...(isTrueWisdom ? { isTrueWisdom: true } : {}),
      };
    } catch (error) {
      console.error('Groq API Error:', error);
      return {
        question: 'daily',
        answer: 'Sorry, I could not generate a daily reading at this time.',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

export default GroqBibleService.getInstance();
