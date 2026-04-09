"use client";

import { useActionState } from 'react';
import { AppLocale } from '@/i18n/routing';
import { saveDailyCheckinAction } from '@/lib/checkins/actions';
import { ClientTodayData, DailyCheckinFormState } from '@/types/app';

const initialState: DailyCheckinFormState = {};

type Labels = {
  save: string;
  update: string;
  workoutStatus: string;
  mealStatus: string;
  workoutNote: string;
  mealNote: string;
  overallRating: string;
  completed: string;
  skipped: string;
  changed: string;
  notApplicable: string;
  saved: string;
  noPlan: string;
  noPlanHint: string;
  notesHint: string;
  statusHint: string;
  summaryTitle: string;
  completedItems: string;
  skippedItems: string;
  changedItems: string;
  trackedItems: string;
  adherenceLabel: string;
  savedAt: string;
};

export function TodayCheckinForm({ locale, labels, data }: { locale: AppLocale; labels: Labels; data: ClientTodayData }) {
  const [state, formAction, pending] = useActionState(saveDailyCheckinAction, initialState);
  const existing = data.existingCheckin;
  const buttonLabel = existing ? labels.update : labels.save;

  if (!data.canSubmit) {
    return (
      <div className="card stack">
        <h3 style={{ margin: 0 }}>{labels.noPlan}</h3>
        <p className="muted" style={{ margin: 0 }}>{labels.noPlanHint}</p>
      </div>
    );
  }

  return (
    <form className="card stack" action={formAction}>
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="planId" value={data.planId ?? ''} />

      <div className="space-between">
        <div>
          <h2 style={{ margin: 0 }}>{labels.summaryTitle}</h2>
          <p className="muted" style={{ margin: '6px 0 0' }}>{labels.statusHint}</p>
        </div>
        {existing?.submittedAt ? <span className="badge">{labels.savedAt}: {new Date(existing.submittedAt).toLocaleTimeString()}</span> : null}
      </div>

      <div className="grid grid-3">
        <div className="card stack" style={{ padding: 14 }}>
          <span className="muted">{labels.completedItems}</span>
          <strong>{data.summary.completedItems}</strong>
        </div>
        <div className="card stack" style={{ padding: 14 }}>
          <span className="muted">{labels.skippedItems}</span>
          <strong>{data.summary.skippedItems}</strong>
        </div>
        <div className="card stack" style={{ padding: 14 }}>
          <span className="muted">{labels.changedItems}</span>
          <strong>{data.summary.changedItems}</strong>
        </div>
      </div>

      <div className="grid grid-2">
        <label className="stack">
          <span>{labels.workoutStatus}</span>
          <select className="select" name="workoutStatus" defaultValue={existing?.workoutStatus ?? (data.workout ? 'completed' : 'not_applicable')}>
            <option value="completed">{labels.completed}</option>
            <option value="skipped">{labels.skipped}</option>
            <option value="changed">{labels.changed}</option>
            <option value="not_applicable">{labels.notApplicable}</option>
          </select>
        </label>

        <label className="stack">
          <span>{labels.mealStatus}</span>
          <select className="select" name="mealStatus" defaultValue={existing?.mealStatus ?? (data.meal ? 'completed' : 'not_applicable')}>
            <option value="completed">{labels.completed}</option>
            <option value="skipped">{labels.skipped}</option>
            <option value="changed">{labels.changed}</option>
            <option value="not_applicable">{labels.notApplicable}</option>
          </select>
        </label>
      </div>

      <p className="muted" style={{ margin: 0 }}>{labels.notesHint}</p>

      <div className="grid grid-2">
        <label className="stack">
          <span>{labels.workoutNote}</span>
          <textarea className="input" name="workoutNote" rows={4} defaultValue={existing?.workoutNote ?? ''} />
        </label>
        <label className="stack">
          <span>{labels.mealNote}</span>
          <textarea className="input" name="mealNote" rows={4} defaultValue={existing?.mealNote ?? ''} />
        </label>
      </div>

      <div className="grid grid-2">
        <label className="stack" style={{ maxWidth: 220 }}>
          <span>{labels.overallRating}</span>
          <select className="select" name="overallDayRating" defaultValue={String(existing?.overallDayRating ?? 5)}>
            {[1, 2, 3, 4, 5].map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
        <div className="stack" style={{ justifyContent: 'flex-end' }}>
          <span className="muted">{labels.trackedItems}</span>
          <strong>{data.summary.trackedItems}</strong>
          <span className="muted">{labels.adherenceLabel}: {data.summary.adherence}%</span>
        </div>
      </div>

      {state.error ? <p className="error-text">{state.error}</p> : null}
      {state.success ? <p className="success-text">{labels.saved}</p> : null}
      <div className="row">
        <button className="button" type="submit" disabled={pending}>{pending ? '...' : buttonLabel}</button>
      </div>
    </form>
  );
}
