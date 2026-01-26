import { notFound } from 'next/navigation';
import { BusinessPage } from './BusinessPage';
import { BusinessPausedPage } from './BusinessPausedPage';
import { getBusinessBySlug, getServicesByBusinessId, getGalleryImages } from '@/lib/api';

// Force dynamic rendering to ensure env vars are read at runtime
export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function Page({ params }: PageProps) {
  try {
    const { slug } = await params;
    
    // Debug: Check if env vars are set
    console.log('Supabase URL exists:', !!process.env.NEXT_PUBLIC_SUPABASE_URL);
    
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
  } catch (error) {
    console.error('Page error:', error);
    throw error;
  }
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
