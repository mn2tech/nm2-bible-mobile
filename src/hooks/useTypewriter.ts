import { useEffect, useRef, useState } from 'react';

// Simple typewriter hook: reveals `text` one character at a time.
// Returns the current typed string, a boolean `running`, and a `skip` function to complete immediately.
export default function useTypewriter(text: string, speed = 20) {
  const [typed, setTyped] = useState('');
  const [running, setRunning] = useState(false);
  const [cursor, setCursor] = useState(true);
  const idxRef = useRef(0);
  const timerRef = useRef<number | null>(null);
  const cursorRef = useRef<number | null>(null);
  const lastTextRef = useRef(text);

  useEffect(() => {
    // if text changed, reset
    if (text === lastTextRef.current) return;
    lastTextRef.current = text;
    if (!text) {
      setTyped('');
      setRunning(false);
      idxRef.current = 0;
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      return;
    }

    // start typing
    setTyped('');
    idxRef.current = 0;
    setRunning(true);
  setCursor(true);

    // safety: if speed <= 0 just set immediately
    if (speed <= 0) {
      setTyped(text);
      setRunning(false);
      return;
    }

    timerRef.current = setInterval(() => {
      idxRef.current += 1;
      const next = text.slice(0, idxRef.current);
      setTyped(next);
      if (idxRef.current >= text.length) {
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
        setRunning(false);
        setCursor(false);
      }
    }, speed) as unknown as number;

    // start cursor blinking interval
    cursorRef.current = setInterval(() => {
      setCursor(c => !c);
    }, 500) as unknown as number;

    return () => {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  if (cursorRef.current) { clearInterval(cursorRef.current); cursorRef.current = null; }
    };
  }, [text, speed]);

  const skip = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    setTyped(text);
    setRunning(false);
    setCursor(false);
  };

  return { typed, running, skip, cursor };
}
