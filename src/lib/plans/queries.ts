import { createClient } from '@/lib/supabase/server';
import { getCoachIdByProfileId } from '@/lib/clients/queries';
import { CoachPlanFormValues, CoachPlanListItem } from '@/types/app';

export async function getCoachClientSummary(profileId: string, clientId: string): Promise<{ clientId: string; fullName: string } | null> {
  const supabase = await createClient();
  const coachId = await getCoachIdByProfileId(profileId);
  if (!coachId) return null;

  const { data } = await supabase
    .from('clients')
    .select('id, profiles!inner(full_name)')
    .eq('id', clientId)
    .eq('coach_id', coachId)
    .single();

  if (!data) return null;
  return { clientId: data.id, fullName: (data as any).profiles.full_name };
}

export async function getCoachPlansForClient(profileId: string, clientId: string): Promise<CoachPlanListItem[]> {
  const supabase = await createClient();
  const coachId = await getCoachIdByProfileId(profileId);
  if (!coachId) return [];

  const { data } = await supabase
    .from('plans')
    .select('id, title, type, status, start_date, end_date, updated_at, version')
    .eq('client_id', clientId)
    .eq('coach_id', coachId)
    .order('start_date', { ascending: false });

  return (data ?? []) as CoachPlanListItem[];
}

export async function getCoachPlanFormData(profileId: string, clientId: string, planId: string): Promise<CoachPlanFormValues | null> {
  const supabase = await createClient();
  const coachId = await getCoachIdByProfileId(profileId);
  if (!coachId) return null;

  const { data: plan } = await supabase
    .from('plans')
    .select('id, client_id, title, type, goal, start_date, end_date, status, notes')
    .eq('id', planId)
    .eq('client_id', clientId)
    .eq('coach_id', coachId)
    .single();

  if (!plan) return null;

  const { data: days } = await supabase
    .from('plan_days')
    .select('day_date, day_label, workout_text, meal_text, is_rest_day')
    .eq('plan_id', planId)
    .order('day_date', { ascending: true });

  return {
    planId: plan.id,
    clientId: plan.client_id,
    title: plan.title ?? '',
    type: plan.type,
    goal: plan.goal ?? '',
    startDate: plan.start_date,
    endDate: plan.end_date,
    status: plan.status,
    notes: plan.notes ?? '',
    days: (days ?? []).map((day) => ({
      dayDate: day.day_date,
      dayLabel: day.day_label ?? '',
      workoutText: day.workout_text ?? '',
      mealText: day.meal_text ?? '',
      isRestDay: Boolean(day.is_rest_day)
    }))
  };
}
