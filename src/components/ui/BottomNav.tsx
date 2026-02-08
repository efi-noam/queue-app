'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface BottomNavProps {
  slug: string;
  theme?: string; // 'light' | 'dark' | 'ocean' | 'sunset' | 'forest' | 'rose' | 'modern'
}

// Theme configurations for nav
const navThemes: Record<string, { navBg: string; navBorder: string; textMuted: string; accentText: string; glowColor: string; gradientFrom: string }> = {
  light: {
    navBg: 'bg-white/90',
    navBorder: 'border-gray-100',
    textMuted: 'text-gray-500',
    accentText: 'text-blue-600',
    glowColor: 'bg-blue-500/20',
    gradientFrom: 'from-white',
  },
  dark: {
    navBg: 'bg-gray-900/90',
    navBorder: 'border-white/10',
    textMuted: 'text-gray-400',
    accentText: 'text-cyan-400',
    glowColor: 'bg-purple-500/20',
    gradientFrom: 'from-gray-950',
  },
  ocean: {
    navBg: 'bg-white/90',
    navBorder: 'border-cyan-100',
    textMuted: 'text-gray-500',
    accentText: 'text-cyan-600',
    glowColor: 'bg-cyan-500/20',
    gradientFrom: 'from-white',
  },
  sunset: {
    navBg: 'bg-white/90',
    navBorder: 'border-orange-100',
    textMuted: 'text-gray-500',
    accentText: 'text-orange-600',
    glowColor: 'bg-orange-500/20',
    gradientFrom: 'from-white',
  },
  forest: {
    navBg: 'bg-white/90',
    navBorder: 'border-emerald-100',
    textMuted: 'text-gray-500',
    accentText: 'text-emerald-600',
    glowColor: 'bg-emerald-500/20',
    gradientFrom: 'from-white',
  },
  rose: {
    navBg: 'bg-white/90',
    navBorder: 'border-pink-100',
    textMuted: 'text-gray-500',
    accentText: 'text-pink-600',
    glowColor: 'bg-pink-500/20',
    gradientFrom: 'from-white',
  },
  modern: {
    navBg: 'bg-white/90',
    navBorder: 'border-gray-200',
    textMuted: 'text-gray-500',
    accentText: 'text-indigo-600',
    glowColor: 'bg-indigo-500/20',
    gradientFrom: 'from-white',
  },
};

export function BottomNav({ slug, theme = 'light' }: BottomNavProps) {
  const pathname = usePathname();
  const t = navThemes[theme] || navThemes.light;
  
  const isHome = pathname === `/${slug}`;
  const isBook = pathname === `/${slug}/book`;
  const isAppointments = pathname === `/${slug}/my-appointments`;

  const links = [
    {
      href: `/${slug}/my-appointments`,
      label: 'התורים שלי',
      isActive: isAppointments,
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
        </svg>
      ),
    },
    {
      href: `/${slug}`,
      label: 'דף עסק',
      isActive: isHome,
      icon: (
        <svg className="w-6 h-6" fill={isHome ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={isHome ? 0.5 : 1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" />
        </svg>
      ),
    },
    {
      href: `/${slug}/book`,
      label: 'הזמן תור',
      isActive: isBook,
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
        </svg>
      ),
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50">
      <div className={`absolute bottom-full left-0 right-0 h-16 bg-gradient-to-t ${t.gradientFrom} to-transparent pointer-events-none`} />
      
      <div className={`${t.navBg} backdrop-blur-xl border-t ${t.navBorder} shadow-lg`}>
        <div className="flex justify-around items-center max-w-md mx-auto py-3 px-4">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center gap-1 py-2 px-4 transition-colors ${
                link.isActive ? t.accentText : `${t.textMuted}`
              }`}
            >
              {link.isActive ? (
                <div className="relative">
                  <div className={`absolute inset-0 ${t.glowColor} rounded-full blur-md`} />
                  <div className="relative">{link.icon}</div>
                </div>
              ) : (
                link.icon
              )}
              <span className={`text-xs ${link.isActive ? 'font-semibold' : 'font-medium'}`}>
                {link.label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
