
import { useEffect, useState } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

export const useLatex = () => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const load = async () => {
      // katex is already imported; just mark ready
      setReady(true);
    };
    load();
  }, []);

  const render = (math: string, options?: object) => {
    if (!ready) return '';
    try {
      return katex.renderToString(math, { ...options, throwOnError: false });
    } catch {
      return math;
    }
  };

  return { render, ready };
};
