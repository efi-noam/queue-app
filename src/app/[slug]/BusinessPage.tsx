'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { BottomNav } from '@/components/ui/BottomNav';
import type { Business, Service, GalleryImage } from '@/types/database';

interface BusinessPageProps {
  business: Business;
  services: Service[];
  gallery: GalleryImage[];
}

// Theme configurations
const themes = {
  light: {
    bg: 'bg-gradient-to-b from-gray-50 via-white to-gray-50',
    cardBg: 'bg-white',
    cardBorder: 'border-gray-100',
    text: 'text-gray-900',
    textMuted: 'text-gray-500',
    accent: 'from-blue-500 to-indigo-600',
    accentText: 'text-blue-600',
    accentBg: 'bg-blue-50',
    buttonBg: 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700',
    navBg: 'bg-white/90',
    navBorder: 'border-gray-100',
    glowColor: 'bg-blue-500/20',
  },
  dark: {
    bg: 'bg-gray-950',
    cardBg: 'bg-white/10',
    cardBorder: 'border-white/10',
    text: 'text-white',
    textMuted: 'text-gray-400',
    accent: 'from-purple-500 to-cyan-500',
    accentText: 'text-cyan-400',
    accentBg: 'bg-cyan-500/10',
    buttonBg: 'bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500',
    navBg: 'bg-gray-900/90',
    navBorder: 'border-white/10',
    glowColor: 'bg-purple-500/20',
  },
  ocean: {
    bg: 'bg-gradient-to-b from-cyan-50 via-white to-blue-50',
    cardBg: 'bg-white',
    cardBorder: 'border-cyan-100',
    text: 'text-gray-900',
    textMuted: 'text-gray-500',
    accent: 'from-cyan-500 to-blue-600',
    accentText: 'text-cyan-600',
    accentBg: 'bg-cyan-50',
    buttonBg: 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700',
    navBg: 'bg-white/90',
    navBorder: 'border-cyan-100',
    glowColor: 'bg-cyan-500/20',
  },
  sunset: {
    bg: 'bg-gradient-to-b from-orange-50 via-white to-pink-50',
    cardBg: 'bg-white',
    cardBorder: 'border-orange-100',
    text: 'text-gray-900',
    textMuted: 'text-gray-500',
    accent: 'from-orange-500 to-pink-600',
    accentText: 'text-orange-600',
    accentBg: 'bg-orange-50',
    buttonBg: 'bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700',
    navBg: 'bg-white/90',
    navBorder: 'border-orange-100',
    glowColor: 'bg-orange-500/20',
  },
  forest: {
    bg: 'bg-gradient-to-b from-emerald-50 via-white to-green-50',
    cardBg: 'bg-white',
    cardBorder: 'border-emerald-100',
    text: 'text-gray-900',
    textMuted: 'text-gray-500',
    accent: 'from-emerald-500 to-green-600',
    accentText: 'text-emerald-600',
    accentBg: 'bg-emerald-50',
    buttonBg: 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700',
    navBg: 'bg-white/90',
    navBorder: 'border-emerald-100',
    glowColor: 'bg-emerald-500/20',
  },
  rose: {
    bg: 'bg-gradient-to-b from-pink-50 via-white to-rose-50',
    cardBg: 'bg-white',
    cardBorder: 'border-pink-100',
    text: 'text-gray-900',
    textMuted: 'text-gray-500',
    accent: 'from-pink-400 to-rose-500',
    accentText: 'text-pink-600',
    accentBg: 'bg-pink-50',
    buttonBg: 'bg-gradient-to-r from-pink-400 to-rose-500 hover:from-pink-500 hover:to-rose-600',
    navBg: 'bg-white/90',
    navBorder: 'border-pink-100',
    glowColor: 'bg-pink-500/20',
  },
  modern: {
    bg: 'bg-gray-950',
    cardBg: 'bg-white/5',
    cardBorder: 'border-white/10',
    text: 'text-white',
    textMuted: 'text-gray-400',
    accent: 'from-violet-500 via-purple-500 to-fuchsia-500',
    accentText: 'text-violet-400',
    accentBg: 'bg-violet-500/10',
    buttonBg: 'bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 hover:from-violet-500 hover:via-purple-500 hover:to-fuchsia-500',
    navBg: 'bg-gray-950/95',
    navBorder: 'border-white/5',
    glowColor: 'bg-violet-500/30',
  },
};

export function BusinessPage({ business, gallery }: BusinessPageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const theme = themes[business.theme as keyof typeof themes] || themes.light;
  const isDark = business.theme === 'dark' || business.theme === 'modern';
  const isModern = business.theme === 'modern';

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: business.name,
        text: `הזמן תור ב${business.name}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('הקישור הועתק!');
    }
  };

  return (
    <div className={`min-h-screen ${theme.bg} ${isDark ? 'text-white' : ''} overflow-x-hidden`}>
      {/* Animated Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className={`absolute -top-40 -right-40 w-80 h-80 ${theme.glowColor} rounded-full blur-[100px] animate-pulse`} />
        <div className={`absolute -bottom-40 -left-40 w-80 h-80 ${theme.glowColor} rounded-full blur-[100px] animate-pulse`} style={{ animationDelay: '1s' }} />
        
        {/* Modern theme special effects - floating particles */}
        {isModern && (
          <>
            <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-violet-400 rounded-full animate-float opacity-60" style={{ animationDuration: '6s' }} />
            <div className="absolute top-1/3 right-1/3 w-3 h-3 bg-fuchsia-400 rounded-full animate-float opacity-40" style={{ animationDuration: '8s', animationDelay: '1s' }} />
            <div className="absolute top-1/2 left-1/5 w-2 h-2 bg-purple-400 rounded-full animate-float opacity-50" style={{ animationDuration: '7s', animationDelay: '2s' }} />
            <div className="absolute bottom-1/3 right-1/4 w-4 h-4 bg-violet-300 rounded-full animate-float opacity-30" style={{ animationDuration: '9s', animationDelay: '0.5s' }} />
            <div className="absolute top-2/3 left-2/3 w-2 h-2 bg-fuchsia-300 rounded-full animate-float opacity-50" style={{ animationDuration: '5s', animationDelay: '3s' }} />
            
            {/* Animated gradient orbs */}
            <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-gradient-to-br from-violet-600/20 to-fuchsia-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
            <div className="absolute bottom-1/4 left-1/3 w-48 h-48 bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '2s' }} />
          </>
        )}
      </div>

      {/* Hero Section */}
      <header className="relative">
        {/* Cover Image */}
        <div className="h-64 sm:h-80 relative overflow-hidden">
          {business.cover_image_url ? (
            <Image
              src={business.cover_image_url}
              alt={business.name}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className={`absolute inset-0 bg-gradient-to-br ${theme.accent}`} />
          )}
          
          {/* Overlay */}
          <div className={`absolute inset-0 ${isDark ? 'bg-gray-950/60' : 'bg-black/30'}`} />
          
          {/* Bottom fade */}
          <div className={`absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t ${isDark ? 'from-gray-950' : 'from-white'} to-transparent`} />
        </div>

        {/* Logo */}
        <div className="absolute left-1/2 -translate-x-1/2 -bottom-16 z-10">
          <div 
            className={`transition-all duration-700 ${isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}
          >
            <div className="relative group">
              {/* Glow */}
              <div className={`absolute inset-0 bg-gradient-to-r ${theme.accent} rounded-full blur-xl opacity-50 scale-110 group-hover:opacity-70 transition-opacity`} />
              
              {/* Logo container */}
              <div className={`relative w-32 h-32 rounded-full ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-2xl border-4 ${isDark ? 'border-gray-700' : 'border-white'} overflow-hidden`}>
                {business.logo_url ? (
                  <Image
                    src={business.logo_url}
                    alt={`${business.name} logo`}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${theme.accent}`}>
                    <span className="text-5xl font-black text-white">
                      {business.name.charAt(0)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="relative z-10 px-4 pt-20 pb-32">
        {/* Business Info */}
        <div 
          className={`text-center mb-8 transition-all duration-700 delay-200 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}
        >
          <h1 className={`text-3xl sm:text-4xl font-black ${theme.text}`}>
            {business.name}
          </h1>
          
          {business.address && (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(business.address)}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`mt-2 ${theme.textMuted} hover:${theme.accentText} flex items-center justify-center gap-2 transition-colors`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="underline underline-offset-2">{business.address}</span>
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          )}
        </div>

        {/* CTA Card */}
        <div 
          className={`max-w-md mx-auto transition-all duration-700 delay-300 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}
        >
          <div className={`${theme.cardBg} ${isDark ? 'backdrop-blur-xl' : ''} rounded-3xl border ${theme.cardBorder} p-6 shadow-xl`}>
            {/* Book button */}
            <Link href={`/${business.slug}/book`} className="block">
              {isModern ? (
                <div className="relative group">
                  {/* Animated gradient border for modern theme */}
                  <div className="absolute -inset-1 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-violet-600 rounded-2xl blur opacity-70 group-hover:opacity-100 transition-opacity animate-gradient-x" />
                  <button className="relative w-full bg-gray-900 text-white rounded-2xl py-4 px-6 flex items-center justify-center gap-3 font-bold text-lg shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    הזמן תור עכשיו
                  </button>
                </div>
              ) : (
                <button className={`w-full ${theme.buttonBg} text-white rounded-2xl py-4 px-6 flex items-center justify-center gap-3 font-bold text-lg shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]`}>
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  הזמן תור עכשיו
                </button>
              )}
            </Link>

            {/* Quick actions */}
            <div className="mt-4 flex gap-3">
              {business.phone && (
                <a
                  href={`tel:${business.phone}`}
                  className={`flex-1 ${theme.accentBg} ${theme.accentText} rounded-xl py-3 flex items-center justify-center gap-2 transition-all hover:scale-105 font-medium`}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  התקשר
                </a>
              )}
              
              {business.whatsapp && (
                <a
                  href={`https://wa.me/${business.whatsapp.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-green-50 text-green-600 rounded-xl py-3 flex items-center justify-center gap-2 transition-all hover:scale-105 font-medium"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  וואטסאפ
                </a>
              )}
              
              <button
                onClick={handleShare}
                className={`flex-1 ${isDark ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-600'} rounded-xl py-3 flex items-center justify-center gap-2 transition-all hover:scale-105 font-medium`}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                שתף
              </button>
            </div>

            {/* Social Links */}
            {(business.instagram || business.facebook || business.address) && (
              <div className="mt-4 flex justify-center gap-4">
                {business.address && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(business.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center transition-all hover:scale-110 shadow-lg"
                    title="פתח במפות"
                  >
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </a>
                )}
                {business.instagram && (
                  <a
                    href={`https://instagram.com/${business.instagram.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center transition-all hover:scale-110 shadow-lg"
                    title="אינסטגרם"
                  >
                    <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  </a>
                )}
                {business.facebook && (
                  <a
                    href={`https://facebook.com/${business.facebook}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center transition-all hover:scale-110 shadow-lg"
                    title="פייסבוק"
                  >
                    <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        {/* About Section */}
        {business.description && (
          <section 
            className={`max-w-md mx-auto mt-8 transition-all duration-700 delay-400 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}
          >
            <h2 className={`text-xl font-bold mb-3 ${theme.text} flex items-center gap-3`}>
              <span className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${theme.accent} flex items-center justify-center shadow-lg`}>
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              על העסק
            </h2>
            
            <div className={`${theme.cardBg} ${isDark ? 'backdrop-blur-xl' : ''} border ${theme.cardBorder} rounded-2xl p-5 shadow-lg`}>
              <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'} leading-relaxed whitespace-pre-wrap`}>
                {business.description}
              </p>
            </div>
          </section>
        )}

        {/* Gallery Section */}
        {gallery.length > 0 && (
          <section 
            className={`max-w-md mx-auto mt-8 transition-all duration-700 delay-500 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}
          >
            <h2 className={`text-xl font-bold mb-3 ${theme.text} flex items-center gap-3`}>
              <span className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${theme.accent} flex items-center justify-center shadow-lg`}>
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </span>
              גלריה
            </h2>
            
            <div className="grid grid-cols-2 gap-3">
              {gallery.slice(0, 4).map((image, index) => (
                <div
                  key={image.id}
                  className="relative aspect-square rounded-2xl overflow-hidden shadow-lg group"
                >
                  <Image
                    src={image.image_url}
                    alt={image.caption || `תמונה ${index + 1}`}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Bottom Navigation */}
      <BottomNav slug={business.slug} theme={business.theme || 'light'} />
    </div>
  );
}
