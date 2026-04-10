"use server";

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { AppLocale } from '@/i18n/routing';
import { requireRole } from '@/lib/auth/queries';
import { createClient } from '@/lib/supabase/server';
import { DailyCheckinFormState } from '@/types/app';

const emptyToUndefined = (value: FormDataEntryValue | null) => {
  const normalized = typeof value === 'string' ? value.trim() : '';
  return normalized.length ? normalized : undefined;
};

const messages = {
  en: {
    invalid: 'Please review the check-in fields and try again.',
    missingClient: 'Client profile not found.',
    missingPlan: 'No active plan is available for today.',
    invalidPlan: 'This plan is not available for today.',
    noteRequired: 'Add a short note when you skip or change an item.',
    saveFailed: 'We could not save today check-in.',
    saved: 'Saved'
  },
  es: {
    invalid: 'Revisa los datos del registro e inténtalo de nuevo.',
    missingClient: 'No se encontró el perfil del cliente.',
    missingPlan: 'No hay un plan activo disponible para hoy.',
    invalidPlan: 'Este plan no está disponible para hoy.',
    noteRequired: 'Agrega una nota breve cuando omitas o modifiques un elemento.',
    saveFailed: 'No se pudo guardar el registro de hoy.',
    saved: 'Guardado'
  }
} as const;

const schema = z.object({
  locale: z.enum(['en', 'es']),
  planId: z.string().uuid().optional(),
  workoutStatus: z.enum(['completed', 'skipped', 'changed', 'not_applicable']),
  mealStatus: z.enum(['completed', 'skipped', 'changed', 'not_applicable']),
  workoutNote: z.string().trim().max(2000).optional(),
  mealNote: z.string().trim().max(2000).optional(),
  overallDayRating: z.coerce.number().min(1).max(5).optional()
});

export async function saveDailyCheckinAction(_: DailyCheckinFormState, formData: FormData): Promise<DailyCheckinFormState> {
  const parsed = schema.safeParse({
    locale: formData.get('locale'),
    planId: emptyToUndefined(formData.get('planId')),
    workoutStatus: formData.get('workoutStatus') ?? 'not_applicable',
    mealStatus: formData.get('mealStatus') ?? 'not_applicable',
    workoutNote: emptyToUndefined(formData.get('workoutNote')),
    mealNote: emptyToUndefined(formData.get('mealNote')),
    overallDayRating: emptyToUndefined(formData.get('overallDayRating'))
  });

  const locale = (formData.get('locale') === 'en' ? 'en' : 'es') as AppLocale;
  const copy = messages[locale];

  if (!parsed.success) {
    return { error: copy.invalid };
  }

  const values = parsed.data;
  const profile = await requireRole(locale, 'client');
  const supabase = await createClient();

  const { data: client } = await supabase
    .from('clients')
    .select('id')
    .eq('profile_id', profile.id)
    .single();

  if (!client) return { error: copy.missingClient };
  if (!values.planId) return { error: copy.missingPlan };

  const today = new Date().toISOString().slice(0, 10);

  const { data: activePlan } = await supabase
    .from('plans')
    .select('id, start_date, end_date')
    .eq('id', values.planId)
    .eq('client_id', client.id)
    .eq('status', 'active')
    .lte('start_date', today)
    .gte('end_date', today)
    .maybeSingle();

  if (!activePlan) return { error: copy.invalidPlan };

  const requiresWorkoutNote = ['skipped', 'changed'].includes(values.workoutStatus);
  const requiresMealNote = ['skipped', 'changed'].includes(values.mealStatus);
  if ((requiresWorkoutNote && !values.workoutNote) || (requiresMealNote && !values.mealNote)) {
    return { error: copy.noteRequired };
  }

  const { error } = await supabase
    .from('daily_checkins')
    .upsert({
      client_id: client.id,
      plan_id: values.planId,
      checkin_date: today,
      workout_status: values.workoutStatus,
      meal_status: values.mealStatus,
      workout_note: values.workoutNote ?? null,
      meal_note: values.mealNote ?? null,
      overall_day_rating: values.overallDayRating ?? null,
      submitted_at: new Date().toISOString()
    }, { onConflict: 'client_id,plan_id,checkin_date' });

  if (error) return { error: error.message || copy.saveFailed };

  await supabase.from('audit_events').insert({
    actor_profile_id: profile.id,
    entity_type: 'daily_checkin',
    entity_id: null,
    action: 'daily_checkin.saved',
    metadata: { date: today, planId: values.planId }
  });

  revalidatePath(`/${locale}/client/dashboard`);
  revalidatePath(`/${locale}/client/today`);
  revalidatePath('/en/coach/dashboard');
  revalidatePath('/es/coach/dashboard');
  revalidatePath('/en/coach/reports');
  revalidatePath('/es/coach/reports');
  revalidatePath('/en/coach/clients');
  revalidatePath('/es/coach/clients');
  return { success: copy.saved };
}
