'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, CheckCircle, Loader, Plus, Layers } from 'lucide-react';
import { useTranslation } from '@/contexts/TranslationContext';
import StepWizard from '@/components/forms/StepWizard';
import CategoryCard, { type CategoryCardData } from '@/components/forms/CategoryCard';
import CategoryEditModal from '@/components/forms/CategoryEditModal';
import PricingLotForm, { type PricingLotData } from '@/components/forms/PricingLotForm';

interface CategoryTemplate {
  id: string;
  name: string;
  description: string;
  categories: CategoryCardData[];
}

interface FormData {
  name: string;
  description: string;
  location: string;
  city: string;
  state: string;
  country: string;
  startDate: string;
  endDate: string;
  courts: number;
  days: number;
  hoursPerDay: number;
  avgGameDuration: number;
  // Legacy single-format fields
  format: string;
  maxPlayers: number;
  pointsPerSet: number;
  sets: number;
  groupSize: number;
  proLeague: boolean;
  // Multi-category
  allowMultiCategory: boolean;
  refundPolicy: string;
  contactEmail: string;
  contactPhone: string;
}

interface FormErrors {
  [key: string]: string;
}

const COUNTRIES = [
  'Brazil', 'United States', 'Portugal', 'Spain', 'France',
  'Italy', 'Germany', 'Mexico', 'Australia', 'United Kingdom', 'Other',
];

// Wizard steps are built inside the component to access t()
const WIZARD_STEPS_STATIC = [
  { titleKey: 'tournaments.wizard_event', descKey: 'tournaments.wizard_event_desc' },
  { titleKey: 'tournaments.wizard_categories', descKey: 'tournaments.wizard_categories_desc' },
  { titleKey: 'tournaments.wizard_pricing', descKey: 'tournaments.wizard_pricing_desc' },
  { titleKey: 'tournaments.wizard_policies', descKey: 'tournaments.wizard_policies_desc' },
];

export default function CreateTournamentPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [successMessage, setSuccessMessage] = useState('');
  const [user, setUser] = useState<{ id: string; name: string } | null>(null);
  const [currentStep, setCurrentStep] = useState(0);

  // Categories state
  const [categories, setCategories] = useState<CategoryCardData[]>([]);
  const [templates, setTemplates] = useState<CategoryTemplate[]>([]);
  const [editingCategoryIndex, setEditingCategoryIndex] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Pricing lots state: categoryIndex -> lots[]
  const [pricingLots, setPricingLots] = useState<Record<number, PricingLotData[]>>({});

  const wizardSteps = WIZARD_STEPS_STATIC.map(s => ({
    title: t(s.titleKey),
    description: t(s.descKey),
  }));

  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    location: '',
    city: '',
    state: '',
    country: 'Brazil',
    startDate: '',
    endDate: '',
    courts: 2,
    days: 1,
    hoursPerDay: 8,
    avgGameDuration: 20,
    format: 'bracket',
    maxPlayers: 16,
    pointsPerSet: 18,
    sets: 1,
    groupSize: 4,
    proLeague: false,
    allowMultiCategory: false,
    refundPolicy: '',
    contactEmail: '',
    contactPhone: '',
  });

  // Check authentication
  useEffect(() => {
    const checkUser = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          setUser(data);
        } else {
          router.push('/login?redirect=/tournaments/create');
        }
      } catch {
        router.push('/login?redirect=/tournaments/create');
      } finally {
        setLoading(false);
      }
    };
    checkUser();
  }, [router]);

  // Load templates
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const res = await fetch('/api/templates');
        if (res.ok) {
          const data = await res.json();
          setTemplates(data.data || []);
        }
      } catch {
        // Templates are optional
      }
    };
    fetchTemplates();
  }, []);

  const validateStep = (step: number): boolean => {
    const newErrors: FormErrors = {};

    if (step === 0) {
      if (!formData.name.trim()) newErrors.name = t('tournaments.validation_name_required');
      if (!formData.location.trim()) newErrors.location = t('tournaments.validation_venue_required');
      if (!formData.city.trim()) newErrors.city = t('tournaments.validation_city_required');
      if (!formData.startDate) newErrors.startDate = t('tournaments.validation_start_required');
      if (!formData.endDate) newErrors.endDate = t('tournaments.validation_end_required');
      if (formData.startDate && formData.endDate && new Date(formData.startDate) > new Date(formData.endDate)) {
        newErrors.endDate = t('tournaments.validation_end_after_start');
      }
      if (formData.courts < 1) newErrors.courts = t('tournaments.validation_min_courts');
    }

    if (step === 1) {
      if (categories.length === 0) {
        newErrors.categories = t('tournaments.validation_add_category');
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, wizardSteps.length - 1));
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const goToStep = (step: number) => {
    if (step < currentStep) {
      setCurrentStep(step);
    }
  };

  const applyTemplate = (template: CategoryTemplate) => {
    setCategories(template.categories.map((c, i) => ({ ...c, sortOrder: i })));
    setFormData((prev) => ({
      ...prev,
      allowMultiCategory: template.categories.length > 1,
    }));
  };

  const addCategory = () => {
    setEditingCategoryIndex(null);
    setIsModalOpen(true);
  };

  const editCategory = (index: number) => {
    setEditingCategoryIndex(index);
    setIsModalOpen(true);
  };

  const removeCategory = (index: number) => {
    setCategories((prev) => prev.filter((_, i) => i !== index));
    // Clean up pricing lots
    setPricingLots((prev) => {
      const updated = { ...prev };
      delete updated[index];
      return updated;
    });
  };

  const saveCategory = (category: CategoryCardData) => {
    if (editingCategoryIndex !== null) {
      setCategories((prev) => prev.map((c, i) => (i === editingCategoryIndex ? category : c)));
    } else {
      setCategories((prev) => [...prev, { ...category, sortOrder: prev.length }]);
    }
    setIsModalOpen(false);
    setEditingCategoryIndex(null);
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    setSubmitting(true);
    setSuccessMessage('');
    setErrors({});

    try {
      const payload = {
        ...formData,
        format: categories.length === 1 ? categories[0].format : undefined,
        maxPlayers: categories.length === 1 ? categories[0].maxTeams : undefined,
        pointsPerSet: categories.length === 1 ? categories[0].pointsPerSet : undefined,
        allowMultiCategory: categories.length > 1,
        categories: categories.map((cat, i) => ({
          name: cat.name,
          format: cat.format,
          gender: cat.gender,
          skillLevel: cat.skillLevel,
          maxTeams: cat.maxTeams,
          pointsPerSet: cat.pointsPerSet,
          numSets: cat.numSets,
          groupSize: cat.groupSize,
          proLeague: cat.proLeague,
          sortOrder: i,
        })),
      };

      const response = await fetch('/api/tournaments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.details?.fieldErrors) {
          const fieldErrors: FormErrors = {};
          for (const [field, messages] of Object.entries(errorData.details.fieldErrors)) {
            fieldErrors[field] = (messages as string[]).join(', ');
          }
          setErrors(fieldErrors);
          throw new Error(
            Object.entries(errorData.details.fieldErrors)
              .map(([f, m]) => `${f}: ${(m as string[]).join(', ')}`)
              .join('; ') || errorData.error
          );
        }
        throw new Error(errorData.error || t('tournaments.create_error'));
      }

      const created = await response.json();
      setSuccessMessage(t('tournaments.create_success'));

      setTimeout(() => {
        router.push(`/tournaments/${created.id}`);
      }, 1500);
    } catch (err) {
      setErrors({
        submit: err instanceof Error ? err.message : t('tournaments.create_error'),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    const numericFields = ['courts', 'days', 'hoursPerDay', 'avgGameDuration', 'maxPlayers', 'pointsPerSet', 'groupSize', 'sets'];
    setFormData((prev) => ({
      ...prev,
      [name]: numericFields.includes(name) ? parseInt(value, 10) : value,
    }));
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="mx-auto h-12 w-12 text-blue-600 animate-spin mb-4" />
          <p className="text-gray-600">{t('tournaments.create_loading')}</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('tournaments.create_title')}</h1>
          <p className="text-gray-600">{t('tournaments.create_subtitle')}</p>
        </div>

        {/* Success/Error Messages */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3 text-green-800">
            <CheckCircle size={20} />
            {successMessage}
          </div>
        )}
        {errors.submit && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-800">
            <AlertCircle size={20} />
            {errors.submit}
          </div>
        )}

        <StepWizard
          steps={wizardSteps}
          currentStep={currentStep}
          onStepClick={goToStep}
        >
          {/* STEP 1: Event Info */}
          {currentStep === 0 && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('tournaments.basic_info')}</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('tournaments.field_name')}</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={t('tournaments.field_name_placeholder')}
                    />
                    {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('tournaments.field_description')}</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={t('tournaments.field_description_placeholder')}
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('tournaments.field_location')}</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('tournaments.field_venue')}</label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={t('tournaments.field_venue_placeholder')}
                    />
                    {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location}</p>}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('tournaments.field_city')}</label>
                      <input type="text" name="city" value={formData.city} onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('tournaments.field_state')}</label>
                      <input type="text" name="state" value={formData.state} onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('tournaments.field_country')}</label>
                      <select name="country" value={formData.country} onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                        {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('tournaments.dates_infrastructure')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('tournaments.field_start_date')}</label>
                    <input type="date" name="startDate" value={formData.startDate} onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    {errors.startDate && <p className="text-red-500 text-sm mt-1">{errors.startDate}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('tournaments.field_end_date')}</label>
                    <input type="date" name="endDate" value={formData.endDate} onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    {errors.endDate && <p className="text-red-500 text-sm mt-1">{errors.endDate}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('tournaments.field_courts')}</label>
                    <input type="number" name="courts" value={formData.courts} onChange={handleChange} min={1}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    {errors.courts && <p className="text-red-500 text-sm mt-1">{errors.courts}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('tournaments.field_days')}</label>
                    <input type="number" name="days" value={formData.days} onChange={handleChange} min={1}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('tournaments.field_hours_per_day')}</label>
                    <input type="number" name="hoursPerDay" value={formData.hoursPerDay} onChange={handleChange} min={1}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Categories */}
          {currentStep === 1 && (
            <div className="space-y-6">
              {/* Template Selector */}
              {templates.length > 0 && categories.length === 0 && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('tournaments.start_with_template')}</h3>
                  <p className="text-sm text-gray-500 mb-4">{t('tournaments.template_subtitle')}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {templates.map((tmpl) => (
                      <button
                        key={tmpl.id}
                        type="button"
                        onClick={() => applyTemplate(tmpl)}
                        className="text-left p-4 border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Layers size={16} className="text-blue-600" />
                          <span className="font-medium text-gray-900">{tmpl.name}</span>
                        </div>
                        <p className="text-xs text-gray-500">{tmpl.description}</p>
                        <p className="text-xs text-blue-600 mt-1">{tmpl.categories.length} {tmpl.categories.length === 1 ? 'category' : 'categories'}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Category List */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {t('tournaments.categories_count_label', { count: String(categories.length) })}
                  </h3>
                  <button
                    type="button"
                    onClick={addCategory}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition"
                  >
                    <Plus size={16} />
                    {t('tournaments.new_category')}
                  </button>
                </div>

                {errors.categories && (
                  <p className="text-red-500 text-sm mb-3">{errors.categories}</p>
                )}

                {categories.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <Layers size={40} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">{t('tournaments.no_categories')}</p>
                    <p className="text-xs mt-1">{t('tournaments.no_categories_hint')}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {categories.map((cat, index) => (
                      <CategoryCard
                        key={index}
                        category={cat}
                        index={index}
                        onEdit={editCategory}
                        onRemove={removeCategory}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Template reset if categories exist */}
              {categories.length > 0 && templates.length > 0 && (
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setCategories([]);
                      setPricingLots({});
                    }}
                    className="text-xs text-gray-400 hover:text-gray-600 transition"
                  >
                    {t('tournaments.clear_categories')}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Pricing Lots */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <p className="text-sm text-gray-500 mb-6">
                  {t('tournaments.pricing_subtitle')}
                </p>

                {categories.length === 0 ? (
                  <p className="text-gray-400 text-sm">{t('tournaments.no_categories_configured')}</p>
                ) : (
                  <div className="space-y-6 divide-y divide-gray-100">
                    {categories.map((cat, index) => (
                      <div key={index} className={index > 0 ? 'pt-6' : ''}>
                        <PricingLotForm
                          lots={pricingLots[index] || []}
                          categoryName={cat.name}
                          onChange={(lots) =>
                            setPricingLots((prev) => ({ ...prev, [index]: lots }))
                          }
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 4: Policies */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('tournaments.policies_title')}</h3>
                <div className="space-y-4">
                  {/* Multi-category toggle */}
                  {categories.length > 1 && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <span className="text-sm font-medium text-gray-700">{t('tournaments.allow_multi_category')}</span>
                        <p className="text-xs text-gray-500 mt-0.5">{t('tournaments.allow_multi_category_desc')}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, allowMultiCategory: !prev.allowMultiCategory }))}
                        className={`relative w-11 h-6 rounded-full transition ${
                          formData.allowMultiCategory ? 'bg-blue-600' : 'bg-gray-300'
                        }`}
                      >
                        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                          formData.allowMultiCategory ? 'translate-x-5' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('tournaments.refund_policy')}</label>
                    <textarea
                      name="refundPolicy"
                      value={formData.refundPolicy}
                      onChange={handleChange}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={t('tournaments.refund_policy_placeholder')}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('tournaments.contact_email')}</label>
                      <input
                        type="email"
                        name="contactEmail"
                        value={formData.contactEmail}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder={t('tournaments.contact_email_placeholder')}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('tournaments.contact_phone')}</label>
                      <input
                        type="tel"
                        name="contactPhone"
                        value={formData.contactPhone}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder={t('tournaments.contact_phone_placeholder')}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-3">{t('tournaments.summary')}</h3>
                <div className="space-y-2 text-sm text-blue-800">
                  <p><strong>{t('tournaments.wizard_event')}:</strong> {formData.name || '—'}</p>
                  <p><strong>{t('tournaments.field_location')}:</strong> {formData.location}, {formData.city}{formData.state ? `, ${formData.state}` : ''} - {formData.country}</p>
                  <p><strong>{t('tournaments.field_start_date').replace(' *', '')}:</strong> {formData.startDate || '—'} — {formData.endDate || '—'}</p>
                  <p><strong>{t('tournaments.dates_infrastructure')}:</strong> {formData.courts} {t('tournaments.field_courts').toLowerCase()}, {formData.days} {t('tournaments.field_days').toLowerCase()}, {formData.hoursPerDay}h/{t('tournaments.field_days').toLowerCase()}</p>
                  <p><strong>{t('tournaments.wizard_categories')}:</strong> {categories.length}</p>
                  {categories.map((cat, i) => (
                    <p key={i} className="ml-4">- {cat.name} ({cat.format}, {cat.maxTeams} duplas{cat.proLeague ? ', Pro League' : ''})</p>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-8">
            <button
              type="button"
              onClick={currentStep === 0 ? () => router.back() : prevStep}
              className="px-6 py-2.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              {currentStep === 0 ? t('tournaments.btn_cancel') : t('tournaments.btn_back')}
            </button>

            {currentStep < wizardSteps.length - 1 ? (
              <button
                type="button"
                onClick={nextStep}
                className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition"
              >
                {t('tournaments.btn_next')}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="px-8 py-2.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? t('tournaments.btn_creating') : t('tournaments.btn_create')}
              </button>
            )}
          </div>
        </StepWizard>

        {/* Category Edit Modal */}
        <CategoryEditModal
          isOpen={isModalOpen}
          category={editingCategoryIndex !== null ? categories[editingCategoryIndex] : null}
          onSave={saveCategory}
          onClose={() => {
            setIsModalOpen(false);
            setEditingCategoryIndex(null);
          }}
        />
      </div>
    </div>
  );
}
