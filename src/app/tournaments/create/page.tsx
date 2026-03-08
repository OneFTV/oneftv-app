'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { useTranslation } from '@/contexts/TranslationContext';
import StepWizard from '@/components/forms/StepWizard';
import CapacityCalculator from '@/components/tournament/CapacityCalculator';
import CategoryManager, { type CategoryData } from '@/components/tournament/CategoryManager';

interface FormData {
  // Step 1 — Basics
  name: string;
  description: string;
  location: string;
  city: string;
  state: string;
  country: string;
  startDate: string;
  endDate: string;
  // Step 2 — Infrastructure
  numCourts: number;
  numReferees: number;
  numDays: number;
  hoursPerDay: number;
  avgGameMinutes: number;
  // Step 4 — Categories
  allowMultiCategory: boolean;
  // Step 5 — Payment & Contact
  stripeConnect: boolean;
  venmoHandle: string;
  zelleInfo: string;
  bannerUrl: string;
  contactEmail: string;
  contactPhone: string;
}

interface FormErrors {
  [key: string]: string;
}

const COUNTRIES = [
  'United States', 'Brazil', 'Portugal', 'Spain', 'France',
  'Italy', 'Germany', 'Mexico', 'Australia', 'United Kingdom', 'Other',
];

const WIZARD_STEPS = [
  { title: 'Template & Categories', description: 'Choose a template and add categories' },
  { title: 'Basics', description: 'Tournament name, location, and dates' },
  { title: 'Infrastructure', description: 'Courts, referees, and schedule' },
  { title: 'Capacity', description: 'Review your tournament capacity' },
  { title: 'Payment & Confirm', description: 'Payment setup and review' },
];

const inputClass = "w-full px-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all";
const labelClass = "block text-sm font-medium text-slate-300 mb-1";
const cardClass = "bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-blue-400/20 rounded-xl p-6";

export default function CreateTournamentPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [successMessage, setSuccessMessage] = useState('');
  const [user, setUser] = useState<{ id: string; name: string } | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [activeTemplate, setActiveTemplate] = useState<string>('');

  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    location: '',
    city: '',
    state: '',
    country: 'United States',
    startDate: '',
    endDate: '',
    numCourts: 4,
    numReferees: 4,
    numDays: 1,
    hoursPerDay: 9,
    avgGameMinutes: 20,
    allowMultiCategory: false,
    stripeConnect: false,
    venmoHandle: '',
    zelleInfo: '',
    bannerUrl: '',
    contactEmail: '',
    contactPhone: '',
  });

  // Auto-calculate numDays from dates
  useEffect(() => {
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      const diffTime = end.getTime() - start.getTime();
      const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);
      if (diffDays !== formData.numDays) {
        setFormData(prev => ({ ...prev, numDays: diffDays }));
      }
    }
  }, [formData.startDate, formData.endDate]);

  // Capacity calculation
  const capacity = useMemo(() => {
    const simultaneous = Math.min(formData.numCourts, formData.numReferees);
    const slotsPerDay = Math.floor((formData.hoursPerDay * 60) / formData.avgGameMinutes);
    const total = simultaneous * formData.numDays * slotsPerDay;
    // Rough max teams estimate (bracket ~2.5 games/team)
    const maxTeams = Math.floor(total / 2.5);
    return { simultaneous, total, maxTeams };
  }, [formData.numCourts, formData.numReferees, formData.numDays, formData.hoursPerDay, formData.avgGameMinutes]);

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

  const applyNFATemplate = () => {
    setFormData((prev) => ({
      ...prev,
      numCourts: 6,
      numReferees: 6,
      numDays: 2,
      hoursPerDay: 9,
      avgGameMinutes: 20,
    }));
    setActiveTemplate('nfa');
  };

  const validateStep = (step: number): boolean => {
    const newErrors: FormErrors = {};

    if (step === 0) {
      if (categories.length === 0) newErrors.categories = 'Add at least one category';
      categories.forEach((cat, i) => {
        if (!cat.name.trim()) newErrors[`cat_${i}_name`] = `Category ${i + 1} needs a name`;
      });
    }

    if (step === 1) {
      if (!formData.name.trim()) newErrors.name = 'Tournament name is required';
      if (!formData.city.trim()) newErrors.city = 'City is required';
      if (!formData.startDate) newErrors.startDate = 'Start date is required';
      if (!formData.endDate) newErrors.endDate = 'End date is required';
      if (formData.startDate && formData.endDate && new Date(formData.startDate) > new Date(formData.endDate)) {
        newErrors.endDate = 'End date must be after start date';
      }
    }

    if (step === 2) {
      if (formData.numCourts < 1) newErrors.numCourts = 'At least 1 court required';
      if (formData.numReferees < 1) newErrors.numReferees = 'At least 1 referee required';
      if (formData.numDays < 1) newErrors.numDays = 'At least 1 day required';
      if (formData.hoursPerDay < 1) newErrors.hoursPerDay = 'At least 1 hour per day';
      if (formData.avgGameMinutes < 5) newErrors.avgGameMinutes = 'Min 5 minutes per game';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, WIZARD_STEPS.length - 1));
    }
  };

  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 0));

  const goToStep = (step: number) => {
    if (step < currentStep) setCurrentStep(step);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const numericFields = ['numCourts', 'numReferees', 'numDays', 'hoursPerDay', 'avgGameMinutes'];
    setFormData((prev) => ({
      ...prev,
      [name]: numericFields.includes(name) ? (parseInt(value, 10) || 0) : value,
    }));
    if (errors[name]) {
      setErrors((prev) => { const n = { ...prev }; delete n[name]; return n; });
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    setSubmitting(true);
    setSuccessMessage('');
    setErrors({});

    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        location: formData.location || formData.city,
        city: formData.city,
        state: formData.state,
        country: formData.country,
        startDate: formData.startDate,
        endDate: formData.endDate,
        courts: formData.numCourts,
        days: formData.numDays,
        hoursPerDay: formData.hoursPerDay,
        avgGameDuration: formData.avgGameMinutes,
        numReferees: formData.numReferees,
        allowMultiCategory: categories.length > 1 || formData.allowMultiCategory,
        venmoHandle: formData.venmoHandle || undefined,
        zelleInfo: formData.zelleInfo || undefined,
        bannerUrl: formData.bannerUrl || undefined,
        contactEmail: formData.contactEmail || undefined,
        contactPhone: formData.contactPhone || undefined,
        categories: categories.map((cat, i) => ({
          name: cat.name,
          format: cat.format,
          gender: cat.gender || undefined,
          skillLevel: cat.skillLevel || undefined,
          maxTeams: cat.maxTeams,
          pointsPerSet: 18,
          numSets: 1,
          groupSize: 4,
          proLeague: false,
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
          throw new Error(Object.values(fieldErrors).join('; '));
        }
        throw new Error(errorData.error || 'Failed to create tournament');
      }

      const created = await response.json();
      setSuccessMessage('Tournament created successfully!');
      setTimeout(() => router.push(`/tournaments/${created.id}`), 1500);
    } catch (err) {
      setErrors({ submit: err instanceof Error ? err.message : 'Failed to create tournament' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader className="mx-auto h-12 w-12 text-cyan-400 animate-spin mb-4" />
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const totalAllocated = categories.reduce((sum, c) => sum + c.maxTeams, 0);
  const isOverCapacity = totalAllocated > capacity.maxTeams;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-blue-900 to-slate-900 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Create Tournament</h1>
          <p className="text-slate-400">Set up your tournament in 5 easy steps</p>
        </div>

        {successMessage && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl flex items-center gap-3 text-green-300">
            <CheckCircle size={20} />
            {successMessage}
          </div>
        )}
        {errors.submit && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3 text-red-300">
            <AlertCircle size={20} />
            {errors.submit}
          </div>
        )}

        <StepWizard steps={WIZARD_STEPS} currentStep={currentStep} onStepClick={goToStep}>
          {/* ─── STEP 1: Template & Categories ─── */}
          {currentStep === 0 && (
            <div className="space-y-6">
              {/* Template Selection */}
              <div className={cardClass}>
                <h3 className="text-lg font-semibold text-white mb-4">Choose a Template</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button type="button" onClick={() => { applyNFATemplate(); }}
                    className={`p-4 rounded-xl border-2 text-left transition ${activeTemplate === 'nfa' ? 'border-amber-400 bg-amber-500/10' : 'border-slate-600/50 bg-slate-800/30 hover:border-slate-500'}`}>
                    <p className="text-sm font-semibold text-amber-300">🏐 NFA Tournament</p>
                    <p className="text-xs text-slate-400 mt-1">Pre-configured: 6 courts, 6 refs, 2 days, 9h/day, 20min games</p>
                  </button>
                  <button type="button" onClick={() => setActiveTemplate('custom')}
                    className={`p-4 rounded-xl border-2 text-left transition ${activeTemplate === 'custom' ? 'border-cyan-400 bg-cyan-500/10' : 'border-slate-600/50 bg-slate-800/30 hover:border-slate-500'}`}>
                    <p className="text-sm font-semibold text-cyan-300">⚙️ Custom Tournament</p>
                    <p className="text-xs text-slate-400 mt-1">Configure everything from scratch</p>
                  </button>
                </div>
              </div>

              {/* Categories */}
              <CategoryManager
                categories={categories}
                onChange={setCategories}
                maxCapacity={capacity.maxTeams}
                template={activeTemplate}
              />
              {errors.categories && <p className="text-red-400 text-sm">{errors.categories}</p>}

              {/* Multi-category toggle */}
              {categories.length > 1 && (
                <div className={cardClass}>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium text-slate-300">Allow Multi-Category Registration</span>
                      <p className="text-xs text-slate-500 mt-0.5">Players can register in multiple categories</p>
                    </div>
                    <button type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, allowMultiCategory: !prev.allowMultiCategory }))}
                      className={`relative w-11 h-6 rounded-full transition ${formData.allowMultiCategory ? 'bg-blue-600' : 'bg-slate-600'}`}>
                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-slate-200 rounded-full shadow transition-transform ${formData.allowMultiCategory ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─── STEP 2: Basics ─── */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className={cardClass}>
                <h3 className="text-lg font-semibold text-white mb-4">Tournament Info</h3>
                <div className="space-y-4">
                  <div>
                    <label className={labelClass}>Tournament Name *</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange}
                      className={inputClass} placeholder="e.g. Austin Beach Open 2026" />
                    {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
                  </div>
                  <div>
                    <label className={labelClass}>Description</label>
                    <textarea name="description" value={formData.description} onChange={handleChange}
                      rows={2} className={inputClass} placeholder="Brief description of the event" />
                  </div>
                </div>
              </div>

              <div className={cardClass}>
                <h3 className="text-lg font-semibold text-white mb-4">Location</h3>
                <div className="space-y-4">
                  <div>
                    <label className={labelClass}>Venue Name</label>
                    <input type="text" name="location" value={formData.location} onChange={handleChange}
                      className={inputClass} placeholder="e.g. Zilker Park Beach Courts" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className={labelClass}>City *</label>
                      <input type="text" name="city" value={formData.city} onChange={handleChange}
                        className={inputClass} placeholder="Austin" />
                      {errors.city && <p className="text-red-400 text-sm mt-1">{errors.city}</p>}
                    </div>
                    <div>
                      <label className={labelClass}>State</label>
                      <input type="text" name="state" value={formData.state} onChange={handleChange}
                        className={inputClass} placeholder="TX" />
                    </div>
                    <div>
                      <label className={labelClass}>Country</label>
                      <select name="country" value={formData.country} onChange={handleChange} className={inputClass}>
                        {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className={cardClass}>
                <h3 className="text-lg font-semibold text-white mb-4">Dates</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Start Date *</label>
                    <input type="date" name="startDate" value={formData.startDate} onChange={handleChange}
                      className={inputClass} />
                    {errors.startDate && <p className="text-red-400 text-sm mt-1">{errors.startDate}</p>}
                  </div>
                  <div>
                    <label className={labelClass}>End Date *</label>
                    <input type="date" name="endDate" value={formData.endDate} onChange={handleChange}
                      className={inputClass} />
                    {errors.endDate && <p className="text-red-400 text-sm mt-1">{errors.endDate}</p>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── STEP 3: Infrastructure ─── */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className={cardClass}>
                <h3 className="text-lg font-semibold text-white mb-4">Courts & Referees</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className={labelClass}>Number of Courts</label>
                    <div className="flex items-center gap-4">
                      <input type="range" name="numCourts" min={1} max={20}
                        value={formData.numCourts} onChange={handleChange}
                        className="flex-1 accent-blue-500" />
                      <span className="text-2xl font-bold text-white w-10 text-right">{formData.numCourts}</span>
                    </div>
                    {errors.numCourts && <p className="text-red-400 text-sm mt-1">{errors.numCourts}</p>}
                  </div>
                  <div>
                    <label className={labelClass}>Number of Referees</label>
                    <div className="flex items-center gap-4">
                      <input type="range" name="numReferees" min={1} max={20}
                        value={formData.numReferees} onChange={handleChange}
                        className="flex-1 accent-purple-500" />
                      <span className="text-2xl font-bold text-white w-10 text-right">{formData.numReferees}</span>
                    </div>
                    {errors.numReferees && <p className="text-red-400 text-sm mt-1">{errors.numReferees}</p>}
                  </div>
                </div>
              </div>

              <div className={cardClass}>
                <h3 className="text-lg font-semibold text-white mb-4">Schedule</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className={labelClass}>Number of Days</label>
                    <input type="number" name="numDays" value={formData.numDays} onChange={handleChange}
                      min={1} max={14} className={inputClass} />
                    {errors.numDays && <p className="text-red-400 text-sm mt-1">{errors.numDays}</p>}
                  </div>
                  <div>
                    <label className={labelClass}>Hours per Day</label>
                    <input type="number" name="hoursPerDay" value={formData.hoursPerDay} onChange={handleChange}
                      min={1} max={16} className={inputClass} />
                    {errors.hoursPerDay && <p className="text-red-400 text-sm mt-1">{errors.hoursPerDay}</p>}
                  </div>
                  <div>
                    <label className={labelClass}>Avg Game Duration (min)</label>
                    <input type="number" name="avgGameMinutes" value={formData.avgGameMinutes} onChange={handleChange}
                      min={5} max={120} className={inputClass} />
                    {errors.avgGameMinutes && <p className="text-red-400 text-sm mt-1">{errors.avgGameMinutes}</p>}
                  </div>
                </div>
              </div>

              {/* Mini preview */}
              <div className="bg-cyan-500/10 border border-cyan-400/30 rounded-xl p-4 text-center">
                <p className="text-sm text-cyan-300">
                  Quick preview: <strong>{capacity.total} total games</strong> possible ({capacity.simultaneous} simultaneous)
                </p>
              </div>
            </div>
          )}

          {/* ─── STEP 4: Capacity Calculator ─── */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <CapacityCalculator
                courts={formData.numCourts}
                referees={formData.numReferees}
                days={formData.numDays}
                hoursPerDay={formData.hoursPerDay}
                avgGameMinutes={formData.avgGameMinutes}
              />
              <div className="bg-slate-800/40 border border-slate-600/30 rounded-lg p-4 text-center">
                <p className="text-sm text-slate-400">
                  Need to adjust? Go back to <button type="button" onClick={() => setCurrentStep(2)}
                    className="text-blue-400 underline hover:text-blue-300">Infrastructure</button> to change values.
                </p>
              </div>
            </div>
          )}

          {/* ─── STEP 5: Payment & Confirmation ─── */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className={cardClass}>
                <h3 className="text-lg font-semibold text-white mb-4">Payment Methods</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                    <div>
                      <span className="text-sm font-medium text-slate-300">Stripe Connect</span>
                      <p className="text-xs text-slate-500 mt-0.5">Accept credit card payments online</p>
                    </div>
                    <button type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, stripeConnect: !prev.stripeConnect }))}
                      className={`relative w-11 h-6 rounded-full transition ${formData.stripeConnect ? 'bg-blue-600' : 'bg-slate-600'}`}>
                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-slate-200 rounded-full shadow transition-transform ${formData.stripeConnect ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>
                  <div>
                    <label className={labelClass}>Venmo Handle</label>
                    <input type="text" name="venmoHandle" value={formData.venmoHandle} onChange={handleChange}
                      className={inputClass} placeholder="@your-venmo" />
                  </div>
                  <div>
                    <label className={labelClass}>Zelle Info</label>
                    <input type="text" name="zelleInfo" value={formData.zelleInfo} onChange={handleChange}
                      className={inputClass} placeholder="Email or phone for Zelle" />
                  </div>
                </div>
              </div>

              <div className={cardClass}>
                <h3 className="text-lg font-semibold text-white mb-4">Contact & Branding</h3>
                <div className="space-y-4">
                  <div>
                    <label className={labelClass}>Banner Image URL</label>
                    <input type="text" name="bannerUrl" value={formData.bannerUrl} onChange={handleChange}
                      className={inputClass} placeholder="https://..." />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Contact Email</label>
                      <input type="email" name="contactEmail" value={formData.contactEmail} onChange={handleChange}
                        className={inputClass} placeholder="organizer@email.com" />
                    </div>
                    <div>
                      <label className={labelClass}>Contact Phone</label>
                      <input type="tel" name="contactPhone" value={formData.contactPhone} onChange={handleChange}
                        className={inputClass} placeholder="+1 (555) 123-4567" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Review Summary */}
              <div className="bg-blue-500/10 border border-blue-400/30 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-blue-300 mb-3">📋 Review Summary</h3>
                <div className="space-y-2 text-sm text-blue-200">
                  <p><strong>Tournament:</strong> {formData.name || '—'}</p>
                  <p><strong>Location:</strong> {[formData.location, formData.city, formData.state, formData.country].filter(Boolean).join(', ') || '—'}</p>
                  <p><strong>Dates:</strong> {formData.startDate || '—'} → {formData.endDate || '—'}</p>
                  <p><strong>Infrastructure:</strong> {formData.numCourts} courts, {formData.numReferees} referees, {formData.numDays} day{formData.numDays !== 1 ? 's' : ''}, {formData.hoursPerDay}h/day</p>
                  <p><strong>Capacity:</strong> {capacity.total} games, ~{capacity.maxTeams} max teams</p>
                  <p><strong>Categories:</strong> {categories.length}</p>
                  {categories.map((cat, i) => (
                    <p key={i} className="ml-4">— {cat.name} ({cat.format}, {cat.maxTeams} teams)</p>
                  ))}
                  <p className={isOverCapacity ? 'text-red-400 font-semibold' : ''}><strong>Teams allocated:</strong> {totalAllocated} of {capacity.maxTeams}{isOverCapacity && ' ⚠️ Over capacity! Reduce teams to proceed.'}</p>
                  {formData.venmoHandle && <p><strong>Venmo:</strong> {formData.venmoHandle}</p>}
                  {formData.zelleInfo && <p><strong>Zelle:</strong> {formData.zelleInfo}</p>}
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8">
            <button type="button"
              onClick={currentStep === 0 ? () => router.back() : prevStep}
              className="px-6 py-2.5 text-sm font-medium text-slate-300 border border-slate-600 rounded-lg hover:bg-slate-800 transition">
              {currentStep === 0 ? 'Cancel' : 'Back'}
            </button>

            {currentStep < WIZARD_STEPS.length - 1 ? (
              <button type="button" onClick={nextStep}
                className="px-6 py-2.5 text-sm font-medium text-slate-900 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-lg hover:shadow-lg hover:shadow-blue-500/50 transition-all">
                Next
              </button>
            ) : (
              <button type="button" onClick={handleSubmit} disabled={submitting || isOverCapacity}
                className="px-8 py-2.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                title={isOverCapacity ? `Over capacity: ${totalAllocated} teams allocated, max ${capacity.maxTeams}` : ''}>
                {submitting ? 'Creating...' : isOverCapacity ? '⚠️ Over Capacity' : '🚀 Create Tournament'}
              </button>
            )}
          </div>
        </StepWizard>
      </div>
    </div>
  );
}
