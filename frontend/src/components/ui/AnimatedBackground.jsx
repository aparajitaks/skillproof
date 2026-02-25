/**
 * Animated Background Gradient
 * Creates a subtle animated mesh gradient background
 */
import { memo } from 'react';

const AnimatedBackground = memo(() => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-base via-surface to-base" />
      
      {/* Animated gradient orbs */}
      <div 
        className="absolute -top-[40%] -left-[20%] w-[70%] h-[70%] rounded-full opacity-30 blur-[120px] animate-pulse"
        style={{
          background: 'radial-gradient(circle, rgba(99,102,241,0.4) 0%, transparent 70%)',
          animation: 'float 8s ease-in-out infinite',
        }}
      />
      <div 
        className="absolute -bottom-[30%] -right-[20%] w-[60%] h-[60%] rounded-full opacity-20 blur-[100px]"
        style={{
          background: 'radial-gradient(circle, rgba(168,85,247,0.4) 0%, transparent 70%)',
          animation: 'float 10s ease-in-out infinite reverse',
        }}
      />
      <div 
        className="absolute top-[20%] right-[10%] w-[40%] h-[40%] rounded-full opacity-15 blur-[80px]"
        style={{
          background: 'radial-gradient(circle, rgba(6,182,212,0.3) 0%, transparent 70%)',
          animation: 'float 12s ease-in-out infinite',
        }}
      />
      
      {/* Noise overlay for texture */}
      <div 
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
});

AnimatedBackground.displayName = 'AnimatedBackground';

export default AnimatedBackground;
