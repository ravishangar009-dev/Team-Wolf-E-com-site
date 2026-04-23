import { useRef, useCallback } from 'react';

// Web Audio API based notification sound
export const useOrderSound = () => {
  const audioContextRef = useRef<AudioContext | null>(null);

  const playNotificationSound = useCallback(() => {
    try {
      // Create audio context on first use (browser requirement)
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      const ctx = audioContextRef.current;
      const now = ctx.currentTime;

      // Create a pleasant notification sound (two-tone bell)
      const playTone = (frequency: number, startTime: number, duration: number) => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(frequency, startTime);

        // Envelope: quick attack, sustain, decay
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.02);
        gainNode.gain.setValueAtTime(0.3, startTime + duration * 0.6);
        gainNode.gain.linearRampToValueAtTime(0, startTime + duration);

        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      };

      // Play two ascending tones for a pleasant "ding-ding" effect
      playTone(880, now, 0.15); // A5
      playTone(1108.73, now + 0.15, 0.2); // C#6
      playTone(1318.51, now + 0.35, 0.25); // E6
    } catch (error) {
      console.log('Audio playback failed:', error);
    }
  }, []);

  return { playNotificationSound };
};
