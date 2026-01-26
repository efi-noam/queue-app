import { notFound } from 'next/navigation';
import { SchedulePage } from './SchedulePage';
import { getBusinessBySlug, getBusinessHours, getScheduleOverrides, getTodayLocal, formatDateLocal } from '@/lib/api';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  
  const business = await getBusinessBySlug(slug);
  
  if (!business) {
    notFound();
  }

  // Get next 30 days of overrides
  const today = getTodayLocal();
  const futureDate = formatDateLocal(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));

  const [businessHours, scheduleOverrides] = await Promise.all([
    getBusinessHours(business.id),
    getScheduleOverrides(business.id, today, futureDate),
  ]);

  return (
    <SchedulePage 
      business={business}
      businessHours={businessHours}
      initialOverrides={scheduleOverrides}
    />
  );
}
