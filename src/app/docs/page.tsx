import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function DocumentationPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-300">
      {/* Header */}
      <header className="bg-gray-900/50 backdrop-blur-xl border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-sm font-bold text-white">Q</span>
            </div>
            <span className="font-bold text-white">QueueApp Documentation</span>
          </div>
          <Link href="/" className="text-gray-400 hover:text-white flex items-center gap-2">
            <ArrowLeftIcon className="w-4 h-4" />
            Back to App
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Overview */}
        <Section id="overview" title="Overview">
          <p>
            QueueApp is a multi-tenant SaaS platform for appointment booking and queue management.
            It allows business owners to create their own branded booking pages where customers can 
            schedule appointments online.
          </p>
          <div className="mt-6 grid md:grid-cols-3 gap-4">
            <FeatureCard
              title="For Businesses"
              description="Custom booking page, service management, business hours, and appointment dashboard."
            />
            <FeatureCard
              title="For Customers"
              description="Easy online booking, appointment history, and automatic reminders."
            />
            <FeatureCard
              title="For Platform Admin"
              description="Manage all businesses, view statistics, handle leads, and create new accounts."
            />
          </div>
        </Section>

        {/* Architecture */}
        <Section id="architecture" title="System Architecture">
          <SubSection title="Tech Stack">
            <ul className="list-disc list-inside space-y-2 text-gray-400">
              <li><strong className="text-gray-200">Frontend:</strong> Next.js 14, React 18, Tailwind CSS</li>
              <li><strong className="text-gray-200">Backend:</strong> Next.js API Routes, Supabase</li>
              <li><strong className="text-gray-200">Database:</strong> PostgreSQL (Supabase)</li>
              <li><strong className="text-gray-200">Authentication:</strong> Custom auth with localStorage sessions</li>
              <li><strong className="text-gray-200">Storage:</strong> Supabase Storage (for images)</li>
            </ul>
          </SubSection>

          <SubSection title="Multi-Tenancy Model">
            <p className="text-gray-400">
              Each business operates in complete isolation. Customer data, appointments, and services 
              are all scoped to individual businesses using <code className="bg-gray-800 px-1.5 py-0.5 rounded">business_id</code> foreign keys.
            </p>
          </SubSection>
        </Section>

        {/* User Types */}
        <Section id="users" title="User Types">
          <div className="space-y-6">
            <UserTypeCard
              type="Platform Admin"
              description="The owner of the SaaS platform. Has access to all businesses and can create new ones."
              permissions={[
                'View all businesses and statistics',
                'Create new business accounts',
                'Suspend/activate businesses',
                'Manage leads from contact form',
              ]}
              loginUrl="/platform-admin/login"
            />
            <UserTypeCard
              type="Business Owner"
              description="Owner of an individual business. Manages their own booking page and appointments."
              permissions={[
                'View and manage appointments',
                'Configure services and pricing',
                'Set business hours',
                'Upload logo and images',
                'Edit business information',
              ]}
              loginUrl="/{slug}/admin/login"
            />
            <UserTypeCard
              type="Customer"
              description="End user who books appointments. Registered per-business."
              permissions={[
                'Book appointments',
                'View appointment history',
                'Cancel appointments',
              ]}
              loginUrl="/{slug}/login"
            />
          </div>
        </Section>

        {/* URL Structure */}
        <Section id="routes" title="URL Structure">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left py-3 px-4 text-gray-200">URL</th>
                  <th className="text-left py-3 px-4 text-gray-200">Description</th>
                  <th className="text-left py-3 px-4 text-gray-200">Access</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                <RouteRow url="/" desc="Marketing landing page" access="Public" />
                <RouteRow url="/docs" desc="Documentation (this page)" access="Public" />
                <RouteRow url="/platform-admin/login" desc="Platform admin login" access="Public" />
                <RouteRow url="/platform-admin" desc="Platform admin dashboard" access="Platform Admin" />
                <RouteRow url="/platform-admin/leads" desc="Manage leads" access="Platform Admin" />
                <RouteRow url="/platform-admin/new-business" desc="Create new business" access="Platform Admin" />
                <RouteRow url="/{slug}" desc="Business landing page" access="Public" />
                <RouteRow url="/{slug}/book" desc="Booking flow" access="Public" />
                <RouteRow url="/{slug}/login" desc="Customer login/register" access="Public" />
                <RouteRow url="/{slug}/my-appointments" desc="Customer appointments" access="Customer" />
                <RouteRow url="/{slug}/admin/login" desc="Business owner login" access="Public" />
                <RouteRow url="/{slug}/admin" desc="Business dashboard" access="Business Owner" />
                <RouteRow url="/{slug}/admin/settings" desc="Business settings" access="Business Owner" />
              </tbody>
            </table>
          </div>
        </Section>

        {/* Database Schema */}
        <Section id="database" title="Database Schema">
          <div className="space-y-6">
            <TableSchema
              name="platform_admins"
              description="Platform administrators (SaaS owners)"
              columns={[
                { name: 'id', type: 'UUID', desc: 'Primary key' },
                { name: 'email', type: 'TEXT', desc: 'Unique email address' },
                { name: 'name', type: 'TEXT', desc: 'Display name' },
                { name: 'password_hash', type: 'TEXT', desc: 'Password (plain for now)' },
                { name: 'role', type: 'TEXT', desc: 'admin | super_admin' },
                { name: 'is_active', type: 'BOOLEAN', desc: 'Account status' },
              ]}
            />
            <TableSchema
              name="business_owners"
              description="Individual business owners"
              columns={[
                { name: 'id', type: 'UUID', desc: 'Primary key' },
                { name: 'email', type: 'TEXT', desc: 'Unique email address' },
                { name: 'name', type: 'TEXT', desc: 'Display name' },
                { name: 'phone', type: 'TEXT', desc: 'Contact phone' },
                { name: 'password_hash', type: 'TEXT', desc: 'Password' },
                { name: 'is_active', type: 'BOOLEAN', desc: 'Account status' },
              ]}
            />
            <TableSchema
              name="businesses"
              description="Business profiles"
              columns={[
                { name: 'id', type: 'UUID', desc: 'Primary key' },
                { name: 'owner_id', type: 'UUID', desc: 'FK to business_owners' },
                { name: 'slug', type: 'TEXT', desc: 'Unique URL slug' },
                { name: 'name', type: 'TEXT', desc: 'Business name' },
                { name: 'description', type: 'TEXT', desc: 'About text' },
                { name: 'address', type: 'TEXT', desc: 'Physical address' },
                { name: 'phone', type: 'TEXT', desc: 'Business phone' },
                { name: 'logo_url', type: 'TEXT', desc: 'Logo image URL' },
                { name: 'cover_image_url', type: 'TEXT', desc: 'Cover image URL' },
                { name: 'is_active', type: 'BOOLEAN', desc: 'Business status' },
              ]}
            />
            <TableSchema
              name="services"
              description="Services offered by businesses"
              columns={[
                { name: 'id', type: 'UUID', desc: 'Primary key' },
                { name: 'business_id', type: 'UUID', desc: 'FK to businesses' },
                { name: 'name', type: 'TEXT', desc: 'Service name' },
                { name: 'description', type: 'TEXT', desc: 'Service description' },
                { name: 'duration', type: 'INTEGER', desc: 'Duration in minutes' },
                { name: 'price', type: 'DECIMAL', desc: 'Price in ILS' },
                { name: 'is_active', type: 'BOOLEAN', desc: 'Service availability' },
              ]}
            />
            <TableSchema
              name="business_hours"
              description="Operating hours for each day"
              columns={[
                { name: 'id', type: 'UUID', desc: 'Primary key' },
                { name: 'business_id', type: 'UUID', desc: 'FK to businesses' },
                { name: 'day_of_week', type: 'INTEGER', desc: '0=Sunday, 6=Saturday' },
                { name: 'open_time', type: 'TIME', desc: 'Opening time' },
                { name: 'close_time', type: 'TIME', desc: 'Closing time' },
                { name: 'is_closed', type: 'BOOLEAN', desc: 'Closed on this day' },
              ]}
            />
            <TableSchema
              name="customers"
              description="Customers (per-business)"
              columns={[
                { name: 'id', type: 'UUID', desc: 'Primary key' },
                { name: 'business_id', type: 'UUID', desc: 'FK to businesses' },
                { name: 'phone', type: 'TEXT', desc: 'Phone number (unique per business)' },
                { name: 'name', type: 'TEXT', desc: 'Customer name' },
                { name: 'pin_hash', type: 'TEXT', desc: '4-digit PIN' },
              ]}
            />
            <TableSchema
              name="appointments"
              description="Booked appointments"
              columns={[
                { name: 'id', type: 'UUID', desc: 'Primary key' },
                { name: 'business_id', type: 'UUID', desc: 'FK to businesses' },
                { name: 'customer_id', type: 'UUID', desc: 'FK to customers' },
                { name: 'service_id', type: 'UUID', desc: 'FK to services' },
                { name: 'date', type: 'DATE', desc: 'Appointment date' },
                { name: 'start_time', type: 'TIME', desc: 'Start time' },
                { name: 'end_time', type: 'TIME', desc: 'End time' },
                { name: 'status', type: 'TEXT', desc: 'pending|confirmed|cancelled|completed' },
              ]}
            />
            <TableSchema
              name="leads"
              description="Contact form submissions"
              columns={[
                { name: 'id', type: 'UUID', desc: 'Primary key' },
                { name: 'business_name', type: 'TEXT', desc: 'Prospective business name' },
                { name: 'contact_name', type: 'TEXT', desc: 'Contact person name' },
                { name: 'phone', type: 'TEXT', desc: 'Phone number' },
                { name: 'status', type: 'TEXT', desc: 'new|contacted|converted|closed' },
              ]}
            />
          </div>
        </Section>

        {/* Features Roadmap */}
        <Section id="roadmap" title="Features Roadmap">
          <div className="space-y-4">
            <RoadmapItem status="done" title="Multi-tenant architecture" />
            <RoadmapItem status="done" title="Business landing pages" />
            <RoadmapItem status="done" title="Online booking flow" />
            <RoadmapItem status="done" title="Customer authentication (Phone + PIN)" />
            <RoadmapItem status="done" title="Business owner dashboard" />
            <RoadmapItem status="done" title="Service management" />
            <RoadmapItem status="done" title="Business hours configuration" />
            <RoadmapItem status="done" title="Image upload (Logo, Cover, Gallery)" />
            <RoadmapItem status="done" title="Platform admin dashboard" />
            <RoadmapItem status="done" title="Lead management" />
            <RoadmapItem status="planned" title="SMS/WhatsApp reminders" />
            <RoadmapItem status="planned" title="Inactive customer alerts" />
            <RoadmapItem status="planned" title="Advanced analytics" />
            <RoadmapItem status="planned" title="Online payments" />
            <RoadmapItem status="planned" title="PWA (Progressive Web App)" />
          </div>
        </Section>

        {/* API */}
        <Section id="api" title="Key Files & Functions">
          <div className="space-y-4">
            <CodeFile
              path="src/lib/supabase.ts"
              description="Supabase client initialization"
            />
            <CodeFile
              path="src/lib/api.ts"
              description="Business-related API functions (getBusinessBySlug, createAppointment, etc.)"
            />
            <CodeFile
              path="src/lib/platform-api.ts"
              description="Platform admin API functions (getPlatformStats, createBusinessWithOwner, etc.)"
            />
            <CodeFile
              path="src/lib/auth.ts"
              description="Customer authentication (registerCustomer, loginCustomer, session management)"
            />
            <CodeFile
              path="src/lib/admin-auth.ts"
              description="Business owner authentication"
            />
            <CodeFile
              path="src/lib/platform-auth.ts"
              description="Platform admin authentication"
            />
            <CodeFile
              path="src/types/database.ts"
              description="TypeScript interfaces for all database tables"
            />
          </div>
        </Section>

        {/* Environment Variables */}
        <Section id="env" title="Environment Variables">
          <div className="bg-gray-900 rounded-xl p-4 font-mono text-sm">
            <div className="text-gray-500"># .env.local</div>
            <div className="mt-2">
              <span className="text-purple-400">NEXT_PUBLIC_SUPABASE_URL</span>=<span className="text-green-400">https://your-project.supabase.co</span>
            </div>
            <div>
              <span className="text-purple-400">NEXT_PUBLIC_SUPABASE_ANON_KEY</span>=<span className="text-green-400">your-anon-key</span>
            </div>
          </div>
        </Section>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-gray-800 text-center text-gray-500 text-sm">
          QueueApp Documentation • Last updated: January 2026
        </div>
      </main>
    </div>
  );
}

// Helper Components
function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mb-16 scroll-mt-20">
      <h2 className="text-2xl font-bold text-white mb-6 pb-2 border-b border-gray-800">{title}</h2>
      {children}
    </section>
  );
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold text-white mb-3">{title}</h3>
      {children}
    </div>
  );
}

function FeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-800">
      <h3 className="font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm text-gray-400">{description}</p>
    </div>
  );
}

function UserTypeCard({ 
  type, 
  description, 
  permissions, 
  loginUrl 
}: { 
  type: string; 
  description: string; 
  permissions: string[]; 
  loginUrl: string;
}) {
  return (
    <div className="bg-gray-900/50 rounded-xl p-5 border border-gray-800">
      <h3 className="font-bold text-white text-lg mb-2">{type}</h3>
      <p className="text-gray-400 mb-4">{description}</p>
      <div className="mb-3">
        <span className="text-xs font-medium text-gray-500 uppercase">Permissions:</span>
        <ul className="mt-2 space-y-1">
          {permissions.map((p, i) => (
            <li key={i} className="text-sm text-gray-400 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
              {p}
            </li>
          ))}
        </ul>
      </div>
      <div className="text-xs text-gray-500">
        Login: <code className="bg-gray-800 px-1.5 py-0.5 rounded text-blue-400">{loginUrl}</code>
      </div>
    </div>
  );
}

function RouteRow({ url, desc, access }: { url: string; desc: string; access: string }) {
  const accessColors: Record<string, string> = {
    'Public': 'text-green-400',
    'Platform Admin': 'text-purple-400',
    'Business Owner': 'text-blue-400',
    'Customer': 'text-orange-400',
  };
  return (
    <tr>
      <td className="py-3 px-4 font-mono text-sm text-blue-400">{url}</td>
      <td className="py-3 px-4 text-gray-400">{desc}</td>
      <td className={`py-3 px-4 ${accessColors[access] || 'text-gray-400'}`}>{access}</td>
    </tr>
  );
}

function TableSchema({ 
  name, 
  description, 
  columns 
}: { 
  name: string; 
  description: string; 
  columns: { name: string; type: string; desc: string }[];
}) {
  return (
    <div className="bg-gray-900/50 rounded-xl border border-gray-800 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-800 bg-gray-900/50">
        <h4 className="font-mono font-bold text-white">{name}</h4>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-800">
            <th className="text-left py-2 px-4 text-gray-400 font-normal">Column</th>
            <th className="text-left py-2 px-4 text-gray-400 font-normal">Type</th>
            <th className="text-left py-2 px-4 text-gray-400 font-normal">Description</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800/50">
          {columns.map((col, i) => (
            <tr key={i}>
              <td className="py-2 px-4 font-mono text-blue-400">{col.name}</td>
              <td className="py-2 px-4 font-mono text-purple-400">{col.type}</td>
              <td className="py-2 px-4 text-gray-500">{col.desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RoadmapItem({ status, title }: { status: 'done' | 'planned'; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
        status === 'done' ? 'bg-green-500/20 text-green-400' : 'bg-gray-700/50 text-gray-500'
      }`}>
        {status === 'done' ? '✓' : '○'}
      </div>
      <span className={status === 'done' ? 'text-gray-300' : 'text-gray-500'}>{title}</span>
      {status === 'planned' && (
        <span className="text-xs px-2 py-0.5 bg-gray-800 text-gray-500 rounded-full">Planned</span>
      )}
    </div>
  );
}

function CodeFile({ path, description }: { path: string; description: string }) {
  return (
    <div className="flex items-start gap-4 py-3 border-b border-gray-800/50">
      <code className="text-sm font-mono text-blue-400 min-w-[250px]">{path}</code>
      <span className="text-sm text-gray-500">{description}</span>
    </div>
  );
}
