import { notFound, redirect } from 'next/navigation';
import { BookingFlow } from './BookingFlow';
import { getBusinessBySlug, getServicesByBusinessId, getBusinessHours } from '@/lib/api';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  
  const business = await getBusinessBySlug(slug);
  
  if (!business) {
    notFound();
  }

  // Redirect to business page if inactive (will show paused message)
  if (!business.is_active) {
    redirect(`/${slug}`);
  }

  const [services, businessHours] = await Promise.all([
    getServicesByBusinessId(business.id),
    getBusinessHours(business.id),
  ]);

  return (
    <BookingFlow 
      business={business} 
      services={services} 
      businessHours={businessHours}
    />
  );
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const business = await getBusinessBySlug(slug);
  
  if (!business) {
    return { title: 'עסק לא נמצא' };
  }

  return {
    title: `הזמן תור | ${business.name}`,
    description: `הזמן תור ב${business.name}`,
  };
}
