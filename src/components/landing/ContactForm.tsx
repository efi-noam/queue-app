'use client';

import { useState } from 'react';
import { SparklesIcon, CheckCircleIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import { createLead } from '@/lib/platform-api';

export function ContactForm() {
  const [businessName, setBusinessName] = useState('');
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!businessName || !contactName || !phone) {
      setError('נא למלא את כל השדות');
      return;
    }

    setIsLoading(true);

    const lead = await createLead({
      business_name: businessName,
      contact_name: contactName,
      phone: phone,
    });

    if (lead) {
      setIsSuccess(true);
      
      // Send email notification about new lead (fire and forget)
      fetch('/api/lead-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName,
          contactName,
          phone,
        }),
      }).catch(console.error);

      setBusinessName('');
      setContactName('');
      setPhone('');
    } else {
      setError('אירעה שגיאה, נסו שוב');
    }

    setIsLoading(false);
  };

  if (isSuccess) {
    return (
      <div className="bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-xl rounded-3xl p-8 sm:p-12 border border-white/20 text-center">
        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircleIcon className="w-8 h-8 text-green-400" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-white">
          מעולה! קיבלנו
        </h2>
        <p className="text-gray-400 mb-4">
          ניצור איתך קשר בוואטסאפ תוך מספר דקות כדי להקים את הדף שלך.
        </p>
        <p className="text-gray-500 text-sm mb-6">
          לא רואים הודעה? שלחו לנו ישירות:
        </p>
        <a
          href="https://wa.me/972505999662?text=היי, השארתי פרטים באתר ורוצה להקים דף עסקי"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 transition-all"
        >
          <ChatBubbleLeftRightIcon className="w-5 h-5" />
          שלחו לנו בוואטסאפ
        </a>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-xl rounded-3xl p-8 sm:p-12 border border-white/20 text-center">
      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/30">
        <SparklesIcon className="w-8 h-8 text-white" />
      </div>
      <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-white">
        מוכנים להתחיל?
      </h2>
      <p className="text-gray-400 mb-8">
        השאירו פרטים ונקים לכם את הדף תוך דקות
      </p>

      <form onSubmit={handleSubmit} className="space-y-4 text-right">
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-center">
            {error}
          </div>
        )}

        <div>
          <input
            type="text"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="שם העסק"
            className="w-full px-5 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
            required
          />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <input
            type="text"
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            placeholder="שם מלא"
            className="w-full px-5 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
            required
          />
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="טלפון"
            className="w-full px-5 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
            dir="ltr"
            required
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl font-bold text-lg shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              שולח...
            </span>
          ) : (
            'קדימה, בואו נתחיל!'
          )}
        </button>
      </form>

      <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3 text-sm">
        <span className="text-gray-500">או דברו איתנו ישירות:</span>
        <a 
          href="https://wa.me/972505999662?text=היי, אשמח לשמוע על המערכת"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-green-400 hover:text-green-300 font-medium transition-colors"
        >
          <ChatBubbleLeftRightIcon className="w-4 h-4" />
          שלחו הודעה בוואטסאפ
        </a>
        <span className="text-gray-600 hidden sm:inline">|</span>
        <a href="tel:0505999662" className="text-blue-400 hover:text-blue-300 transition-colors">
          050-599-9662
        </a>
      </div>
    </div>
  );
}
