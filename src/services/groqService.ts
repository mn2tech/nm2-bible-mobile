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
   * Streams a Bible answer from the backend over a WebSocket connection.
   * The `onData` callback receives incremental chunks as they arrive.
   * Returns a cleanup function that should be called to close the
   * connection when the component unmounts.
   */
  streamBibleAnswer(
    question: string,
    onData: (partial: string) => void,
    onDone?: (full: string) => void,
    onError?: (err: any) => void
  ): () => void {
    // Convert http(s):// to ws(s):// for WebSocket endpoint
    const wsUrl = API_URL.replace(/^http/, 'ws') + '/stream';
    const socket = new WebSocket(wsUrl);
    let fullText = '';

    socket.onopen = () => {
      // Send the question to initiate streaming on the backend
      socket.send(JSON.stringify({ question }));
    };

    socket.onmessage = (event) => {
      const chunk = typeof event.data === 'string' ? event.data : '';
      fullText += chunk;
      onData(fullText);
    };

    socket.onerror = (event) => {
      console.error('Groq API Stream Error:', event);
      if (onError) onError(event);
      socket.close();
    };

    socket.onclose = () => {
      if (onDone) onDone(fullText);
    };

    // Return cleanup function
    return () => {
      if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
        socket.close();
      }
    };
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
