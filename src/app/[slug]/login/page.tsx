import { notFound } from 'next/navigation';
import { LoginPage } from './LoginPage';
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

  return <LoginPage business={business} />;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const business = await getBusinessBySlug(slug);
  
  if (!business) {
    return { title: 'עסק לא נמצא' };
  }

  return {
    title: `כניסה | ${business.name}`,
    description: `כניסה לחשבון ב${business.name}`,
  };
}
