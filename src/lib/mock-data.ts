import type { Business, Service, GalleryImage, BusinessHours, Appointment } from '@/types/database';

// Mock business data for development
export function getMockBusiness(slug: string): Business | null {
  const businesses: Record<string, Business> = {
    'shabat-barber': {
      id: '1',
      slug: 'shabat-barber',
      name: 'מספרת שבת',
      description: 'ספרות גברים ברמה הגבוהה ביותר. מספרה מקצועית עם ניסיון של שנים בתספורות גברים, זקן ועיצוב.',
      logo_url: null,
      cover_image_url: null,
      phone: '050-1234567',
      address: 'דרך מגדיאל 7',
      city: 'הוד השרון',
      whatsapp: '972501234567',
      instagram: 'shabat_barber',
      owner_id: 'owner1',
      created_at: '2024-01-01T00:00:00Z',
    },
    'demo': {
      id: '2',
      slug: 'demo',
      name: 'עסק לדוגמה',
      description: 'זהו עסק לדוגמה לבדיקת המערכת.',
      logo_url: null,
      cover_image_url: null,
      phone: '050-9876543',
      address: 'רחוב הראשי 1',
      city: 'תל אביב',
      whatsapp: '972509876543',
      instagram: null,
      owner_id: 'owner2',
      created_at: '2024-01-01T00:00:00Z',
    },
  };

  return businesses[slug] || null;
}

export function getMockServices(businessId: string): Service[] {
  const services: Record<string, Service[]> = {
    '1': [
      {
        id: 's1',
        business_id: '1',
        name: 'תספורת גברים',
        description: 'תספורת מקצועית כולל שטיפה',
        price: 80,
        duration_minutes: 30,
        is_active: true,
        order: 1,
        created_at: '2024-01-01T00:00:00Z',
      },
      {
        id: 's2',
        business_id: '1',
        name: 'תספורת + זקן',
        description: 'תספורת מלאה כולל עיצוב זקן',
        price: 120,
        duration_minutes: 45,
        is_active: true,
        order: 2,
        created_at: '2024-01-01T00:00:00Z',
      },
      {
        id: 's3',
        business_id: '1',
        name: 'עיצוב זקן',
        description: 'עיצוב וטיפוח זקן',
        price: 50,
        duration_minutes: 20,
        is_active: true,
        order: 3,
        created_at: '2024-01-01T00:00:00Z',
      },
      {
        id: 's4',
        business_id: '1',
        name: 'תספורת ילדים',
        description: 'לילדים עד גיל 12',
        price: 60,
        duration_minutes: 25,
        is_active: true,
        order: 4,
        created_at: '2024-01-01T00:00:00Z',
      },
    ],
    '2': [
      {
        id: 's5',
        business_id: '2',
        name: 'שירות בסיסי',
        description: 'תיאור השירות',
        price: 100,
        duration_minutes: 30,
        is_active: true,
        order: 1,
        created_at: '2024-01-01T00:00:00Z',
      },
    ],
  };

  return services[businessId] || [];
}

export function getMockGallery(businessId: string): GalleryImage[] {
  // Return empty array for now - images will be added later
  return [];
}

export function getMockBusinessHours(businessId: string): BusinessHours[] {
  // Default hours: Sunday-Thursday 9:00-19:00, Friday 9:00-14:00, Saturday closed
  return [
    { id: 'h0', business_id: businessId, day_of_week: 0, open_time: '09:00', close_time: '19:00', is_closed: false },
    { id: 'h1', business_id: businessId, day_of_week: 1, open_time: '09:00', close_time: '19:00', is_closed: false },
    { id: 'h2', business_id: businessId, day_of_week: 2, open_time: '09:00', close_time: '19:00', is_closed: false },
    { id: 'h3', business_id: businessId, day_of_week: 3, open_time: '09:00', close_time: '19:00', is_closed: false },
    { id: 'h4', business_id: businessId, day_of_week: 4, open_time: '09:00', close_time: '19:00', is_closed: false },
    { id: 'h5', business_id: businessId, day_of_week: 5, open_time: '09:00', close_time: '14:00', is_closed: false },
    { id: 'h6', business_id: businessId, day_of_week: 6, open_time: null, close_time: null, is_closed: true },
  ];
}

export function getMockAppointments(businessId: string, date: string): Appointment[] {
  // Return some mock appointments for testing availability
  const appointments: Appointment[] = [
    {
      id: 'a1',
      business_id: businessId,
      service_id: 's1',
      customer_name: 'ישראל ישראלי',
      customer_phone: '050-1111111',
      date: date,
      start_time: '10:00',
      end_time: '10:30',
      status: 'confirmed',
      notes: null,
      created_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 'a2',
      business_id: businessId,
      service_id: 's2',
      customer_name: 'משה כהן',
      customer_phone: '050-2222222',
      date: date,
      start_time: '14:00',
      end_time: '14:45',
      status: 'confirmed',
      notes: null,
      created_at: '2024-01-01T00:00:00Z',
    },
  ];

  return appointments;
}

// Helper to generate available time slots
export function generateTimeSlots(
  businessHours: BusinessHours,
  appointments: Appointment[],
  serviceDuration: number
): { time: string; available: boolean }[] {
  if (businessHours.is_closed || !businessHours.open_time || !businessHours.close_time) {
    return [];
  }

  const slots: { time: string; available: boolean }[] = [];
  const [openHour, openMinute] = businessHours.open_time.split(':').map(Number);
  const [closeHour, closeMinute] = businessHours.close_time.split(':').map(Number);

  let currentHour = openHour;
  let currentMinute = openMinute;

  while (currentHour < closeHour || (currentHour === closeHour && currentMinute < closeMinute)) {
    const timeStr = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
    
    // Check if this slot conflicts with any appointment
    const isOccupied = appointments.some(apt => {
      const [aptStartH, aptStartM] = apt.start_time.split(':').map(Number);
      const [aptEndH, aptEndM] = apt.end_time.split(':').map(Number);
      const aptStart = aptStartH * 60 + aptStartM;
      const aptEnd = aptEndH * 60 + aptEndM;
      const slotStart = currentHour * 60 + currentMinute;
      const slotEnd = slotStart + serviceDuration;

      return (slotStart < aptEnd && slotEnd > aptStart);
    });

    // Check if service would end after closing time
    const slotEnd = currentHour * 60 + currentMinute + serviceDuration;
    const closeTime = closeHour * 60 + closeMinute;
    const fitsBeforeClose = slotEnd <= closeTime;

    slots.push({
      time: timeStr,
      available: !isOccupied && fitsBeforeClose,
    });

    // Move to next slot (30 minute intervals)
    currentMinute += 30;
    if (currentMinute >= 60) {
      currentHour += 1;
      currentMinute = 0;
    }
  }

  return slots;
}
