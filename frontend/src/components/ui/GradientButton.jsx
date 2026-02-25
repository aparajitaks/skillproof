/**
 * Gradient Button Component
 * Animated gradient button with loading state
 */
import { forwardRef } from 'react';
import { motion } from 'framer-motion';

const GradientButton = forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  ...props
}, ref) => {
  const variants = {
    primary: 'from-primary via-purple-500 to-pink-500',
    secondary: 'from-gray-600 via-gray-500 to-gray-600',
    success: 'from-emerald-500 via-green-500 to-teal-500',
    danger: 'from-red-500 via-rose-500 to-pink-500',
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-sm',
    lg: 'px-8 py-4 text-base',
  };

  return (
    <motion.button
      ref={ref}
      disabled={disabled || loading}
      whileHover={!disabled && !loading ? { scale: 1.02, y: -2 } : undefined}
      whileTap={!disabled && !loading ? { scale: 0.98 } : undefined}
      className={`
        relative group overflow-hidden
        ${sizes[size]}
        rounded-xl font-medium
        text-white
        transition-all duration-300
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
      {...props}
    >
      {/* Animated gradient background */}
      <div className={`
        absolute inset-0 bg-gradient-to-r ${variants[variant]}
        bg-[length:200%_100%]
        animate-gradient-x
      `} />

      {/* Shine effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
      </div>

      {/* Glow effect */}
      <div className={`
        absolute -inset-1 bg-gradient-to-r ${variants[variant]}
        opacity-0 group-hover:opacity-50 
        blur-lg transition-opacity duration-300
        -z-10
      `} />

      {/* Content */}
      <span className="relative z-10 flex items-center justify-center gap-2">
        {loading ? (
          <>
            <LoadingSpinner />
            <span>Processing...</span>
          </>
        ) : children}
      </span>
    </motion.button>
  );
});

// Loading Spinner Component
const LoadingSpinner = () => (
  <svg 
    className="animate-spin h-4 w-4" 
    xmlns="http://www.w3.org/2000/svg" 
    fill="none" 
    viewBox="0 0 24 24"
  >
    <circle 
      className="opacity-25" 
      cx="12" 
      cy="12" 
      r="10" 
      stroke="currentColor" 
      strokeWidth="4"
    />
    <path 
      className="opacity-75" 
      fill="currentColor" 
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

GradientButton.displayName = 'GradientButton';

export default GradientButton;
