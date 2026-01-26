'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowRightIcon,
  PhoneIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChatBubbleLeftIcon,
  TrashIcon,
  BuildingStorefrontIcon,
} from '@heroicons/react/24/outline';
import { getPlatformSession } from '@/lib/platform-auth';
import { getAllLeads, updateLeadStatus, deleteLead } from '@/lib/platform-api';
import type { Lead } from '@/types/database';

const STATUS_CONFIG = {
  new: { label: 'חדש', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  contacted: { label: 'נוצר קשר', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  converted: { label: 'הפך ללקוח', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  closed: { label: 'נסגר', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
};

export default function LeadsPage() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'new' | 'contacted' | 'converted' | 'closed'>('all');

  useEffect(() => {
    const session = getPlatformSession();
    if (!session) {
      router.push('/platform-admin/login');
      return;
    }
    setIsAuthorized(true);
    loadLeads();
  }, [router]);

  const loadLeads = async () => {
    setIsLoading(true);
    const data = await getAllLeads();
    setLeads(data);
    setIsLoading(false);
  };

  const handleStatusChange = async (leadId: string, newStatus: Lead['status']) => {
    console.log('Changing status:', leadId, 'to', newStatus);
    const success = await updateLeadStatus(leadId, newStatus);
    console.log('Update result:', success);
    if (success) {
      setLeads(prev => 
        prev.map(lead => 
          lead.id === leadId ? { ...lead, status: newStatus } : lead
        )
      );
    } else {
      alert('שגיאה בעדכון הסטטוס');
    }
  };

  const handleDelete = async (leadId: string) => {
    if (!confirm('למחוק את הליד?')) return;
    
    const success = await deleteLead(leadId);
    if (success) {
      setLeads(prev => prev.filter(lead => lead.id !== leadId));
    }
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-gray-700 border-t-blue-500 animate-spin" />
      </div>
    );
  }

  const filteredLeads = leads.filter(lead => {
    if (filter === 'all') return true;
    return lead.status === filter;
  });

  const newCount = leads.filter(l => l.status === 'new').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <header className="bg-gray-800/50 backdrop-blur-xl border-b border-gray-700/50 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link
            href="/platform-admin"
            className="p-2 hover:bg-gray-700 rounded-xl transition-colors"
          >
            <ArrowRightIcon className="w-5 h-5 text-gray-400" />
          </Link>
          <div className="flex-1">
            <h1 className="font-bold text-white flex items-center gap-2">
              לידים
              {newCount > 0 && (
                <span className="px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                  {newCount} חדשים
                </span>
              )}
            </h1>
            <p className="text-sm text-gray-400">פניות מטופס יצירת קשר</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="max-w-5xl mx-auto px-4 pb-4">
          <div className="flex gap-2 overflow-x-auto">
            {[
              { id: 'all', label: 'הכל', count: leads.length },
              { id: 'new', label: 'חדשים', count: leads.filter(l => l.status === 'new').length },
              { id: 'contacted', label: 'נוצר קשר', count: leads.filter(l => l.status === 'contacted').length },
              { id: 'converted', label: 'הפכו ללקוח', count: leads.filter(l => l.status === 'converted').length },
              { id: 'closed', label: 'נסגרו', count: leads.filter(l => l.status === 'closed').length },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id as typeof filter)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  filter === tab.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-700/50 text-gray-400 hover:text-white'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 rounded-full border-4 border-gray-700 border-t-blue-500 animate-spin" />
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-gray-700/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ChatBubbleLeftIcon className="w-8 h-8 text-gray-500" />
            </div>
            <p className="text-gray-400">אין לידים להציג</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredLeads.map((lead) => (
              <LeadCard
                key={lead.id}
                lead={lead}
                onStatusChange={handleStatusChange}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

// Lead Card Component
interface LeadCardProps {
  lead: Lead;
  onStatusChange: (leadId: string, status: Lead['status']) => void;
  onDelete: (leadId: string) => void;
}

function LeadCard({ lead, onStatusChange, onDelete }: LeadCardProps) {
  const statusConfig = STATUS_CONFIG[lead.status];
  const createdDate = new Date(lead.created_at);
  const formattedDate = createdDate.toLocaleDateString('he-IL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl p-5 border border-gray-700/50 hover:border-gray-600/50 transition-colors">
      <div className="flex flex-wrap items-start gap-4">
        {/* Icon */}
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl flex items-center justify-center">
          <BuildingStorefrontIcon className="w-6 h-6 text-blue-400" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-[200px]">
          <h3 className="font-bold text-white text-lg">{lead.business_name}</h3>
          <p className="text-gray-400">{lead.contact_name}</p>
          
          <div className="flex flex-wrap items-center gap-4 mt-3 text-sm">
            <a
              href={`tel:${lead.phone}`}
              className="flex items-center gap-1.5 text-blue-400 hover:text-blue-300"
            >
              <PhoneIcon className="w-4 h-4" />
              {lead.phone}
            </a>
            <span className="flex items-center gap-1.5 text-gray-500">
              <CalendarIcon className="w-4 h-4" />
              {formattedDate}
            </span>
          </div>
        </div>

        {/* Status Badge */}
        <div className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${statusConfig.color}`}>
          {statusConfig.label}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {lead.status === 'new' && (
            <button
              type="button"
              onClick={() => { console.log('Click contacted'); onStatusChange(lead.id, 'contacted'); }}
              className="p-2 text-yellow-400 hover:bg-yellow-500/20 rounded-lg transition-colors cursor-pointer"
              title="סמן כנוצר קשר"
            >
              <ChatBubbleLeftIcon className="w-5 h-5" />
            </button>
          )}
          {lead.status === 'contacted' && (
            <button
              type="button"
              onClick={() => { console.log('Click converted'); onStatusChange(lead.id, 'converted'); }}
              className="p-2 text-green-400 hover:bg-green-500/20 rounded-lg transition-colors cursor-pointer"
              title="סמן כהפך ללקוח"
            >
              <CheckCircleIcon className="w-5 h-5" />
            </button>
          )}
          {(lead.status === 'new' || lead.status === 'contacted') && (
            <button
              type="button"
              onClick={() => { console.log('Click closed'); onStatusChange(lead.id, 'closed'); }}
              className="p-2 text-gray-400 hover:bg-gray-500/20 rounded-lg transition-colors cursor-pointer"
              title="סגור"
            >
              <XCircleIcon className="w-5 h-5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => onDelete(lead.id)}
            className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors cursor-pointer"
            title="מחק"
          >
            <TrashIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
