"use server";

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { AppLocale } from '@/i18n/routing';
import { requireRole } from '@/lib/auth/queries';
import { getCoachIdByProfileId } from '@/lib/clients/queries';
import { createClient } from '@/lib/supabase/server';
import { CoachPlanFormState } from '@/types/app';

const planSchema = z.object({
  locale: z.enum(['en', 'es']),
  clientId: z.string().uuid(),
  planId: z.string().uuid().optional(),
  title: z.string().trim().min(2).max(160),
  type: z.enum(['training', 'nutrition', 'combined']),
  goal: z.string().trim().max(1000).optional(),
  startDate: z.string().date(),
  endDate: z.string().date(),
  status: z.enum(['draft', 'active', 'completed', 'archived']),
  notes: z.string().trim().max(5000).optional()
}).refine((value) => value.endDate >= value.startDate, {
  message: 'The end date must be on or after the start date.',
  path: ['endDate']
});

type ParsedDay = {
  dayDate: string;
  dayLabel: string;
  workoutText: string;
  mealText: string;
  isRestDay: boolean;
};

function normalizeString(value: FormDataEntryValue | null) {
  return typeof value === 'string' ? value.trim() : '';
}

function parseDays(formData: FormData, startDate: string, endDate: string): ParsedDay[] {
  const dayDates = formData.getAll('dayDate').map((value) => normalizeString(value));
  const dayLabels = formData.getAll('dayLabel').map((value) => normalizeString(value));
  const workoutTexts = formData.getAll('workoutText').map((value) => normalizeString(value));
  const mealTexts = formData.getAll('mealText').map((value) => normalizeString(value));
  const restDaySet = new Set(formData.getAll('restDayDates').map((value) => normalizeString(value)));

  const rows: ParsedDay[] = dayDates.map((dayDate, index) => ({
    dayDate,
    dayLabel: dayLabels[index] ?? '',
    workoutText: workoutTexts[index] ?? '',
    mealText: mealTexts[index] ?? '',
    isRestDay: restDaySet.has(dayDate)
  }));

  if (!rows.length) return [];
  const unique = new Set<string>();
  for (const row of rows) {
    if (!row.dayDate) throw new Error('Each plan day must include a valid date.');
    if (row.dayDate < startDate || row.dayDate > endDate) {
      throw new Error('Plan days must stay inside the selected plan range.');
    }
    if (unique.has(row.dayDate)) {
      throw new Error('Duplicate days are not allowed in the plan.');
    }
    unique.add(row.dayDate);
  }

  return rows.sort((a, b) => a.dayDate.localeCompare(b.dayDate));
}

export async function upsertCoachPlanAction(_: CoachPlanFormState, formData: FormData): Promise<CoachPlanFormState> {
  const parsed = planSchema.safeParse({
    locale: formData.get('locale'),
    clientId: formData.get('clientId'),
    planId: normalizeString(formData.get('planId')) || undefined,
    title: formData.get('title'),
    type: formData.get('type'),
    goal: normalizeString(formData.get('goal')) || undefined,
    startDate: formData.get('startDate'),
    endDate: formData.get('endDate'),
    status: formData.get('status'),
    notes: normalizeString(formData.get('notes')) || undefined
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Please review the plan details and try again.' };
  }

  const values = parsed.data;
  let days: ParsedDay[];
  try {
    days = parseDays(formData, values.startDate, values.endDate);
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unable to parse the plan days.' };
  }

  const locale = values.locale as AppLocale;
  const profile = await requireRole(locale, 'coach');
  const coachId = await getCoachIdByProfileId(profile.id);
  if (!coachId) return { error: 'Coach account setup is incomplete.' };

  const supabase = await createClient();

  const { data: client } = await supabase
    .from('clients')
    .select('id')
    .eq('id', values.clientId)
    .eq('coach_id', coachId)
    .maybeSingle();

  if (!client) return { error: 'Client not found.' };

  if (values.planId) {
    const { data: existingPlan } = await supabase
      .from('plans')
      .select('id, version')
      .eq('id', values.planId)
      .eq('client_id', values.clientId)
      .eq('coach_id', coachId)
      .maybeSingle();

    if (!existingPlan) return { error: 'Plan not found.' };

    const { error: planError } = await supabase
      .from('plans')
      .update({
        title: values.title,
        type: values.type,
        goal: values.goal ?? null,
        start_date: values.startDate,
        end_date: values.endDate,
        status: values.status,
        notes: values.notes ?? null,
        version: (existingPlan.version ?? 1) + 1
      })
      .eq('id', values.planId)
      .eq('coach_id', coachId);

    if (planError) return { error: planError.message };

    const { error: deleteDaysError } = await supabase.from('plan_days').delete().eq('plan_id', values.planId);
    if (deleteDaysError) return { error: deleteDaysError.message };

    if (days.length) {
      const { error: insertDaysError } = await supabase.from('plan_days').insert(
        days.map((day) => ({
          plan_id: values.planId,
          day_date: day.dayDate,
          day_label: day.dayLabel || null,
          workout_text: day.workoutText || null,
          meal_text: day.mealText || null,
          is_rest_day: day.isRestDay
        }))
      );
      if (insertDaysError) return { error: insertDaysError.message };
    }

    await supabase.from('audit_events').insert({
      actor_profile_id: profile.id,
      entity_type: 'plan',
      entity_id: values.planId,
      action: 'plan.updated',
      metadata: { client_id: values.clientId, day_count: days.length }
    });
  } else {
    const { data: createdPlan, error: planError } = await supabase
      .from('plans')
      .insert({
        client_id: values.clientId,
        coach_id: coachId,
        title: values.title,
        type: values.type,
        goal: values.goal ?? null,
        start_date: values.startDate,
        end_date: values.endDate,
        status: values.status,
        notes: values.notes ?? null
      })
      .select('id')
      .single();

    if (planError || !createdPlan) return { error: planError?.message ?? 'Unable to create the plan.' };

    if (days.length) {
      const { error: insertDaysError } = await supabase.from('plan_days').insert(
        days.map((day) => ({
          plan_id: createdPlan.id,
          day_date: day.dayDate,
          day_label: day.dayLabel || null,
          workout_text: day.workoutText || null,
          meal_text: day.mealText || null,
          is_rest_day: day.isRestDay
        }))
      );
      if (insertDaysError) return { error: insertDaysError.message };
    }

    await supabase.from('audit_events').insert({
      actor_profile_id: profile.id,
      entity_type: 'plan',
      entity_id: createdPlan.id,
      action: 'plan.created',
      metadata: { client_id: values.clientId, day_count: days.length }
    });
  }

  revalidatePath(`/${locale}/coach/dashboard`);
  revalidatePath(`/${locale}/coach/clients`);
  revalidatePath(`/${locale}/coach/clients/${values.clientId}/plans`);
  revalidatePath(`/${locale}/client/dashboard`);
  revalidatePath(`/${locale}/client/today`);
  redirect(`/${locale}/coach/clients/${values.clientId}/plans`);
}
