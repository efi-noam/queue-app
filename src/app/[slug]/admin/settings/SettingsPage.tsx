'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowRightIcon, 
  PlusIcon,
  TrashIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { 
  updateBusiness, 
  createService, 
  updateService, 
  deleteService,
  updateBusinessHours,
  uploadImage,
  updateBusinessSlug,
  getGalleryImages,
  addGalleryImage,
  deleteGalleryImage,
  deleteImage
} from '@/lib/api';
import { getAdminSession, clearAdminSession, saveAdminSession, getAdminSession as getSession } from '@/lib/admin-auth';
import type { Business, Service, BusinessHours, GalleryImage } from '@/types/database';

interface SettingsPageProps {
  business: Business;
  services: Service[];
  businessHours: BusinessHours[];
  galleryImages?: GalleryImage[];
}

const DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

export function SettingsPage({ business, services: initialServices, businessHours: initialHours, galleryImages: initialGallery = [] }: SettingsPageProps) {
  const router = useRouter();
  
  // All hooks must be called before any conditional returns
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'services' | 'hours' | 'appearance'>('info');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Appearance state
  const [slug, setSlug] = useState(business.slug);
  const [logoUrl, setLogoUrl] = useState(business.logo_url || '');
  const [coverUrl, setCoverUrl] = useState(business.cover_image_url || '');
  const [gallery, setGallery] = useState<GalleryImage[]>(initialGallery);
  const [selectedTheme, setSelectedTheme] = useState(business.theme || 'light');

  // Business info state
  const [businessInfo, setBusinessInfo] = useState({
    name: business.name,
    description: business.description || '',
    address: business.address || '',
    phone: business.phone || '',
    whatsapp: business.whatsapp || '',
    instagram: business.instagram || '',
  });

  // Services state
  const [services, setServices] = useState(initialServices);
  const [newService, setNewService] = useState({ name: '', duration: 30, price: 0 });

  // Business hours state
  const [hours, setHours] = useState(() => {
    return DAYS.map((_, index) => {
      const existing = initialHours.find(h => h.day_of_week === index);
      return {
        day_of_week: index,
        open_time: existing?.open_time || '09:00',
        close_time: existing?.close_time || '18:00',
        break_start: existing?.break_start || null,
        break_end: existing?.break_end || null,
        is_closed: existing?.is_closed ?? (index === 6), // Saturday closed by default
      };
    });
  });

  // Slot interval state
  const [slotInterval, setSlotInterval] = useState(business.slot_interval || 30);

  // Check admin session
  useEffect(() => {
    const session = getAdminSession();
    if (!session || session.businessSlug !== business.slug) {
      router.push(`/${business.slug}/admin/login`);
      return;
    }
    setIsAuthorized(true);
  }, [business.slug, router]);

  // Show loading while checking auth
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-gray-200 border-t-gray-600 animate-spin" />
      </div>
    );
  }

  const showSaveMessage = (message: string) => {
    setSaveMessage(message);
    setTimeout(() => setSaveMessage(''), 3000);
  };

  const handleSaveBusinessInfo = async () => {
    setIsSaving(true);
    try {
      const result = await updateBusiness(business.id, businessInfo);
      if (result) {
        showSaveMessage('פרטי העסק נשמרו בהצלחה!');
      } else {
        showSaveMessage('שגיאה בשמירה');
      }
    } catch (error) {
      console.error('Error saving:', error);
      showSaveMessage('שגיאה בשמירה');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddService = async () => {
    if (!newService.name || newService.price <= 0) {
      alert('יש למלא שם ומחיר');
      return;
    }

    setIsSaving(true);
    try {
      const result = await createService(business.id, newService);
      if (result) {
        setServices(prev => [...prev, result]);
        setNewService({ name: '', duration: 30, price: 0 });
        showSaveMessage('השירות נוסף בהצלחה!');
      }
    } catch (error) {
      console.error('Error adding service:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateService = async (serviceId: string, updates: Partial<Service>) => {
    try {
      const result = await updateService(serviceId, updates);
      if (result) {
        setServices(prev => prev.map(s => s.id === serviceId ? { ...s, ...updates } : s));
      }
    } catch (error) {
      console.error('Error updating service:', error);
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    if (!confirm('האם למחוק את השירות?')) return;

    try {
      const success = await deleteService(serviceId);
      if (success) {
        setServices(prev => prev.filter(s => s.id !== serviceId));
        showSaveMessage('השירות נמחק');
      }
    } catch (error) {
      console.error('Error deleting service:', error);
    }
  };

  const handleSaveHours = async () => {
    setIsSaving(true);
    try {
      // Save hours and slot interval
      const hoursSuccess = await updateBusinessHours(business.id, hours);
      const intervalSuccess = await updateBusiness(business.id, { slot_interval: slotInterval });
      
      if (hoursSuccess && intervalSuccess) {
        showSaveMessage('שעות הפעילות נשמרו!');
      } else {
        showSaveMessage('שגיאה בשמירה');
      }
    } catch (error) {
      console.error('Error saving hours:', error);
      showSaveMessage('שגיאה בשמירה');
    } finally {
      setIsSaving(false);
    }
  };

  // Image upload handlers
  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'logo' | 'cover' | 'gallery'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const url = await uploadImage(file, business.id, type);
      if (!url) {
        showSaveMessage('שגיאה בהעלאת התמונה');
        return;
      }

      if (type === 'logo') {
        await updateBusiness(business.id, { logo_url: url });
        setLogoUrl(url);
        showSaveMessage('הלוגו עודכן!');
      } else if (type === 'cover') {
        await updateBusiness(business.id, { cover_image_url: url });
        setCoverUrl(url);
        showSaveMessage('תמונת הכיסוי עודכנה!');
      } else if (type === 'gallery') {
        const galleryImage = await addGalleryImage(business.id, url);
        if (galleryImage) {
          setGallery(prev => [...prev, galleryImage]);
          showSaveMessage('התמונה נוספה לגלריה!');
        }
      }
    } catch (error) {
      console.error('Error uploading:', error);
      showSaveMessage('שגיאה בהעלאה');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteGalleryImage = async (image: GalleryImage) => {
    if (!confirm('למחוק את התמונה?')) return;

    try {
      await deleteGalleryImage(image.id);
      setGallery(prev => prev.filter(g => g.id !== image.id));
      showSaveMessage('התמונה נמחקה');
    } catch (error) {
      console.error('Error deleting gallery image:', error);
    }
  };

  const handleSaveSlug = async () => {
    if (slug === business.slug) return;

    // Validate slug format
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(slug)) {
      showSaveMessage('הכתובת יכולה להכיל רק אותיות קטנות באנגלית, מספרים ומקפים');
      return;
    }

    setIsSaving(true);
    try {
      const result = await updateBusinessSlug(business.id, slug);
      if (result.success) {
        // Update session with new slug
        const session = getSession();
        if (session) {
          saveAdminSession({ ...session, businessSlug: slug });
        }
        showSaveMessage('הכתובת עודכנה! מעביר לכתובת החדשה...');
        setTimeout(() => {
          router.push(`/${slug}/admin/settings`);
        }, 1500);
      } else {
        showSaveMessage(result.error || 'שגיאה בעדכון');
      }
    } catch (error) {
      console.error('Error updating slug:', error);
      showSaveMessage('שגיאה בעדכון');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pb-20">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 py-4 max-w-lg mx-auto">
          <Link
            href={`/${business.slug}/admin`}
            className="p-2.5 -mr-2 hover:bg-gray-100 rounded-xl transition-all duration-200"
          >
            <ArrowRightIcon className="w-5 h-5 text-gray-600" />
          </Link>
          <h1 className="font-bold text-lg text-gray-900">הגדרות עסק</h1>
          <div className="w-10" />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-4 pb-4 max-w-lg mx-auto overflow-x-auto">
          {[
            { id: 'info', label: 'פרטים' },
            { id: 'appearance', label: 'מראה' },
            { id: 'services', label: 'שירותים' },
            { id: 'hours', label: 'שעות' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`
                flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all
                ${activeTab === tab.id
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* Save message toast */}
      {saveMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-green-500 text-white px-6 py-3 rounded-xl shadow-lg animate-fade-in flex items-center gap-2">
          <CheckIcon className="w-5 h-5" />
          {saveMessage}
        </div>
      )}

      <main className="px-4 py-6 max-w-lg mx-auto">
        {/* Business Info Tab */}
        {activeTab === 'info' && (
          <div className="space-y-4 animate-fade-in">
            <div className="bg-white rounded-2xl p-5 shadow-lg shadow-gray-200/50 border border-gray-100">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">שם העסק</label>
                  <input
                    type="text"
                    value={businessInfo.name}
                    onChange={(e) => setBusinessInfo(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">תיאור</label>
                  <textarea
                    value={businessInfo.description}
                    onChange={(e) => setBusinessInfo(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">כתובת</label>
                  <input
                    type="text"
                    value={businessInfo.address}
                    onChange={(e) => setBusinessInfo(prev => ({ ...prev, address: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">טלפון</label>
                  <input
                    type="tel"
                    value={businessInfo.phone}
                    onChange={(e) => setBusinessInfo(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">WhatsApp</label>
                  <input
                    type="tel"
                    value={businessInfo.whatsapp}
                    onChange={(e) => setBusinessInfo(prev => ({ ...prev, whatsapp: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Instagram</label>
                  <input
                    type="text"
                    value={businessInfo.instagram}
                    onChange={(e) => setBusinessInfo(prev => ({ ...prev, instagram: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    dir="ltr"
                    placeholder="@username"
                  />
                </div>
              </div>
            </div>

            <Button
              onClick={handleSaveBusinessInfo}
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isSaving}
            >
              שמור שינויים
            </Button>
          </div>
        )}

        {/* Services Tab */}
        {activeTab === 'services' && (
          <div className="space-y-4 animate-fade-in">
            {/* Existing services */}
            {services.map((service) => (
              <div
                key={service.id}
                className="bg-white rounded-2xl p-4 shadow-lg shadow-gray-200/50 border border-gray-100"
              >
                <div className="flex justify-between items-start gap-3">
                  <button
                    onClick={() => handleDeleteService(service.id)}
                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>

                  <div className="flex-1 space-y-3">
                    <input
                      type="text"
                      value={service.name}
                      onChange={(e) => handleUpdateService(service.id, { name: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-right font-medium"
                    />
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <label className="text-xs text-gray-500">מחיר (₪)</label>
                        <input
                          type="number"
                          value={service.price}
                          onChange={(e) => handleUpdateService(service.id, { price: Number(e.target.value) })}
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-center"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-xs text-gray-500">משך (דקות)</label>
                        <input
                          type="number"
                          value={service.duration}
                          onChange={(e) => handleUpdateService(service.id, { duration: Number(e.target.value) })}
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-center"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Add new service */}
            <div className="bg-blue-50 rounded-2xl p-4 border-2 border-dashed border-blue-200">
              <h3 className="font-medium text-blue-900 mb-3 flex items-center gap-2">
                <PlusIcon className="w-5 h-5" />
                הוסף שירות חדש
              </h3>
              <div className="space-y-3">
                <input
                  type="text"
                  value={newService.name}
                  onChange={(e) => setNewService(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="שם השירות"
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl"
                />
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="text-xs text-gray-500">מחיר (₪)</label>
                    <input
                      type="number"
                      value={newService.price || ''}
                      onChange={(e) => setNewService(prev => ({ ...prev, price: Number(e.target.value) }))}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-center"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-gray-500">משך (דקות)</label>
                    <input
                      type="number"
                      value={newService.duration}
                      onChange={(e) => setNewService(prev => ({ ...prev, duration: Number(e.target.value) }))}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-center"
                    />
                  </div>
                </div>
                <Button
                  onClick={handleAddService}
                  variant="primary"
                  fullWidth
                  isLoading={isSaving}
                >
                  הוסף שירות
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Hours Tab */}
        {activeTab === 'hours' && (
          <div className="space-y-4 animate-fade-in">
            {/* Slot Interval Selector */}
            <div className="bg-white rounded-2xl p-5 shadow-lg shadow-gray-200/50 border border-gray-100">
              <h3 className="font-bold text-gray-800 mb-3">מרווח זמן בין תורים</h3>
              <p className="text-sm text-gray-500 mb-4">בחר את משך הזמן המינימלי בין תורים</p>
              <div className="flex gap-2">
                {[15, 20, 30].map((interval) => (
                  <button
                    key={interval}
                    onClick={() => setSlotInterval(interval)}
                    className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                      slotInterval === interval
                        ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {interval} דק׳
                  </button>
                ))}
              </div>
            </div>

            {/* Daily Hours */}
            <div className="bg-white rounded-2xl p-5 shadow-lg shadow-gray-200/50 border border-gray-100">
              <h3 className="font-bold text-gray-800 mb-4">שעות פעילות</h3>
              <div className="space-y-4">
                {hours.map((day, index) => (
                  <div
                    key={index}
                    className={`flex items-center gap-3 py-3 ${index < hours.length - 1 ? 'border-b border-gray-100' : ''}`}
                  >
                    <div className="w-16 font-medium text-gray-700">{DAYS[index]}</div>
                    
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={day.is_closed}
                        onChange={(e) => {
                          const newHours = [...hours];
                          newHours[index].is_closed = e.target.checked;
                          setHours(newHours);
                        }}
                        className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-500">סגור</span>
                    </label>

                    {!day.is_closed && (
                      <div className="flex flex-col gap-2 flex-1">
                        {/* Working hours */}
                        <div className="flex items-center gap-2 justify-end">
                          <input
                            type="time"
                            value={day.close_time || '18:00'}
                            onChange={(e) => {
                              const newHours = [...hours];
                              newHours[index].close_time = e.target.value;
                              setHours(newHours);
                            }}
                            className="px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                          />
                          <span className="text-gray-400">-</span>
                          <input
                            type="time"
                            value={day.open_time || '09:00'}
                            onChange={(e) => {
                              const newHours = [...hours];
                              newHours[index].open_time = e.target.value;
                              setHours(newHours);
                            }}
                            className="px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                          />
                        </div>
                        
                        {/* Break hours */}
                        <div className="flex items-center gap-2 justify-end">
                          <label className="flex items-center gap-1 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={!!(day.break_start && day.break_end)}
                              onChange={(e) => {
                                const newHours = [...hours];
                                if (e.target.checked) {
                                  newHours[index].break_start = '12:00';
                                  newHours[index].break_end = '13:00';
                                } else {
                                  newHours[index].break_start = null;
                                  newHours[index].break_end = null;
                                }
                                setHours(newHours);
                              }}
                              className="w-3 h-3 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                            />
                            <span className="text-xs text-orange-600">הפסקה</span>
                          </label>
                          
                          {day.break_start && day.break_end && (
                            <>
                              <input
                                type="time"
                                value={day.break_end}
                                onChange={(e) => {
                                  const newHours = [...hours];
                                  newHours[index].break_end = e.target.value;
                                  setHours(newHours);
                                }}
                                className="px-2 py-1 bg-orange-50 border border-orange-200 rounded-lg text-sm w-24"
                              />
                              <span className="text-orange-400">-</span>
                              <input
                                type="time"
                                value={day.break_start}
                                onChange={(e) => {
                                  const newHours = [...hours];
                                  newHours[index].break_start = e.target.value;
                                  setHours(newHours);
                                }}
                                className="px-2 py-1 bg-orange-50 border border-orange-200 rounded-lg text-sm w-24"
                              />
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <Button
              onClick={handleSaveHours}
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isSaving}
            >
              שמור שעות פעילות
            </Button>
          </div>
        )}

        {/* Appearance Tab */}
        {activeTab === 'appearance' && (
          <div className="space-y-6 animate-fade-in">
            {/* Theme Selector */}
            <div className="bg-white rounded-2xl p-5 shadow-lg shadow-gray-200/50 border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-4">ערכת נושא</h3>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                {([
                  { id: 'light', name: 'בהיר', colors: 'from-blue-500 to-indigo-600', bg: 'bg-gray-50' },
                  { id: 'dark', name: 'כהה', colors: 'from-purple-500 to-cyan-500', bg: 'bg-gray-900' },
                  { id: 'ocean', name: 'אוקיינוס', colors: 'from-cyan-500 to-blue-600', bg: 'bg-cyan-50' },
                  { id: 'sunset', name: 'שקיעה', colors: 'from-orange-500 to-pink-600', bg: 'bg-orange-50' },
                  { id: 'forest', name: 'יער', colors: 'from-emerald-500 to-green-600', bg: 'bg-emerald-50' },
                  { id: 'rose', name: 'ורוד', colors: 'from-pink-400 to-rose-500', bg: 'bg-pink-50' },
                  { id: 'modern', name: 'מודרני', colors: 'from-violet-500 via-purple-500 to-fuchsia-500', bg: 'bg-gray-900' },
                ] as const).map((theme) => (
                  <button
                    key={theme.id}
                    onClick={async () => {
                      setSelectedTheme(theme.id);
                      setIsSaving(true);
                      try {
                        await updateBusiness(business.id, { theme: theme.id });
                        showSaveMessage('ערכת הנושא נשמרה!');
                      } catch {
                        showSaveMessage('שגיאה בשמירה');
                      } finally {
                        setIsSaving(false);
                      }
                    }}
                    className={`relative flex flex-col items-center p-3 rounded-xl border-2 transition-all ${
                      selectedTheme === theme.id
                        ? 'border-blue-500 shadow-lg scale-105'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-lg ${theme.bg} flex items-center justify-center mb-2 overflow-hidden`}>
                      <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${theme.colors}`} />
                    </div>
                    <span className="text-xs font-medium text-gray-700">{theme.name}</span>
                    {selectedTheme === theme.id && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                        <CheckIcon className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* URL/Slug */}
            <div className="bg-white rounded-2xl p-5 shadow-lg shadow-gray-200/50 border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-4">כתובת האתר</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-left"
                  dir="ltr"
                  placeholder="my-business"
                />
                <Button
                  onClick={handleSaveSlug}
                  variant="outline"
                  isLoading={isSaving}
                  disabled={slug === business.slug}
                >
                  שמור
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-2" dir="ltr">
                queueapp.com/{slug}
              </p>
            </div>

            {/* Logo */}
            <div className="bg-white rounded-2xl p-5 shadow-lg shadow-gray-200/50 border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-4">לוגו</h3>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden">
                  {logoUrl ? (
                    <img src={logoUrl} alt="לוגו" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl text-gray-400">{business.name.charAt(0)}</span>
                  )}
                </div>
                <label className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, 'logo')}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    fullWidth
                    isLoading={isUploading}
                    className="cursor-pointer"
                    onClick={(e) => {
                      e.preventDefault();
                      (e.currentTarget.previousElementSibling as HTMLInputElement)?.click();
                    }}
                  >
                    {logoUrl ? 'החלף לוגו' : 'העלה לוגו'}
                  </Button>
                </label>
              </div>
            </div>

            {/* Cover Image */}
            <div className="bg-white rounded-2xl p-5 shadow-lg shadow-gray-200/50 border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-4">תמונת כיסוי</h3>
              <div className="space-y-3">
                <div className="w-full h-32 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden">
                  {coverUrl ? (
                    <img src={coverUrl} alt="כיסוי" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-gray-400">אין תמונת כיסוי</span>
                  )}
                </div>
                <label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, 'cover')}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    fullWidth
                    isLoading={isUploading}
                    className="cursor-pointer"
                    onClick={(e) => {
                      e.preventDefault();
                      (e.currentTarget.previousElementSibling as HTMLInputElement)?.click();
                    }}
                  >
                    {coverUrl ? 'החלף תמונה' : 'העלה תמונת כיסוי'}
                  </Button>
                </label>
              </div>
            </div>

            {/* Gallery */}
            <div className="bg-white rounded-2xl p-5 shadow-lg shadow-gray-200/50 border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-4">גלריה</h3>
              
              {gallery.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {gallery.map((image) => (
                    <div key={image.id} className="relative aspect-square">
                      <img
                        src={image.image_url}
                        alt="גלריה"
                        className="w-full h-full object-cover rounded-lg"
                      />
                      <button
                        onClick={() => handleDeleteGalleryImage(image)}
                        className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                      >
                        <TrashIcon className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, 'gallery')}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  fullWidth
                  isLoading={isUploading}
                  className="cursor-pointer"
                  onClick={(e) => {
                    e.preventDefault();
                    (e.currentTarget.previousElementSibling as HTMLInputElement)?.click();
                  }}
                >
                  <PlusIcon className="w-5 h-5" />
                  הוסף תמונה לגלריה
                </Button>
              </label>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
