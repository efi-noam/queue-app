import { notFound } from 'next/navigation';
import { BusinessPage } from './BusinessPage';
import { BusinessPausedPage } from './BusinessPausedPage';
import { getBusinessBySlug, getServicesByBusinessId, getGalleryImages } from '@/lib/api';

// Force dynamic rendering - always fetch fresh data from DB
export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  
  // Fetch real data from Supabase
  const business = await getBusinessBySlug(slug);
  
  if (!business) {
    notFound();
  }

  // Show paused page if business is inactive
  if (!business.is_active) {
    return <BusinessPausedPage businessName={business.name} />;
  }

  const [services, gallery] = await Promise.all([
    getServicesByBusinessId(business.id),
    getGalleryImages(business.id),
  ]);

  return (
    <BusinessPage 
      business={business} 
      services={services} 
      gallery={gallery}
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
    title: `${business.name} | הזמן תור`,
    description: business.description || `הזמן תור ב${business.name}`,
  };
}
