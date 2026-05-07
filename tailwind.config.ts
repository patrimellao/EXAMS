import type { Config } from "tailwindcss"

const config = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
  	container: {
  		center: true,
  		padding: '2rem',
  		screens: {
  			'2xl': '1400px'
  		}
  	},
  	extend: {
  		colors: {
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			success: {
  				DEFAULT: 'hsl(var(--success))',
  				foreground: 'hsl(var(--success-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			'brand-primary': 'hsl(var(--brand-primary))',
  			'brand-cool': 'hsl(var(--brand-cool))',
  			'brand-warm': 'hsl(var(--brand-warm))',
  			'brand-flame': 'hsl(var(--brand-flame))',
  			'brand-xp': 'hsl(var(--brand-xp))',
  			'brand-success': 'hsl(var(--brand-success))'
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)',
  			card: '0.75rem',
  			hero: '1rem',
  			pill: '9999px'
  		},
  		fontFamily: {
  			reader: ['var(--font-reader)', 'Charter', 'Iowan Old Style', 'Georgia', 'serif']
  		},
  		boxShadow: {
  			card: 'var(--shadow-card)',
  			'card-hover': 'var(--shadow-card-hover)',
  			popover: 'var(--shadow-popover)',
  			modal: 'var(--shadow-modal)'
  		},
  		transitionDuration: {
  			fast: 'var(--duration-fast)',
  			normal: 'var(--duration-normal)',
  			slow: 'var(--duration-slow)'
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			},
  			'wiggle': {
  				'0%, 100%': {
  					transform: 'rotate(-3deg)'
  				},
  				'50%': {
  					transform: 'rotate(3deg)'
  				}
  			},
  			'xp-bump': {
  				'0%, 100%': { transform: 'scale(1)' },
  				'50%': { transform: 'scale(1.08)' }
  			},
  			'streak-flame': {
  				'0%, 100%': { transform: 'translateY(0) rotate(-2deg)' },
  				'50%': { transform: 'translateY(-2px) rotate(3deg)' }
  			},
  			'achievement-pop': {
  				'0%': { transform: 'scale(0.6)', opacity: '0' },
  				'60%': { transform: 'scale(1.05)', opacity: '1' },
  				'100%': { transform: 'scale(1)' }
  			},
  			'gradient-shift': {
  				'0%, 100%': { 'background-position': '0% 50%' },
  				'50%': { 'background-position': '100% 50%' }
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out',
  			wiggle: 'wiggle 1s ease-in-out infinite',
  			'xp-bump': 'xp-bump 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
  			'streak-flame': 'streak-flame 1.6s ease-in-out infinite',
  			'achievement-pop': 'achievement-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
  			'gradient-shift': 'gradient-shift 8s ease-in-out infinite'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config