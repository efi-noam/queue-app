'use client';

import { PauseCircleIcon } from '@heroicons/react/24/outline';

interface BusinessPausedPageProps {
  businessName: string;
}

export function BusinessPausedPage({ businessName }: BusinessPausedPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center p-4" dir="rtl">
      <div className="max-w-md w-full text-center">
        {/* Icon */}
        <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <PauseCircleIcon className="w-12 h-12 text-orange-500" />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 mb-3">
          {businessName}
        </h1>

        {/* Message */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            העסק לא פעיל כרגע
          </h2>
          <p className="text-gray-500 leading-relaxed">
            העסק השהה זמנית את פעילותו.
            <br />
            אנא נסו שוב מאוחר יותר או צרו קשר ישירות עם בעל העסק.
          </p>
        </div>

        {/* Footer */}
        <p className="mt-8 text-sm text-gray-400">
          מופעל על ידי TorLi
        </p>
      </div>
    </div>
  );
}
