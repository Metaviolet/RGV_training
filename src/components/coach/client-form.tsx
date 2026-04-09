"use client";

import { useActionState } from 'react';
import { AppLocale } from '@/i18n/routing';
import { upsertCoachClientAction } from '@/lib/clients/actions';
import { CoachClientFormState, CoachClientFormValues } from '@/types/app';

const initialState: CoachClientFormState = {};

type Labels = {
  title: string;
  subtitle: string;
  save: string;
  fullName: string;
  email: string;
  phone: string;
  language: string;
  dateOfBirth: string;
  sex: string;
  heightCm: string;
  startingWeightKg: string;
  currentWeightKg: string;
  goalSummary: string;
  medicalNotes: string;
  preferredContactMethod: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  active: string;
  accountNote: string;
  english: string;
  spanish: string;
  female: string;
  male: string;
  other: string;
  preferNotToSay: string;
  whatsapp: string;
  emailMethod: string;
};

export function CoachClientForm({
  locale,
  mode,
  labels,
  initialValues
}: {
  locale: AppLocale;
  mode: 'create' | 'edit';
  labels: Labels;
  initialValues: CoachClientFormValues;
}) {
  const [state, formAction, pending] = useActionState(upsertCoachClientAction, initialState);

  return (
    <form className="card stack" action={formAction}>
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="clientId" value={initialValues.clientId ?? ''} />

      <div>
        <h1 style={{ marginBottom: 8 }}>{labels.title}</h1>
        <p className="muted">{labels.subtitle}</p>
        {mode === 'create' ? <p className="muted">{labels.accountNote}</p> : null}
      </div>

      <div className="grid grid-3">
        <label className="stack">
          <span>{labels.fullName}</span>
          <input className="input" name="fullName" defaultValue={initialValues.fullName} required />
        </label>
        <label className="stack">
          <span>{labels.email}</span>
          <input className="input" name="email" type="email" defaultValue={initialValues.email} required />
        </label>
        <label className="stack">
          <span>{labels.phone}</span>
          <input className="input" name="phone" defaultValue={initialValues.phone} />
        </label>
      </div>

      <div className="grid grid-3">
        <label className="stack">
          <span>{labels.language}</span>
          <select className="select" name="language" defaultValue={initialValues.language}>
            <option value="es">{labels.spanish}</option>
            <option value="en">{labels.english}</option>
          </select>
        </label>
        <label className="stack">
          <span>{labels.dateOfBirth}</span>
          <input className="input" name="dateOfBirth" type="date" defaultValue={initialValues.dateOfBirth} />
        </label>
        <label className="stack">
          <span>{labels.sex}</span>
          <select className="select" name="sex" defaultValue={initialValues.sex}>
            <option value="female">{labels.female}</option>
            <option value="male">{labels.male}</option>
            <option value="other">{labels.other}</option>
            <option value="prefer_not_to_say">{labels.preferNotToSay}</option>
          </select>
        </label>
      </div>

      <div className="grid grid-3">
        <label className="stack">
          <span>{labels.heightCm}</span>
          <input className="input" name="heightCm" type="number" step="0.01" min="0" defaultValue={initialValues.heightCm} />
        </label>
        <label className="stack">
          <span>{labels.startingWeightKg}</span>
          <input className="input" name="startingWeightKg" type="number" step="0.01" min="0" defaultValue={initialValues.startingWeightKg} />
        </label>
        <label className="stack">
          <span>{labels.currentWeightKg}</span>
          <input className="input" name="currentWeightKg" type="number" step="0.01" min="0" defaultValue={initialValues.currentWeightKg} />
        </label>
      </div>

      <div className="grid grid-3">
        <label className="stack">
          <span>{labels.preferredContactMethod}</span>
          <select className="select" name="preferredContactMethod" defaultValue={initialValues.preferredContactMethod}>
            <option value="whatsapp">{labels.whatsapp}</option>
            <option value="email">{labels.emailMethod}</option>
          </select>
        </label>
        <label className="stack">
          <span>{labels.emergencyContactName}</span>
          <input className="input" name="emergencyContactName" defaultValue={initialValues.emergencyContactName} />
        </label>
        <label className="stack">
          <span>{labels.emergencyContactPhone}</span>
          <input className="input" name="emergencyContactPhone" defaultValue={initialValues.emergencyContactPhone} />
        </label>
      </div>

      <label className="stack">
        <span>{labels.goalSummary}</span>
        <textarea className="input" name="goalSummary" defaultValue={initialValues.goalSummary} rows={4} />
      </label>

      <label className="stack">
        <span>{labels.medicalNotes}</span>
        <textarea className="input" name="medicalNotes" defaultValue={initialValues.medicalNotes} rows={5} />
      </label>

      <label className="row" style={{ alignItems: 'center' }}>
        <input type="hidden" name="active" value="false" />
        <input type="checkbox" name="active" value="true" defaultChecked={initialValues.active} />
        <span>{labels.active}</span>
      </label>

      {state?.error ? <p className="error-text">{state.error}</p> : null}
      {state?.success ? <p className="success-text">{state.success}</p> : null}

      <div className="row">
        <button className="button" type="submit" disabled={pending}>{pending ? '...' : labels.save}</button>
      </div>
    </form>
  );
}
