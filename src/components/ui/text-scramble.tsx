
import React, { useEffect, useState, useRef } from 'react';

interface TextScrambleProps {
  texts: string[];
  className?: string;
  speed?: number;
  pauseTime?: number;
}

export function TextScramble({ 
  texts, 
  className = "", 
  speed = 50,
  pauseTime = 2000
}: TextScrambleProps) {
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [currentText, setCurrentText] = useState('');
  const [phase, setPhase] = useState<'scramble' | 'show' | 'pause'>('show');
  const [counter, setCounter] = useState(0);
  const animationFrameRef = useRef<number | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const chars = '!<>-_\\/[]{}—=+*^?#abcdefghijklmnopqrstuvwxyz';

  useEffect(() => {
    // Set initial text right away
    if (currentText === '' && texts.length > 0) {
      setCurrentText(texts[0] || '');
    }

    const updateAnimation = () => {
      if (phase === 'pause') {
        setCounter(c => c + 1);
        if (counter > pauseTime / speed) {
          setPhase('scramble');
          setCounter(0);
        }
      } else if (phase === 'scramble') {
        if (currentText.length === 0) {
          setCurrentTextIndex((currentTextIndex + 1) % texts.length);
          setPhase('show');
        } else {
          const updatedText = currentText.substring(0, currentText.length - 1);
          const randomChar = chars[Math.floor(Math.random() * chars.length)];
          setCurrentText(updatedText + randomChar);
          setCounter(counter + 1);
          
          if (counter > 10) {
            setCurrentText(updatedText);
            setCounter(0);
          }
        }
      } else if (phase === 'show') {
        const nextText = texts[currentTextIndex] || '';
        if (currentText === nextText) {
          setPhase('pause');
          setCounter(0);
        } else {
          let updatedText = '';
          const targetLength = Math.min(currentText.length + 1, nextText.length);
          
          for (let i = 0; i < targetLength; i++) {
            if (i >= currentText.length) {
              updatedText += nextText[i];
            } else if (currentText[i] !== nextText[i] && Math.random() < 0.1) {
              updatedText += nextText[i];
            } else if (currentText[i] !== nextText[i]) {
              updatedText += chars[Math.floor(Math.random() * chars.length)];
            } else {
              updatedText += currentText[i];
            }
          }
          
          setCurrentText(updatedText);
        }
      }
    };

    timeoutRef.current = setTimeout(() => {
      animationFrameRef.current = requestAnimationFrame(() => {
        updateAnimation();
      });
    }, speed);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [currentText, currentTextIndex, phase, counter, texts, speed, pauseTime]);

  return <div className={className}>{currentText}</div>;
}
