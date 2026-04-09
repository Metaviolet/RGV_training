"use client";

import { useActionState, useMemo, useState } from 'react';
import { AppLocale } from '@/i18n/routing';
import { upsertCoachPlanAction } from '@/lib/plans/actions';
import { CoachPlanFormState, CoachPlanFormValues } from '@/types/app';

const initialState: CoachPlanFormState = {};

type Labels = {
  title: string;
  subtitle: string;
  save: string;
  planTitle: string;
  planType: string;
  planGoal: string;
  startDate: string;
  endDate: string;
  status: string;
  notes: string;
  training: string;
  nutrition: string;
  combined: string;
  draft: string;
  active: string;
  completed: string;
  archived: string;
  schedule: string;
  dayLabel: string;
  workout: string;
  meal: string;
  restDay: string;
  noDays: string;
};

function addDays(date: string, amount: number) {
  const parsed = new Date(`${date}T12:00:00`);
  parsed.setDate(parsed.getDate() + amount);
  return parsed.toISOString().slice(0, 10);
}

function buildDateRange(startDate: string, endDate: string) {
  if (!startDate || !endDate || startDate > endDate) return [] as string[];
  const dates: string[] = [];
  let current = startDate;
  let guard = 0;
  while (current <= endDate && guard < 120) {
    dates.push(current);
    current = addDays(current, 1);
    guard += 1;
  }
  return dates;
}

export function CoachPlanForm({
  locale,
  labels,
  initialValues
}: {
  locale: AppLocale;
  labels: Labels;
  initialValues: CoachPlanFormValues;
}) {
  const [state, formAction, pending] = useActionState(upsertCoachPlanAction, initialState);
  const [startDate, setStartDate] = useState(initialValues.startDate);
  const [endDate, setEndDate] = useState(initialValues.endDate);
  const [daysState, setDaysState] = useState<Record<string, { dayLabel: string; workoutText: string; mealText: string; isRestDay: boolean }>>(
    Object.fromEntries(
      initialValues.days.map((day) => [
        day.dayDate,
        {
          dayLabel: day.dayLabel,
          workoutText: day.workoutText,
          mealText: day.mealText,
          isRestDay: day.isRestDay
        }
      ])
    )
  );

  const dateRange = useMemo(() => buildDateRange(startDate, endDate), [startDate, endDate]);

  const rows = useMemo(() => {
    return dateRange.map((date) => ({
      dayDate: date,
      dayLabel: daysState[date]?.dayLabel ?? '',
      workoutText: daysState[date]?.workoutText ?? '',
      mealText: daysState[date]?.mealText ?? '',
      isRestDay: daysState[date]?.isRestDay ?? false
    }));
  }, [dateRange, daysState]);

  function updateDay(date: string, field: 'dayLabel' | 'workoutText' | 'mealText' | 'isRestDay', value: string | boolean) {
    setDaysState((current) => ({
      ...current,
      [date]: {
        dayLabel: current[date]?.dayLabel ?? '',
        workoutText: current[date]?.workoutText ?? '',
        mealText: current[date]?.mealText ?? '',
        isRestDay: current[date]?.isRestDay ?? false,
        [field]: value
      }
    }));
  }

  return (
    <form className="card stack" action={formAction}>
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="clientId" value={initialValues.clientId} />
      <input type="hidden" name="planId" value={initialValues.planId ?? ''} />

      <div>
        <h1 style={{ marginBottom: 8 }}>{labels.title}</h1>
        <p className="muted">{labels.subtitle}</p>
      </div>

      <div className="grid grid-3">
        <label className="stack">
          <span>{labels.planTitle}</span>
          <input className="input" name="title" defaultValue={initialValues.title} required />
        </label>
        <label className="stack">
          <span>{labels.planType}</span>
          <select className="select" name="type" defaultValue={initialValues.type}>
            <option value="training">{labels.training}</option>
            <option value="nutrition">{labels.nutrition}</option>
            <option value="combined">{labels.combined}</option>
          </select>
        </label>
        <label className="stack">
          <span>{labels.status}</span>
          <select className="select" name="status" defaultValue={initialValues.status}>
            <option value="draft">{labels.draft}</option>
            <option value="active">{labels.active}</option>
            <option value="completed">{labels.completed}</option>
            <option value="archived">{labels.archived}</option>
          </select>
        </label>
      </div>

      <div className="grid grid-3">
        <label className="stack">
          <span>{labels.startDate}</span>
          <input className="input" type="date" name="startDate" value={startDate} onChange={(event) => setStartDate(event.target.value)} required />
        </label>
        <label className="stack">
          <span>{labels.endDate}</span>
          <input className="input" type="date" name="endDate" value={endDate} onChange={(event) => setEndDate(event.target.value)} required />
        </label>
        <label className="stack">
          <span>{labels.planGoal}</span>
          <input className="input" name="goal" defaultValue={initialValues.goal} />
        </label>
      </div>

      <label className="stack">
        <span>{labels.notes}</span>
        <textarea className="input" name="notes" defaultValue={initialValues.notes} rows={4} />
      </label>

      <div className="stack">
        <div>
          <h2 style={{ marginBottom: 6 }}>{labels.schedule}</h2>
          <p className="muted" style={{ margin: 0 }}>{rows.length ? `${rows.length} day(s)` : labels.noDays}</p>
        </div>

        {rows.length ? (
          rows.map((row) => (
            <div key={row.dayDate} className="card plan-day-card stack">
              <div className="space-between">
                <strong>{row.dayDate}</strong>
                <label className="row" style={{ alignItems: 'center' }}>
                  <input
                    type="checkbox"
                    name="restDayDates"
                    value={row.dayDate}
                    checked={row.isRestDay}
                    onChange={(event) => updateDay(row.dayDate, 'isRestDay', event.target.checked)}
                  />
                  <span>{labels.restDay}</span>
                </label>
              </div>
              <input type="hidden" name="dayDate" value={row.dayDate} />
              <div className="grid grid-3">
                <label className="stack">
                  <span>{labels.dayLabel}</span>
                  <input
                    className="input"
                    name="dayLabel"
                    value={row.dayLabel}
                    onChange={(event) => updateDay(row.dayDate, 'dayLabel', event.target.value)}
                  />
                </label>
                <label className="stack plan-field-wide">
                  <span>{labels.workout}</span>
                  <textarea
                    className="input"
                    name="workoutText"
                    rows={3}
                    value={row.workoutText}
                    onChange={(event) => updateDay(row.dayDate, 'workoutText', event.target.value)}
                  />
                </label>
                <label className="stack plan-field-wide">
                  <span>{labels.meal}</span>
                  <textarea
                    className="input"
                    name="mealText"
                    rows={3}
                    value={row.mealText}
                    onChange={(event) => updateDay(row.dayDate, 'mealText', event.target.value)}
                  />
                </label>
              </div>
            </div>
          ))
        ) : (
          <p className="muted">{labels.noDays}</p>
        )}
      </div>

      {state?.error ? <p className="error-text">{state.error}</p> : null}
      {state?.success ? <p className="success-text">{state.success}</p> : null}

      <div className="row">
        <button className="button" type="submit" disabled={pending}>{pending ? '...' : labels.save}</button>
      </div>
    </form>
  );
}
