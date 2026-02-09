import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const { ownerData, businessData, platformAdminId } = await request.json();

    // Verify platform admin session
    if (!platformAdminId) {
      return NextResponse.json({ error: 'לא מורשה' }, { status: 401 });
    }

    const { data: admin } = await supabase
      .from('platform_admins')
      .select('id')
      .eq('id', platformAdminId)
      .single();

    if (!admin) {
      return NextResponse.json({ error: 'לא מורשה' }, { status: 401 });
    }

    // Validate required fields
    if (!ownerData?.email || !ownerData?.name || !ownerData?.password) {
      return NextResponse.json({ error: 'יש למלא את כל פרטי בעל העסק' }, { status: 400 });
    }

    if (!businessData?.name || !businessData?.slug) {
      return NextResponse.json({ error: 'יש למלא שם עסק וכתובת אתר' }, { status: 400 });
    }

    // Check if slug is taken
    const { data: existingSlug } = await supabase
      .from('businesses')
      .select('id')
      .eq('slug', businessData.slug.toLowerCase())
      .maybeSingle();

    if (existingSlug) {
      return NextResponse.json({ error: 'כתובת האתר כבר תפוסה' }, { status: 400 });
    }

    // Check if email is taken
    const { data: existingEmail } = await supabase
      .from('business_owners')
      .select('id')
      .eq('email', ownerData.email.toLowerCase())
      .maybeSingle();

    if (existingEmail) {
      return NextResponse.json({ error: 'כתובת האימייל כבר קיימת במערכת' }, { status: 400 });
    }

    // Create owner
    const { data: owner, error: ownerError } = await supabase
      .from('business_owners')
      .insert({
        email: ownerData.email.toLowerCase(),
        name: ownerData.name,
        phone: ownerData.phone || null,
        password_hash: ownerData.password,
        is_active: true,
      })
      .select()
      .single();

    if (ownerError || !owner) {
      console.error('Error creating owner:', ownerError);
      return NextResponse.json({ error: 'שגיאה ביצירת בעל העסק' }, { status: 500 });
    }

    // Create business
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .insert({
        owner_id: owner.id,
        slug: businessData.slug.toLowerCase(),
        name: businessData.name,
        description: businessData.description || null,
        address: businessData.address || null,
        phone: businessData.phone || null,
        is_active: true,
      })
      .select()
      .single();

    if (businessError || !business) {
      console.error('Error creating business:', businessError);
      // Rollback owner creation
      await supabase.from('business_owners').delete().eq('id', owner.id);
      return NextResponse.json({ error: 'שגיאה ביצירת העסק' }, { status: 500 });
    }

    // Create default business hours (Sun-Thu 9-18, Fri 9-14, Sat closed)
    const defaultHours = [
      { business_id: business.id, day_of_week: 0, open_time: '09:00', close_time: '18:00', is_closed: false },
      { business_id: business.id, day_of_week: 1, open_time: '09:00', close_time: '18:00', is_closed: false },
      { business_id: business.id, day_of_week: 2, open_time: '09:00', close_time: '18:00', is_closed: false },
      { business_id: business.id, day_of_week: 3, open_time: '09:00', close_time: '18:00', is_closed: false },
      { business_id: business.id, day_of_week: 4, open_time: '09:00', close_time: '18:00', is_closed: false },
      { business_id: business.id, day_of_week: 5, open_time: '09:00', close_time: '14:00', is_closed: false },
      { business_id: business.id, day_of_week: 6, open_time: null, close_time: null, is_closed: true },
    ];

    await supabase.from('business_hours').insert(defaultHours);

    return NextResponse.json({ success: true, business });
  } catch (error) {
    console.error('Create business error:', error);
    return NextResponse.json({ error: 'שגיאה לא צפויה' }, { status: 500 });
  }
}
