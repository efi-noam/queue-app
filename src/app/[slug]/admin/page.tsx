import { notFound } from 'next/navigation';
import { AdminDashboard } from './AdminDashboard';
import { getBusinessBySlug, getServicesByBusinessId } from '@/lib/api';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  
  const business = await getBusinessBySlug(slug);
  
  if (!business) {
    notFound();
  }

  const services = await getServicesByBusinessId(business.id);

  return <AdminDashboard business={business} services={services} />;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const business = await getBusinessBySlug(slug);
  
  if (!business) {
    return { title: 'עסק לא נמצא' };
  }

  return {
    title: `ניהול | ${business.name}`,
    description: `ניהול תורים ב${business.name}`,
  };
}
