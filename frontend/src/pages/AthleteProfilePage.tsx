import { useState, useEffect, useCallback, useMemo } from 'react';
import { athleteProfileApi, type AthleteProfile, type UpdateAthleteProfileRequest } from '../services/athleteProfileApi';

const FITNESS_LEVELS = ['beginner', 'intermediate', 'advanced', 'elite'] as const;

function toNumberOrNull(value: string): number | null {
  const n = parseFloat(value);
  return isNaN(n) ? null : n;
}

interface FormState {
  age: string;
  weightKg: string;
  heightCm: string;
  fitnessLevel: string;
  primarySport: string;
  trainingAgeYears: string;
  maxHeartRate: string;
  restingHeartRate: string;
  injuryNotes: string;
  weeklyAvailabilityHours: string;
  goals: string;
}

const EMPTY_FORM: FormState = {
  age: '', weightKg: '', heightCm: '', fitnessLevel: '', primarySport: '',
  trainingAgeYears: '', maxHeartRate: '', restingHeartRate: '',
  injuryNotes: '', weeklyAvailabilityHours: '', goals: '',
};

function profileToForm(profile: AthleteProfile): FormState {
  return {
    age: profile.age?.toString() ?? '',
    weightKg: profile.weightKg?.toString() ?? '',
    heightCm: profile.heightCm?.toString() ?? '',
    fitnessLevel: profile.fitnessLevel ?? '',
    primarySport: profile.primarySport ?? '',
    trainingAgeYears: profile.trainingAgeYears?.toString() ?? '',
    maxHeartRate: profile.maxHeartRate?.toString() ?? '',
    restingHeartRate: profile.restingHeartRate?.toString() ?? '',
    injuryNotes: profile.injuryNotes ?? '',
    weeklyAvailabilityHours: profile.weeklyAvailabilityHours?.toString() ?? '',
    goals: profile.goals ?? '',
  };
}

function formToRequest(form: FormState): UpdateAthleteProfileRequest {
  return {
    age: toNumberOrNull(form.age),
    weightKg: toNumberOrNull(form.weightKg),
    heightCm: toNumberOrNull(form.heightCm),
    fitnessLevel: form.fitnessLevel || null,
    primarySport: form.primarySport.trim() || null,
    trainingAgeYears: toNumberOrNull(form.trainingAgeYears),
    maxHeartRate: toNumberOrNull(form.maxHeartRate),
    restingHeartRate: toNumberOrNull(form.restingHeartRate),
    injuryNotes: form.injuryNotes.trim() || null,
    weeklyAvailabilityHours: toNumberOrNull(form.weeklyAvailabilityHours),
    goals: form.goals.trim() || null,
  };
}

export default function AthleteProfilePage() {
  const [savedForm, setSavedForm] = useState<FormState>(EMPTY_FORM);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDirty = useMemo(
    () => JSON.stringify(form) !== JSON.stringify(savedForm),
    [form, savedForm]
  );

  useEffect(() => {
    athleteProfileApi.getProfile()
      .then((profile) => {
        const f = profileToForm(profile);
        setSavedForm(f);
        setForm(f);
      })
      .catch(() => setError('Failed to load profile.'))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = useCallback((
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleEdit = useCallback(() => {
    setIsEditing(true);
    setError(null);
  }, []);

  const handleCancel = useCallback(() => {
    setForm(savedForm);
    setIsEditing(false);
    setError(null);
  }, [savedForm]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isDirty) return;
    setSaving(true);
    setError(null);
    try {
      await athleteProfileApi.updateProfile(formToRequest(form));
      setSavedForm(form);
      setIsEditing(false);
    } catch {
      setError('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [form, isDirty]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-50 overflow-y-auto">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Athlete Profile</h1>
          <p className="text-xs text-gray-500">Your coach uses this to personalise training plans</p>
        </div>
        {!isEditing && (
          <button
            type="button"
            onClick={handleEdit}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-teal-600
              border border-teal-200 rounded-xl hover:bg-teal-50 transition-colors"
          >
            <EditIcon />
            Edit
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex-1 px-4 py-4 space-y-6 max-w-lg mx-auto w-full">

        {/* Basics */}
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Basics</h2>
          <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100">

            <FieldRow label="Age" hint="years">
              <input
                type="number" name="age" value={form.age} onChange={handleChange}
                placeholder="e.g. 30" min={10} max={100}
                disabled={!isEditing}
                className={inputClass(isEditing)}
              />
            </FieldRow>

            <FieldRow label="Weight" hint="kg">
              <input
                type="number" name="weightKg" value={form.weightKg} onChange={handleChange}
                placeholder="e.g. 72.5" step="0.1" min={30} max={300}
                disabled={!isEditing}
                className={inputClass(isEditing)}
              />
            </FieldRow>

            <FieldRow label="Height" hint="cm">
              <input
                type="number" name="heightCm" value={form.heightCm} onChange={handleChange}
                placeholder="e.g. 178" min={100} max={250}
                disabled={!isEditing}
                className={inputClass(isEditing)}
              />
            </FieldRow>

          </div>
        </section>

        {/* Training background */}
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Training background</h2>
          <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100">

            <FieldRow label="Fitness level">
              <select
                name="fitnessLevel" value={form.fitnessLevel} onChange={handleChange}
                disabled={!isEditing}
                className={inputClass(isEditing)}
              >
                <option value="">— select —</option>
                {FITNESS_LEVELS.map((l) => (
                  <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>
                ))}
              </select>
            </FieldRow>

            <FieldRow label="Primary sport">
              <input
                type="text" name="primarySport" value={form.primarySport} onChange={handleChange}
                placeholder="e.g. running, bouldering"
                disabled={!isEditing}
                className={inputClass(isEditing)}
              />
            </FieldRow>

            <FieldRow label="Training age" hint="years of structured training">
              <input
                type="number" name="trainingAgeYears" value={form.trainingAgeYears} onChange={handleChange}
                placeholder="e.g. 3" min={0} max={50}
                disabled={!isEditing}
                className={inputClass(isEditing)}
              />
            </FieldRow>

            <FieldRow label="Weekly availability" hint="hours/week">
              <input
                type="number" name="weeklyAvailabilityHours" value={form.weeklyAvailabilityHours} onChange={handleChange}
                placeholder="e.g. 8" min={1} max={40}
                disabled={!isEditing}
                className={inputClass(isEditing)}
              />
            </FieldRow>

          </div>
        </section>

        {/* Heart rate */}
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Heart rate</h2>
          <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100">

            <FieldRow label="Resting HR" hint="bpm — morning measurement">
              <input
                type="number" name="restingHeartRate" value={form.restingHeartRate} onChange={handleChange}
                placeholder="e.g. 55" min={30} max={120}
                disabled={!isEditing}
                className={inputClass(isEditing)}
              />
            </FieldRow>

            <FieldRow label="Max HR" hint="bpm — leave blank to auto-calculate">
              <input
                type="number" name="maxHeartRate" value={form.maxHeartRate} onChange={handleChange}
                placeholder="e.g. 185" min={100} max={220}
                disabled={!isEditing}
                className={inputClass(isEditing)}
              />
            </FieldRow>

          </div>
        </section>

        {/* Goals & injuries */}
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Goals & limitations</h2>
          <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100">

            <div className="px-4 py-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Goals</label>
              <textarea
                name="goals" value={form.goals} onChange={handleChange}
                placeholder="e.g. Run a half marathon in under 2 hours"
                rows={3}
                disabled={!isEditing}
                className={`w-full text-sm border-0 focus:outline-none focus:ring-0 resize-none placeholder-gray-400 bg-transparent ${isEditing ? 'text-gray-900' : 'text-gray-600'}`}
              />
            </div>

            <div className="px-4 py-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Injury notes</label>
              <textarea
                name="injuryNotes" value={form.injuryNotes} onChange={handleChange}
                placeholder="e.g. Left knee tendonitis — avoid long downhill runs"
                rows={3}
                disabled={!isEditing}
                className={`w-full text-sm border-0 focus:outline-none focus:ring-0 resize-none placeholder-gray-400 bg-transparent ${isEditing ? 'text-gray-900' : 'text-gray-600'}`}
              />
            </div>

          </div>
        </section>

        {/* Error feedback */}
        {error && (
          <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>
        )}

        {/* Action buttons — only shown in edit mode */}
        {isEditing && (
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 py-3 border border-gray-300 text-gray-700 font-medium rounded-2xl
                hover:bg-gray-50 active:scale-[0.98] transition-all duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isDirty || saving}
              className="flex-1 py-3 bg-teal-600 text-white font-medium rounded-2xl
                hover:bg-teal-700 active:scale-[0.98] transition-all duration-200
                disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        )}

        <div className="h-4" />
      </form>
    </div>
  );
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function inputClass(isEditing: boolean) {
  return `w-full text-sm border-0 focus:outline-none focus:ring-0 bg-transparent placeholder-gray-400 ${
    isEditing ? 'text-gray-900' : 'text-gray-600'
  }`;
}

function EditIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function FieldRow({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center px-4 py-3 gap-3">
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        {hint && <span className="ml-1 text-xs text-gray-400">({hint})</span>}
      </div>
      <div className="w-40 text-right">{children}</div>
    </div>
  );
}
