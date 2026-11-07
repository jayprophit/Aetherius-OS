import React, { useEffect, useRef } from 'react';

/**
 * Genesis Avatar — 2D canvas renderer for the Genesis Human agent.
 *
 * Abstracts the event model of the Genesis-Human prototype's tkinter
 * renderer (IDLE / LISTENING / THINKING / SPEAKING + emotion + viseme +
 * gaze + gesture) into a web canvas. It is a lightweight rendered avatar,
 * not a diffusion video model.
 */

export type AvatarState = 'IDLE' | 'LISTENING' | 'THINKING' | 'SPEAKING';

export type AvatarEmotion = 'neutral' | 'happy' | 'concerned' | 'thinking' | 'surprised' | 'confident';

export interface AvatarFrame {
  state: AvatarState;
  emotion: AvatarEmotion;
  viseme: string;
  gesture: string;
  intensity: number;
}

const EXPRESSION_COLOURS: Record<AvatarEmotion, string> = {
  neutral: '#e0dcd3',
  happy: '#ffe0b2',
  concerned: '#ffcdd2',
  thinking: '#bbdefb',
  surprised: '#fff9c4',
  confident: '#c8e6c9',
};

const VISIBLE_VISEMES = new Set(['A', 'E', 'I', 'O', 'U']);

export const GenesisAvatar: React.FC<{ frame: AvatarFrame; label?: string }> = ({ frame, label = 'Genesis avatar' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(frame);
  frameRef.current = frame;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let last = performance.now();

    const draw = (now: number) => {
      const current = frameRef.current;
      const width = canvas.width;
      const height = canvas.height;
      const centreX = width / 2;
      const faceW = width * 0.34;
      const faceH = height * 0.42;
      const faceY = height * 0.42;
      const breath = Math.sin(now / 700) * height * 0.006;

      ctx.clearRect(0, 0, width, height);

      // Backdrop (dark stage).
      const gradient = ctx.createRadialGradient(centreX, height * 0.45, 20, centreX, height * 0.45, width * 0.55);
      gradient.addColorStop(0, '#2a2a48');
      gradient.addColorStop(1, '#101024');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Face.
      const skin = EXPRESSION_COLOURS[current.emotion] ?? EXPRESSION_COLOURS.neutral;
      const radiusX = faceW / 2;
      const radiusY = faceH / 2;
      ctx.beginPath();
      ctx.ellipse(centreX, faceY + breath, radiusX, radiusY, 0, 0, Math.PI * 2);
      ctx.fillStyle = skin;
      ctx.fill();
      ctx.strokeStyle = '#3a3a32';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Eyes (gaze follows state: left for listening, right for speaking).
      const gazeOffset = current.state === 'LISTENING' ? -width * 0.05 : current.state === 'SPEAKING' ? width * 0.05 : 0;
      const eyeY = faceY - height * 0.05 + breath;
      const eyeW = width * 0.045;
      const eyeH = height * 0.045;
      for (const side of [-1, 1]) {
        const eyeX = centreX + side * width * 0.075 + gazeOffset;
        ctx.beginPath();
        ctx.ellipse(eyeX, eyeY, eyeW, eyeH, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.strokeStyle = '#444';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(eyeX + gazeOffset * 0.4, eyeY, eyeH * 0.45, 0, Math.PI * 2);
        ctx.fillStyle = '#222';
        ctx.fill();
      }

      // Mouth (viseme-driven opening while speaking).
      const mouthY = faceY + height * 0.16 + breath;
      const mouthOpen = current.state === 'SPEAKING' && VISIBLE_VISEMES.has(current.viseme)
        ? height * (0.02 + current.intensity * 0.03)
        : height * 0.008;
      ctx.beginPath();
      ctx.ellipse(centreX, mouthY, width * 0.05, mouthOpen, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#2e1a2e';
      ctx.fill();
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Brows for thinking/concerned.
      if (current.emotion === 'concerned' || current.emotion === 'thinking') {
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(centreX - width * 0.11, eyeY - height * 0.07);
        ctx.lineTo(centreX - width * 0.04, eyeY - height * 0.04);
        ctx.moveTo(centreX + width * 0.11, eyeY - height * 0.07);
        ctx.lineTo(centreX + width * 0.04, eyeY - height * 0.04);
        ctx.stroke();
      }

      // Status + gesture text.
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${Math.round(height * 0.05)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(current.state, centreX, height * 0.82);
      if (current.gesture) {
        ctx.fillStyle = '#88ccff';
        ctx.font = `${Math.round(height * 0.035)}px sans-serif`;
        ctx.fillText(current.gesture, centreX, height * 0.9);
      }

      last = now;
      void last;
      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={480}
      height={360}
      className="w-full h-full"
      role="img"
      aria-label={label}
    />
  );
};
