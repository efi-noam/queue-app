import { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'gradient';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fullWidth?: boolean;
  loading?: boolean;
  icon?: ReactNode;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  icon,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles = `
    inline-flex items-center justify-center gap-2 font-semibold rounded-2xl 
    transition-all duration-200 ease-out
    focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/30
    disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
    btn-press
  `;
  
  const variants = {
    primary: `
      bg-gradient-to-r from-blue-500 to-blue-600 text-white
      hover:from-blue-600 hover:to-blue-700
      shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30
      active:shadow-md
    `,
    secondary: `
      bg-white text-gray-700 border border-gray-200
      hover:bg-gray-50 hover:border-gray-300
      shadow-sm hover:shadow-md
    `,
    outline: `
      border-2 border-blue-500 text-blue-600 bg-transparent
      hover:bg-blue-50
    `,
    ghost: `
      text-gray-600 bg-transparent
      hover:bg-gray-100
    `,
    gradient: `
      bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white
      hover:from-blue-600 hover:via-purple-600 hover:to-pink-600
      shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30
      active:shadow-md
    `,
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
    xl: 'px-10 py-5 text-xl',
  };

  return (
    <button
      className={`
        ${baseStyles} 
        ${variants[variant]} 
        ${sizes[size]} 
        ${fullWidth ? 'w-full' : ''} 
        ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle 
              className="opacity-25" 
              cx="12" cy="12" r="10" 
              stroke="currentColor" 
              strokeWidth="4" 
              fill="none" 
            />
            <path 
              className="opacity-75" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" 
            />
          </svg>
          <span>טוען...</span>
        </>
      ) : (
        <>
          {icon && <span className="flex-shrink-0">{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
}
