/**
 * Floating Label Input Component
 * Premium input with animated floating label
 */
import { useState, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const FloatingInput = forwardRef(({
  label,
  type = 'text',
  error,
  icon: Icon,
  className = '',
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(!!props.value || !!props.defaultValue);

  const handleFocus = (e) => {
    setIsFocused(true);
    props.onFocus?.(e);
  };

  const handleBlur = (e) => {
    setIsFocused(false);
    props.onBlur?.(e);
  };

  const handleChange = (e) => {
    setHasValue(e.target.value.length > 0);
    props.onChange?.(e);
  };

  const isActive = isFocused || hasValue;

  return (
    <div className={`relative ${className}`}>
      <div className="relative group">
        {/* Icon */}
        {Icon && (
          <div className={`
            absolute left-4 top-1/2 -translate-y-1/2 
            transition-colors duration-200
            ${isFocused ? 'text-primary' : 'text-muted'}
          `}>
            <Icon size={18} />
          </div>
        )}

        {/* Input */}
        <input
          ref={ref}
          type={type}
          className={`
            w-full px-4 py-4 
            ${Icon ? 'pl-12' : 'pl-4'}
            bg-surface/50 
            border border-white/10
            rounded-xl
            text-white text-sm
            placeholder-transparent
            transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50
            hover:border-white/20
            ${error ? 'border-red-500/50 focus:ring-red-500/30' : ''}
          `}
          placeholder={label}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChange={handleChange}
          {...props}
        />

        {/* Floating Label */}
        <motion.label
          initial={false}
          animate={{
            y: isActive ? -28 : 0,
            x: isActive ? (Icon ? -32 : 0) : 0,
            scale: isActive ? 0.85 : 1,
            color: isFocused ? 'rgb(99, 102, 241)' : error ? 'rgb(239, 68, 68)' : 'rgb(107, 114, 128)',
          }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className={`
            absolute left-4 top-1/2 -translate-y-1/2
            ${Icon ? 'left-12' : 'left-4'}
            text-sm pointer-events-none
            origin-left
          `}
        >
          {label}
        </motion.label>

        {/* Focus glow */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: isFocused ? 1 : 0 }}
          transition={{ duration: 0.2 }}
          className="absolute -inset-[1px] rounded-xl bg-gradient-to-r from-primary/20 via-purple-500/20 to-cyan-500/20 -z-10 blur-sm"
        />
      </div>

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-2 text-xs text-red-400 flex items-center gap-1"
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
});

FloatingInput.displayName = 'FloatingInput';

export default FloatingInput;
