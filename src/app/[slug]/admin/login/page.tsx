import { notFound } from 'next/navigation';
import { AdminLoginPage } from './AdminLoginPage';
import { getBusinessBySlug } from '@/lib/api';

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

  return <AdminLoginPage business={business} />;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const business = await getBusinessBySlug(slug);
  
  if (!business) {
    return { title: 'עסק לא נמצא' };
  }

  return {
    title: `כניסת מנהל | ${business.name}`,
    description: `כניסה לניהול ${business.name}`,
  };
}
