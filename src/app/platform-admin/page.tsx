'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  BuildingStorefrontIcon,
  UsersIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  PlusIcon,
  ArrowRightOnRectangleIcon,
  EyeIcon,
  PauseCircleIcon,
  PlayCircleIcon,
  TrashIcon,
  Cog6ToothIcon,
  ClockIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { getPlatformSession, clearPlatformSession } from '@/lib/platform-auth';
import { 
  getPlatformStats, 
  getAllBusinessesWithStats,
  toggleBusinessActive,
  type PlatformStats,
  type BusinessStats,
} from '@/lib/platform-api';

export default function PlatformDashboard() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [adminName, setAdminName] = useState('');
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [businesses, setBusinesses] = useState<BusinessStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');

  useEffect(() => {
    const session = getPlatformSession();
    if (!session) {
      router.push('/platform-admin/login');
      return;
    }
    setIsAuthorized(true);
    setAdminName(session.adminName);
    loadData();
  }, [router]);

  const loadData = async () => {
    setIsLoading(true);
    const [statsData, businessesData] = await Promise.all([
      getPlatformStats(),
      getAllBusinessesWithStats(),
    ]);
    setStats(statsData);
    setBusinesses(businessesData);
    setIsLoading(false);
  };

  const handleLogout = () => {
    clearPlatformSession();
    router.push('/platform-admin/login');
  };

  const handleToggleBusiness = async (businessId: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    const success = await toggleBusinessActive(businessId, newStatus);
    if (success) {
      setBusinesses(prev => 
        prev.map(b => 
          b.business.id === businessId 
            ? { ...b, business: { ...b.business, is_active: newStatus } }
            : b
        )
      );
    }
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-gray-700 border-t-blue-500 animate-spin" />
      </div>
    );
  }

  const filteredBusinesses = businesses.filter(b => {
    if (filter === 'active') return b.business.is_active;
    if (filter === 'inactive') return !b.business.is_active;
    return true;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <header className="bg-gray-800/50 backdrop-blur-xl border-b border-gray-700/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-lg font-bold text-white">Q</span>
            </div>
            <div>
              <h1 className="font-bold text-white">Queue Platform</h1>
              <p className="text-xs text-gray-400">שלום, {adminName}</p>
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5" />
            <span className="hidden sm:inline">יציאה</span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <StatCard
              icon={BuildingStorefrontIcon}
              label="עסקים"
              value={stats.totalBusinesses}
              subValue={`${stats.activeBusinesses} פעילים`}
              color="blue"
            />
            <StatCard
              icon={UsersIcon}
              label="לקוחות"
              value={stats.totalCustomers}
              color="green"
            />
            <StatCard
              icon={CalendarDaysIcon}
              label="תורים החודש"
              value={stats.appointmentsThisMonth}
              subValue={`${stats.appointmentsToday} היום`}
              color="purple"
            />
            <StatCard
              icon={ChartBarIcon}
              label="עסקים חדשים"
              value={stats.newBusinessesThisMonth}
              subValue="החודש"
              color="orange"
            />
            <Link href="/platform-admin/leads">
              <StatCard
                icon={EnvelopeIcon}
                label="לידים"
                value={stats.totalLeads}
                subValue={stats.newLeads > 0 ? `${stats.newLeads} חדשים!` : 'אין חדשים'}
                color={stats.newLeads > 0 ? 'pink' : 'blue'}
                highlight={stats.newLeads > 0}
              />
            </Link>
          </div>
        )}

        {/* Businesses Section */}
        <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl border border-gray-700/50 overflow-hidden">
          <div className="p-4 border-b border-gray-700/50 flex flex-wrap items-center justify-between gap-4">
            <h2 className="font-bold text-white flex items-center gap-2">
              <BuildingStorefrontIcon className="w-5 h-5" />
              עסקים ({filteredBusinesses.length})
            </h2>
            
            <div className="flex items-center gap-3">
              {/* Filter */}
              <div className="flex bg-gray-700/50 rounded-lg p-1">
                {[
                  { id: 'all', label: 'הכל' },
                  { id: 'active', label: 'פעילים' },
                  { id: 'inactive', label: 'מושהים' },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFilter(f.id as typeof filter)}
                    className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                      filter === f.id
                        ? 'bg-gray-600 text-white'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Add Business Button */}
              <Link href="/platform-admin/new-business">
                <Button variant="gradient" size="sm" className="flex items-center gap-2">
                  <PlusIcon className="w-4 h-4" />
                  עסק חדש
                </Button>
              </Link>
            </div>
          </div>

          {/* Business List */}
          {isLoading ? (
            <div className="p-12 flex justify-center">
              <div className="w-10 h-10 rounded-full border-4 border-gray-700 border-t-blue-500 animate-spin" />
            </div>
          ) : filteredBusinesses.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              אין עסקים להציג
            </div>
          ) : (
            <div className="divide-y divide-gray-700/50">
              {filteredBusinesses.map((item) => (
                <BusinessRow
                  key={item.business.id}
                  data={item}
                  onToggle={() => handleToggleBusiness(item.business.id, item.business.is_active)}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// Stat Card Component
interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  subValue?: string;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'pink';
  highlight?: boolean;
}

function StatCard({ icon: Icon, label, value, subValue, color, highlight }: StatCardProps) {
  const colors = {
    blue: 'from-blue-500/20 to-blue-600/20 border-blue-500/30',
    green: 'from-green-500/20 to-green-600/20 border-green-500/30',
    purple: 'from-purple-500/20 to-purple-600/20 border-purple-500/30',
    orange: 'from-orange-500/20 to-orange-600/20 border-orange-500/30',
    pink: 'from-pink-500/20 to-pink-600/20 border-pink-500/30',
  };

  const iconColors = {
    blue: 'text-blue-400',
    green: 'text-green-400',
    purple: 'text-purple-400',
    orange: 'text-orange-400',
    pink: 'text-pink-400',
  };

  return (
    <div className={`bg-gradient-to-br ${colors[color]} border rounded-2xl p-4 transition-transform hover:scale-[1.02] ${highlight ? 'ring-2 ring-pink-500/50 animate-pulse' : ''}`}>
      <div className="flex items-center gap-3 mb-2">
        <Icon className={`w-5 h-5 ${iconColors[color]}`} />
        <span className="text-sm text-gray-400">{label}</span>
      </div>
      <p className="text-2xl font-bold text-white">{value.toLocaleString()}</p>
      {subValue && <p className="text-xs text-gray-500 mt-1">{subValue}</p>}
    </div>
  );
}

// Business Row Component
interface BusinessRowProps {
  data: BusinessStats;
  onToggle: () => void;
}

function BusinessRow({ data, onToggle }: BusinessRowProps) {
  const { business, owner, customersCount, appointmentsCount, appointmentsThisMonth, servicesCount } = data;

  return (
    <div className={`p-4 hover:bg-gray-700/30 transition-colors ${!business.is_active ? 'opacity-60' : ''}`}>
      <div className="flex flex-wrap items-center gap-4">
        {/* Logo & Name */}
        <div className="flex items-center gap-3 flex-1 min-w-[200px]">
          <div className="w-12 h-12 bg-gradient-to-br from-gray-600 to-gray-700 rounded-xl flex items-center justify-center overflow-hidden">
            {business.logo_url ? (
              <img src={business.logo_url} alt={business.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-xl font-bold text-gray-400">{business.name.charAt(0)}</span>
            )}
          </div>
          <div>
            <h3 className="font-medium text-white">{business.name}</h3>
            <p className="text-sm text-gray-500" dir="ltr">/{business.slug}</p>
          </div>
        </div>

        {/* Owner */}
        <div className="min-w-[150px]">
          <p className="text-sm text-gray-400">בעל העסק</p>
          <p className="text-white">{owner?.name || '-'}</p>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-6 text-sm">
          <div className="text-center">
            <p className="text-gray-400">לקוחות</p>
            <p className="text-white font-medium">{customersCount}</p>
          </div>
          <div className="text-center">
            <p className="text-gray-400">תורים</p>
            <p className="text-white font-medium">{appointmentsCount}</p>
          </div>
          <div className="text-center">
            <p className="text-gray-400">החודש</p>
            <p className="text-white font-medium">{appointmentsThisMonth}</p>
          </div>
          <div className="text-center">
            <p className="text-gray-400">שירותים</p>
            <p className="text-white font-medium">{servicesCount}</p>
          </div>
        </div>

        {/* Status Badge */}
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
          business.is_active 
            ? 'bg-green-500/20 text-green-400' 
            : 'bg-red-500/20 text-red-400'
        }`}>
          {business.is_active ? 'פעיל' : 'מושהה'}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Link
            href={`/${business.slug}`}
            target="_blank"
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
            title="צפייה באתר"
          >
            <EyeIcon className="w-5 h-5" />
          </Link>
          <button
            onClick={onToggle}
            className={`p-2 rounded-lg transition-colors ${
              business.is_active
                ? 'text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/20'
                : 'text-green-400 hover:text-green-300 hover:bg-green-500/20'
            }`}
            title={business.is_active ? 'השהה עסק' : 'הפעל עסק'}
          >
            {business.is_active ? (
              <PauseCircleIcon className="w-5 h-5" />
            ) : (
              <PlayCircleIcon className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
