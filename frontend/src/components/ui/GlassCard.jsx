/**
 * Glass Card Component
 * Modern glassmorphism card with subtle animations
 */
import { motion } from 'framer-motion';
import { forwardRef } from 'react';

const GlassCard = forwardRef(({ 
  children, 
  className = '', 
  hover = true,
  glow = false,
  ...props 
}, ref) => {
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={hover ? { 
        y: -4,
        transition: { duration: 0.2 }
      } : undefined}
      className={`
        relative overflow-hidden rounded-2xl
        bg-surface/60 backdrop-blur-xl
        border border-white/5
        ${glow ? 'shadow-glow' : 'shadow-glass'}
        ${hover ? 'transition-shadow duration-300 hover:shadow-glow hover:border-primary/20' : ''}
        ${className}
      `}
      {...props}
    >
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
});

GlassCard.displayName = 'GlassCard';

export default GlassCard;
