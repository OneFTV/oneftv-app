import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import AnalyticsDashboard from './AnalyticsDashboard';

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as { role?: string }).role !== 'admin') {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <h1 className="text-3xl font-bold mb-8">Analytics Dashboard</h1>
      <AnalyticsDashboard />
    </div>
  );
}
