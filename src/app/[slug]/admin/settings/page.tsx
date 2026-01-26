import { notFound } from 'next/navigation';
import { SettingsPage } from './SettingsPage';
import { getBusinessBySlug, getServicesByBusinessId, getBusinessHours, getGalleryImages } from '@/lib/api';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  
  const business = await getBusinessBySlug(slug);
  
  if (!business) {
    notFound();
  }

  const [services, businessHours, galleryImages] = await Promise.all([
    getServicesByBusinessId(business.id),
    getBusinessHours(business.id),
    getGalleryImages(business.id),
  ]);

  return (
    <SettingsPage 
      business={business} 
      services={services}
      businessHours={businessHours}
      galleryImages={galleryImages}
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
    title: `הגדרות | ${business.name}`,
    description: `הגדרות עסק ${business.name}`,
  };
}
