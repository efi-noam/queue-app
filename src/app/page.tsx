'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  CalendarDaysIcon, 
  DevicePhoneMobileIcon, 
  BellAlertIcon,
  ClockIcon,
  SparklesIcon,
  CheckCircleIcon,
  XMarkIcon,
  PhoneIcon,
  ArrowLeftIcon,
  ExclamationTriangleIcon,
  FireIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { ContactForm } from '@/components/landing/ContactForm';

export default function LandingPage() {
  const [currentScenario, setCurrentScenario] = useState(0);
  
  const scenarios = [
    { time: '10:32', text: 'לקוח מתקשר בזמן שאתה באמצע תספורת...', result: 'לא ענית. הוא הלך למתחרה.' },
    { time: '23:15', text: 'לקוחה רוצה לקבוע תור לבוקר...', result: 'אתה ישן. היא מחפשת מישהו אחר.' },
    { time: '14:47', text: 'שלושה לקוחות מחכים בתור לענות...', result: 'שניים מוותרים אחרי 2 צלצולים.' },
    { time: '09:00', text: 'לקוח ביטל ברגע האחרון...', result: 'שעה ריקה שאי אפשר למלא.' },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentScenario((prev) => (prev + 1) % scenarios.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [scenarios.length]);

  return (
    <div className="min-h-screen bg-gray-950 text-white overflow-hidden" dir="rtl">
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-purple-500/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Navigation */}
      <nav className="relative z-50 border-b border-white/10 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
              <CalendarDaysIcon className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-xl">TorLi</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="#why" className="hidden sm:block text-gray-400 hover:text-white transition-colors">
              למה עכשיו?
            </Link>
            <Link href="#pricing" className="hidden sm:block text-gray-400 hover:text-white transition-colors">
              מחירים
            </Link>
            <Link 
              href="#contact"
              className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl font-medium hover:shadow-lg hover:shadow-blue-500/30 transition-all hover:scale-105"
            >
              נסו בחינם
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section - Direct & Aggressive */}
      <section className="relative z-10 pt-12 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Urgency Banner */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-500/20 backdrop-blur-xl rounded-full border border-red-500/40">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-400 animate-pulse" />
              <span className="text-sm text-red-300 font-medium">
                כל לקוח שמתקשר ואתם לא עונים - הולך למתחרה
              </span>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left - The Hook */}
            <div className="text-center lg:text-right">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black mb-6 leading-tight">
                <span className="text-white">הלקוחות שלך</span>
                <br />
                <span className="bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
                  לא רוצים להתקשר.
                </span>
              </h1>

              <p className="text-xl text-gray-300 mb-4 leading-relaxed">
                הם רוצים <span className="text-white font-bold">לקבוע תור ב-30 שניות</span> מהטלפון שלהם.
              </p>
              
              <p className="text-lg text-gray-400 mb-8">
                בזמן שהם מחכים שתענה - 
                <span className="text-red-400 font-bold"> המתחרה שעובד עם מערכת כבר קיבל אותם.</span>
              </p>

              {/* Live Scenario */}
              <div className="bg-red-950/40 border border-red-500/30 rounded-2xl p-5 mb-8 relative overflow-hidden">
                <div className="absolute top-3 left-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-red-400 text-xs font-mono">{scenarios[currentScenario].time}</span>
                  </div>
                </div>
                <div className="pt-4">
                  <p className="text-gray-300 text-sm mb-2">{scenarios[currentScenario].text}</p>
                  <p className="text-red-400 font-bold">{scenarios[currentScenario].result}</p>
                </div>
              </div>

              {/* Main CTA */}
              <Link
                href="#contact"
                className="group inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl font-bold text-lg shadow-xl shadow-green-500/30 hover:shadow-2xl hover:shadow-green-500/40 transition-all hover:scale-105"
              >
                <SparklesIcon className="w-6 h-6" />
                תנו ללקוחות לקבוע לבד
                <ArrowLeftIcon className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              </Link>

              {/* Trust */}
              <div className="mt-6 flex items-center gap-4 justify-center lg:justify-start text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <CheckCircleIcon className="w-4 h-4 text-green-500" />
                  5 דקות הקמה
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircleIcon className="w-4 h-4 text-green-500" />
                  30 יום חינם
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircleIcon className="w-4 h-4 text-green-500" />
                  בלי כרטיס אשראי
                </span>
              </div>
            </div>

            {/* Right - Phone Mockup */}
            <div className="relative">
              <div className="absolute -inset-8 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-full blur-[80px]" />
              
              {/* Single Phone - Clean */}
              <div className="relative mx-auto w-[300px]">
                {/* Phone Frame */}
                <div className="w-full bg-gray-900 rounded-[3rem] p-3 shadow-2xl shadow-black/50 border border-white/10">
                  <div className="absolute top-6 left-1/2 -translate-x-1/2 w-24 h-6 bg-black rounded-full z-10" />
                  
                  {/* Screen */}
                  <div className="w-full aspect-[9/19] bg-gradient-to-b from-slate-900 to-black rounded-[2.5rem] overflow-hidden relative">
                    {/* Header */}
                    <div className="pt-10 px-4 pb-4 bg-gradient-to-br from-blue-600 to-purple-700">
                      <div className="flex items-center justify-between">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur">
                          <span className="text-2xl">✂️</span>
                        </div>
                        <div className="text-right">
                          <h3 className="text-white font-bold">מספרת אבי</h3>
                          <p className="text-white/70 text-xs">הזמן תור עכשיו</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Quick Actions */}
                    <div className="p-4">
                      <div className="flex gap-2 mb-4">
                        <button className="flex-1 py-2 bg-green-500 rounded-xl text-white text-xs font-bold flex items-center justify-center gap-1">
                          <PhoneIcon className="w-3 h-3" />
                          התקשר
                        </button>
                        <button className="flex-1 py-2 bg-blue-500 rounded-xl text-white text-xs font-bold">
                          📍 נווט
                        </button>
                      </div>
                      
                      {/* Services */}
                      <p className="text-gray-400 text-xs mb-2">בחר שירות:</p>
                      <div className="space-y-2">
                        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-3 flex justify-between items-center">
                          <span className="text-white font-bold text-sm">₪60</span>
                          <div className="text-right">
                            <span className="text-white text-sm">תספורת גבר</span>
                            <p className="text-white/60 text-xs">30 דק׳</p>
                          </div>
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex justify-between items-center">
                          <span className="text-blue-400 font-bold text-sm">₪90</span>
                          <div className="text-right">
                            <span className="text-white text-sm">תספורת + זקן</span>
                            <p className="text-gray-500 text-xs">45 דק׳</p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Date Selection */}
                      <p className="text-gray-400 text-xs mb-2 mt-4">בחר תאריך:</p>
                      <div className="grid grid-cols-4 gap-1">
                        {['היום', 'מחר', 'רביעי', 'חמישי'].map((day, i) => (
                          <button 
                            key={day}
                            className={`py-2 rounded-lg text-xs font-medium ${i === 1 ? 'bg-blue-500 text-white' : 'bg-white/5 text-gray-400'}`}
                          >
                            {day}
                          </button>
                        ))}
                      </div>
                      
                      {/* CTA */}
                      <button className="w-full mt-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl text-white font-bold text-sm shadow-lg">
                        קבע תור ל-10:00 ✓
                      </button>
                    </div>
                    
                    {/* Success Toast */}
                    <div className="absolute bottom-3 left-3 right-3 bg-green-500/90 backdrop-blur rounded-xl p-3 flex items-center gap-3 animate-bounce">
                      <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center flex-shrink-0">
                        <CheckCircleIcon className="w-5 h-5 text-green-500" />
                      </div>
                      <div className="text-right">
                        <p className="text-white text-xs font-bold">נקבע! 🎉</p>
                        <p className="text-white/80 text-[10px]">מחר 10:00 • תזכורת תשלח</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Floating Labels */}
                <div className="absolute -right-4 top-1/4 bg-green-500/20 backdrop-blur border border-green-500/30 rounded-xl px-3 py-2 animate-pulse">
                  <p className="text-green-400 text-xs font-bold">24/7 פעיל</p>
                </div>
                <div className="absolute -left-4 top-1/2 bg-blue-500/20 backdrop-blur border border-blue-500/30 rounded-xl px-3 py-2">
                  <p className="text-blue-400 text-xs font-bold">30 שניות</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Business Types Bar */}
      <section className="relative z-10 py-6 border-y border-white/10 bg-white/5">
        <div className="max-w-6xl mx-auto px-4">
          <p className="text-center text-gray-500 text-sm mb-4">מושלם עבור:</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {[
              { emoji: '✂️', name: 'מספרות' },
              { emoji: '💅', name: 'מניקור' },
              { emoji: '💆', name: 'עיסוי' },
              { emoji: '🏥', name: 'קליניקות' },
              { emoji: '💪', name: 'מאמנים' },
              { emoji: '🧘', name: 'יוגה' },
            ].map(({ emoji, name }) => (
              <div key={name} className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full text-sm">
                <span>{emoji}</span>
                <span className="text-gray-400">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Now Section */}
      <section id="why" className="relative z-10 py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/20 rounded-full border border-orange-500/30 mb-4">
              <FireIcon className="w-5 h-5 text-orange-400" />
              <span className="text-orange-300 text-sm font-medium">בואו נדבר תכל׳ס</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black mb-4">
              מה קורה כשאין לכם מערכת?
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Without System */}
            <div className="bg-red-950/30 border border-red-500/30 rounded-3xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <XMarkIcon className="w-8 h-8 text-red-500" />
                <h3 className="text-xl font-bold text-red-400">בלי מערכת</h3>
              </div>
              <div className="space-y-4">
                <PainPoint text="עונים לטלפון במקום לעבוד" />
                <PainPoint text="לקוחות מתקשרים ב-11 בלילה ומוותרים" />
                <PainPoint text="ביטולים ללא התראה - שעות ריקות" />
                <PainPoint text="לא יודעים מי הלקוחות הקבועים" />
                <PainPoint text='שואלים "יש מקום היום?" 20 פעם ביום' />
                <PainPoint text="מפספסים הזמנות בזמן טיפול" />
              </div>
            </div>

            {/* With System */}
            <div className="bg-green-950/30 border border-green-500/30 rounded-3xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <CheckCircleIcon className="w-8 h-8 text-green-500" />
                <h3 className="text-xl font-bold text-green-400">עם TorLi</h3>
              </div>
              <div className="space-y-4">
                <Benefit text="לקוחות קובעים לבד - אתם עובדים" />
                <Benefit text="הזמנות נכנסות גם ב-3 בלילה" />
                <Benefit text="תזכורות אוטומטיות = פחות ביטולים" />
                <Benefit text="רואים את כל ההיסטוריה של כל לקוח" />
                <Benefit text="הכל ביומן אחד מסודר" />
                <Benefit text="מקבלים התראה על כל הזמנה חדשה" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Simple Truth */}
      <section className="relative z-10 py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-blue-500/10 border border-white/10 rounded-3xl p-10">
            <h2 className="text-2xl sm:text-3xl font-black mb-4">
              האמת הפשוטה?
            </h2>
            <p className="text-lg text-gray-300 mb-6">
              הלקוחות שלכם כבר רגילים להזמין הכל מהטלפון - 
              <span className="text-white font-bold"> אוכל, טיסות, מוניות, קניות.</span>
            </p>
            <p className="text-xl text-white font-bold">
              למה שיתקשרו אליכם דווקא כשיש דרך קלה יותר?
            </p>
          </div>
        </div>
      </section>

      {/* Features - Simplified */}
      <section className="relative z-10 py-20 px-4 bg-gradient-to-b from-transparent via-blue-950/20 to-transparent">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-black mb-4">
              מה תקבלו?
            </h2>
            <p className="text-gray-400 text-lg">
              הכל כדי שתעבדו פחות ותרוויחו יותר
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <FeatureCard
              icon={CalendarDaysIcon}
              title="דף הזמנות מקצועי"
              description="דף מעוצב עם הלוגו שלכם, השירותים, והמחירים. הלקוח בוחר שירות, תאריך ושעה - וסגור."
              highlight="7 ערכות עיצוב"
            />
            <FeatureCard
              icon={BellAlertIcon}
              title="תזכורות אוטומטיות"
              description="הודעת WhatsApp או SMS יום לפני ושעה לפני התור. הלקוח לא שוכח, אתם לא מפסידים."
              highlight="פחות ביטולים"
            />
            <FeatureCard
              icon={ClockIcon}
              title="יומן חכם"
              description="רואים את כל התורים במקום אחד. מקבלים התראה על כל הזמנה חדשה. שולטים בכל רגע."
              highlight="זמין 24/7"
            />
          </div>
        </div>
      </section>

      {/* How It Works - Super Simple */}
      <section className="relative z-10 py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-black mb-4">
              מתחילים ב-5 דקות
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Step number="1" title="נרשמים" description="ממלאים שם העסק, טלפון, ושירותים שאתם מציעים." />
            <Step number="2" title="מקבלים לינק" description="הלינק שלכם מוכן. משתפים אותו עם הלקוחות." />
            <Step number="3" title="מקבלים הזמנות" description="הלקוחות קובעים לבד. אתם מקבלים התראה." />
          </div>
        </div>
      </section>

      {/* Pricing - Clear */}
      <section id="pricing" className="relative z-10 py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-black mb-4">
              פשוט ושקוף
            </h2>
            <p className="text-gray-400">
              בלי חוזים. בלי הפתעות. בלי בולשיט.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Starter */}
            <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10">
              <h3 className="text-xl font-bold mb-2">סטארטר</h3>
              <p className="text-gray-400 text-sm mb-6">לעסקים שמתחילים</p>
              <div className="mb-6">
                <span className="text-5xl font-black">₪99</span>
                <span className="text-gray-400">/חודש</span>
              </div>
              <ul className="space-y-3 mb-8">
                <PricingItem text="עד 100 תורים בחודש" />
                <PricingItem text="דף עסק מותאם אישית" />
                <PricingItem text="התראות על הזמנות" />
                <PricingItem text="תמיכה בוואטסאפ" />
              </ul>
              <Link
                href="#contact"
                className="block w-full py-4 text-center bg-white/10 border border-white/20 rounded-xl font-bold hover:bg-white/20 transition-all"
              >
                התחל עכשיו
              </Link>
            </div>

            {/* Pro */}
            <div className="relative bg-gradient-to-b from-blue-500/20 to-purple-500/20 backdrop-blur-xl rounded-3xl p-8 border border-blue-500/30 scale-105">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full text-sm font-bold">
                ⭐ מומלץ
              </div>
              <h3 className="text-xl font-bold mb-2">פרו</h3>
              <p className="text-gray-400 text-sm mb-6">לעסקים שרוצים יותר</p>
              <div className="mb-6">
                <span className="text-5xl font-black">₪199</span>
                <span className="text-gray-400">/חודש</span>
              </div>
              <ul className="space-y-3 mb-8">
                <PricingItem text="תורים ללא הגבלה" highlight />
                <PricingItem text="תזכורות SMS/WhatsApp" highlight />
                <PricingItem text="סטטיסטיקות מתקדמות" />
                <PricingItem text="תמיכה בעדיפות" />
              </ul>
              <Link
                href="#contact"
                className="block w-full py-4 text-center bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl font-bold shadow-lg shadow-blue-500/30 hover:shadow-xl transition-all"
              >
                נסו 30 יום בחינם
              </Link>
            </div>
          </div>

          {/* Guarantee */}
          <div className="mt-12 text-center">
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-green-500/10 border border-green-500/30 rounded-full">
              <ShieldCheckIcon className="w-6 h-6 text-green-500" />
              <span className="text-green-300">30 יום ניסיון חינם • ביטול בקליק • ללא כרטיס אשראי</span>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA - Aggressive */}
      <section className="relative z-10 py-20 px-4 bg-gradient-to-b from-transparent via-purple-950/30 to-transparent">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-black mb-6">
            כמה לקוחות תפסידו
            <br />
            <span className="bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
              עד שתתחילו?
            </span>
          </h2>
          <p className="text-gray-400 text-lg mb-8">
            כל יום בלי מערכת = לקוחות שהולכים למתחרה.
            <br />
            <span className="text-white">התחילו היום. זה לוקח 5 דקות.</span>
          </p>
          <Link
            href="#contact"
            className="inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl font-bold text-xl shadow-xl shadow-green-500/30 hover:shadow-2xl hover:shadow-green-500/40 transition-all hover:scale-105"
          >
            <SparklesIcon className="w-7 h-7" />
            התחילו בחינם עכשיו
            <ArrowLeftIcon className="w-6 h-6" />
          </Link>
        </div>
      </section>

      {/* Contact Form */}
      <section id="contact" className="relative z-10 py-20 px-4">
        <div className="max-w-2xl mx-auto">
          <ContactForm />
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-12 px-4 border-t border-white/10">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <CalendarDaysIcon className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold">TorLi</span>
          </div>
          <p className="text-gray-500 text-sm">
            © 2025 TorLi. כל הזכויות שמורות.
          </p>
          <Link 
            href="/platform-admin/login"
            className="text-gray-500 text-sm hover:text-gray-400 transition-colors"
          >
            כניסת מנהלים
          </Link>
        </div>
      </footer>
    </div>
  );
}

// Pain Point Item
function PainPoint({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3">
      <XMarkIcon className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
      <span className="text-gray-300 text-sm">{text}</span>
    </div>
  );
}

// Benefit Item
function Benefit({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3">
      <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
      <span className="text-gray-300 text-sm">{text}</span>
    </div>
  );
}

// Feature Card
function FeatureCard({ 
  icon: Icon, 
  title, 
  description, 
  highlight 
}: { 
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  highlight: string;
}) {
  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-blue-500/30 transition-all">
      <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-blue-400" />
      </div>
      <h3 className="font-bold text-lg mb-2">{title}</h3>
      <p className="text-gray-400 text-sm leading-relaxed mb-4">{description}</p>
      <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-500/20 rounded-full text-xs text-green-400 font-medium">
        <CheckCircleIcon className="w-3 h-3" />
        {highlight}
      </div>
    </div>
  );
}

// Step
function Step({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="text-center">
      <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-xl font-bold shadow-lg shadow-blue-500/30">
        {number}
      </div>
      <h3 className="font-bold text-lg mb-2">{title}</h3>
      <p className="text-gray-400 text-sm">{description}</p>
    </div>
  );
}

// Pricing Item
function PricingItem({ text, highlight }: { text: string; highlight?: boolean }) {
  return (
    <li className="flex items-center gap-3 text-right">
      <CheckCircleIcon className={`w-5 h-5 flex-shrink-0 ${highlight ? 'text-blue-400' : 'text-green-400'}`} />
      <span className={highlight ? 'text-white font-medium' : 'text-gray-300'}>{text}</span>
    </li>
  );
}
