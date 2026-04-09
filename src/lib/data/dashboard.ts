import { createClient } from '@/lib/supabase/server';
import { ClientDashboardData, ClientTodayData, CoachClientListItem, CoachDashboardData, CoachReportData, CheckinStatus, DailyCheckinSummary } from '@/types/app';

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function buildDateWindow(days: number) {
  const dates: string[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    dates.push(isoDate(d));
  }
  return dates;
}

function adherenceFromStatuses(workoutStatus: string, mealStatus: string) {
  let tracked = 0;
  let completed = 0;
  if (workoutStatus !== 'not_applicable') {
    tracked += 1;
    if (workoutStatus === 'completed') completed += 1;
  }
  if (mealStatus !== 'not_applicable') {
    tracked += 1;
    if (mealStatus === 'completed') completed += 1;
  }
  return tracked > 0 ? Math.round((completed / tracked) * 100) : 0;
}

function summarizeStatuses(workoutStatus: CheckinStatus, mealStatus: CheckinStatus): DailyCheckinSummary {
  const statuses = [workoutStatus, mealStatus];
  const trackedItems = statuses.filter((value) => value !== 'not_applicable').length;
  const completedItems = statuses.filter((value) => value === 'completed').length;
  const skippedItems = statuses.filter((value) => value === 'skipped').length;
  const changedItems = statuses.filter((value) => value === 'changed').length;
  return {
    trackedItems,
    completedItems,
    skippedItems,
    changedItems,
    adherence: trackedItems ? Math.round((completedItems / trackedItems) * 100) : 0
  };
}

export async function getCoachDashboardData(profileId: string): Promise<CoachDashboardData> {
  const supabase = await createClient();

  const { data: coach } = await supabase
    .from('coaches')
    .select('id')
    .eq('profile_id', profileId)
    .single();

  if (!coach) {
    return { activeClients: 0, lowAdherence: 0, plansExpiring: 0, recentCheckins: [] };
  }

  const { count: activeClients } = await supabase
    .from('clients')
    .select('*', { count: 'exact', head: true })
    .eq('coach_id', coach.id)
    .eq('active', true);

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekAgoString = isoDate(weekAgo);

  const { data: clientRows } = await supabase
    .from('clients')
    .select('id')
    .eq('coach_id', coach.id)
    .eq('active', true);

  const clientIds = (clientRows ?? []).map((row) => row.id);
  let lowAdherence = 0;

  if (clientIds.length > 0) {
    const { data: checkins } = await supabase
      .from('daily_checkins')
      .select('client_id, workout_status, meal_status')
      .gte('checkin_date', weekAgoString)
      .in('client_id', clientIds);

    const grouped = new Map<string, { total: number; completed: number }>();

    for (const row of checkins ?? []) {
      const bucket = grouped.get(row.client_id) ?? { total: 0, completed: 0 };
      const workoutTracked = row.workout_status !== 'not_applicable';
      const mealTracked = row.meal_status !== 'not_applicable';

      if (workoutTracked) {
        bucket.total += 1;
        if (row.workout_status === 'completed') bucket.completed += 1;
      }
      if (mealTracked) {
        bucket.total += 1;
        if (row.meal_status === 'completed') bucket.completed += 1;
      }

      grouped.set(row.client_id, bucket);
    }

    lowAdherence = Array.from(grouped.values()).filter((entry) => entry.total > 0 && entry.completed / entry.total < 0.7).length;
  }

  const now = new Date();
  const nextWeek = new Date();
  nextWeek.setDate(now.getDate() + 7);

  const { count: plansExpiring } = await supabase
    .from('plans')
    .select('*', { count: 'exact', head: true })
    .eq('coach_id', coach.id)
    .eq('status', 'active')
    .gte('end_date', isoDate(now))
    .lte('end_date', isoDate(nextWeek));

  const { data: recentCheckins } = await supabase
    .from('daily_checkins')
    .select('checkin_date, workout_status, meal_status, clients!inner(id, profiles!inner(full_name), coach_id)')
    .eq('clients.coach_id', coach.id)
    .order('checkin_date', { ascending: false })
    .limit(8);

  return {
    activeClients: activeClients ?? 0,
    lowAdherence,
    plansExpiring: plansExpiring ?? 0,
    recentCheckins: (recentCheckins ?? []).map((item: any) => ({
      clientName: item.clients.profiles.full_name,
      workoutStatus: item.workout_status,
      mealStatus: item.meal_status,
      date: item.checkin_date
    }))
  };
}

export async function getCoachClients(profileId: string, search?: string): Promise<CoachClientListItem[]> {
  const supabase = await createClient();

  const { data: coach } = await supabase
    .from('coaches')
    .select('id')
    .eq('profile_id', profileId)
    .single();

  if (!coach) return [];

  let query = supabase
    .from('clients')
    .select('id, goal_summary, current_weight_kg, active, created_at, profiles!inner(full_name, email)')
    .eq('coach_id', coach.id)
    .order('created_at', { ascending: false });

  if (search?.trim()) {
    query = query.ilike('profiles.full_name', `%${search.trim()}%`);
  }

  const { data } = await query;

  return (data ?? []).map((item: any) => ({
    id: item.id,
    full_name: item.profiles.full_name,
    email: item.profiles.email,
    goal_summary: item.goal_summary,
    current_weight_kg: item.current_weight_kg,
    active: item.active
  }));
}

export async function getClientDashboardData(profileId: string): Promise<ClientDashboardData> {
  const supabase = await createClient();
  const { data: client } = await supabase
    .from('clients')
    .select('id, coach_id')
    .eq('profile_id', profileId)
    .single();

  if (!client) {
    return {
      currentStreak: 0,
      weeklyAdherence: 0,
      todayPlanCount: 0,
      todayWorkout: null,
      todayMeal: null,
      coachWhatsApp: null,
      coachEmail: null,
      activePlanTitle: null,
      dayLabel: null,
      todayCheckinSaved: false,
      adherenceTrend: []
    };
  }

  const today = isoDate(new Date());
  const weekDates = buildDateWindow(7);
  const weekStart = weekDates[0];

  const { data: activePlan } = await supabase
    .from('plans')
    .select('id, title')
    .eq('client_id', client.id)
    .eq('status', 'active')
    .lte('start_date', today)
    .gte('end_date', today)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  let planDay: { workout_text?: string | null; meal_text?: string | null; day_label?: string | null } | null = null;
  if (activePlan) {
    const { data } = await supabase
      .from('plan_days')
      .select('workout_text, meal_text, day_label')
      .eq('plan_id', activePlan.id)
      .eq('day_date', today)
      .maybeSingle();
    planDay = data;
  }

  const { data: coachData } = await supabase
    .from('coaches')
    .select('whatsapp_number, contact_email')
    .eq('id', client.coach_id)
    .single();

  const { data: checkins } = await supabase
    .from('daily_checkins')
    .select('checkin_date, workout_status, meal_status')
    .eq('client_id', client.id)
    .gte('checkin_date', weekStart)
    .order('checkin_date', { ascending: false });

  const byDate = new Map((checkins ?? []).map((row) => [row.checkin_date, row]));
  const totalTracked = (checkins ?? []).reduce((acc, row) => {
    if (row.workout_status !== 'not_applicable') acc += 1;
    if (row.meal_status !== 'not_applicable') acc += 1;
    return acc;
  }, 0);

  const completedTracked = (checkins ?? []).reduce((acc, row) => {
    if (row.workout_status === 'completed') acc += 1;
    if (row.meal_status === 'completed') acc += 1;
    return acc;
  }, 0);

  let currentStreak = 0;
  for (const date of [...weekDates].reverse()) {
    const row = byDate.get(date);
    if (!row) break;
    const success = ['completed', 'not_applicable'].includes(row.workout_status) && ['completed', 'not_applicable'].includes(row.meal_status);
    if (success) currentStreak += 1;
    else break;
  }

  return {
    currentStreak,
    weeklyAdherence: totalTracked > 0 ? Math.round((completedTracked / totalTracked) * 100) : 0,
    todayPlanCount: [planDay?.workout_text, planDay?.meal_text].filter(Boolean).length,
    todayWorkout: planDay?.workout_text ?? null,
    todayMeal: planDay?.meal_text ?? null,
    coachWhatsApp: coachData?.whatsapp_number ?? null,
    coachEmail: coachData?.contact_email ?? null,
    activePlanTitle: activePlan?.title ?? null,
    dayLabel: planDay?.day_label ?? null,
    todayCheckinSaved: byDate.has(today),
    adherenceTrend: weekDates.map((date) => ({
      date,
      adherence: byDate.get(date)
        ? adherenceFromStatuses(byDate.get(date)!.workout_status, byDate.get(date)!.meal_status)
        : 0
    }))
  };
}

export async function getClientTodayData(profileId: string): Promise<ClientTodayData> {
  const supabase = await createClient();
  const { data: client } = await supabase
    .from('clients')
    .select('id, coach_id')
    .eq('profile_id', profileId)
    .single();

  const today = isoDate(new Date());
  const weekDates = buildDateWindow(7);
  const weekStart = weekDates[0];

  if (!client) {
    return {
      clientId: '',
      todayDate: today,
      planId: null,
      activePlanTitle: null,
      dayLabel: null,
      workout: null,
      meal: null,
      isRestDay: false,
      canSubmit: false,
      coachWhatsApp: null,
      coachEmail: null,
      existingCheckin: null,
      summary: { trackedItems: 0, completedItems: 0, skippedItems: 0, changedItems: 0, adherence: 0 },
      recentWeek: []
    };
  }

  const { data: activePlan } = await supabase
    .from('plans')
    .select('id, title')
    .eq('client_id', client.id)
    .eq('status', 'active')
    .lte('start_date', today)
    .gte('end_date', today)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  let planDay: any = null;
  if (activePlan) {
    const { data } = await supabase
      .from('plan_days')
      .select('day_label, workout_text, meal_text, is_rest_day')
      .eq('plan_id', activePlan.id)
      .eq('day_date', today)
      .maybeSingle();
    planDay = data;
  }

  const { data: coachData } = await supabase
    .from('coaches')
    .select('whatsapp_number, contact_email')
    .eq('id', client.coach_id)
    .single();

  const { data: existingCheckin } = await supabase
    .from('daily_checkins')
    .select('workout_status, meal_status, workout_note, meal_note, overall_day_rating, submitted_at')
    .eq('client_id', client.id)
    .eq('checkin_date', today)
    .maybeSingle();

  const { data: weekCheckins } = await supabase
    .from('daily_checkins')
    .select('checkin_date, workout_status, meal_status')
    .eq('client_id', client.id)
    .gte('checkin_date', weekStart)
    .order('checkin_date', { ascending: true });

  const weekMap = new Map((weekCheckins ?? []).map((row) => [row.checkin_date, row]));
  const summary = existingCheckin
    ? summarizeStatuses(existingCheckin.workout_status, existingCheckin.meal_status)
    : summarizeStatuses(
        planDay?.workout_text ? 'not_applicable' : 'not_applicable',
        planDay?.meal_text ? 'not_applicable' : 'not_applicable'
      );

  return {
    clientId: client.id,
    todayDate: today,
    planId: activePlan?.id ?? null,
    activePlanTitle: activePlan?.title ?? null,
    dayLabel: planDay?.day_label ?? null,
    workout: planDay?.workout_text ?? null,
    meal: planDay?.meal_text ?? null,
    isRestDay: Boolean(planDay?.is_rest_day),
    canSubmit: Boolean(activePlan),
    coachWhatsApp: coachData?.whatsapp_number ?? null,
    coachEmail: coachData?.contact_email ?? null,
    existingCheckin: existingCheckin ? {
      workoutStatus: existingCheckin.workout_status,
      mealStatus: existingCheckin.meal_status,
      workoutNote: existingCheckin.workout_note,
      mealNote: existingCheckin.meal_note,
      overallDayRating: existingCheckin.overall_day_rating,
      submittedAt: existingCheckin.submitted_at ?? null
    } : null,
    summary,
    recentWeek: weekDates.map((date) => {
      const row = weekMap.get(date);
      return {
        date,
        workoutStatus: row?.workout_status ?? 'not_applicable',
        mealStatus: row?.meal_status ?? 'not_applicable',
        adherence: row ? adherenceFromStatuses(row.workout_status, row.meal_status) : 0
      };
    })
  };
}

export async function getCoachReportsData(profileId: string): Promise<CoachReportData> {
  const supabase = await createClient();
  const { data: coach } = await supabase.from('coaches').select('id').eq('profile_id', profileId).single();
  if (!coach) return { dailyAdherence: [], statusBreakdown: [], clientSummaries: [] };

  const { data: clients } = await supabase
    .from('clients')
    .select('id, profiles!inner(full_name)')
    .eq('coach_id', coach.id)
    .eq('active', true);

  const clientIds = (clients ?? []).map((item: any) => item.id);
  const clientNameById = new Map((clients ?? []).map((item: any) => [item.id, item.profiles.full_name as string]));
  const weekDates = buildDateWindow(14);
  const startDate = weekDates[0];

  const { data: checkins } = clientIds.length
    ? await supabase
        .from('daily_checkins')
        .select('client_id, checkin_date, workout_status, meal_status')
        .in('client_id', clientIds)
        .gte('checkin_date', startDate)
    : { data: [] as any[] };

  const { data: plans } = clientIds.length
    ? await supabase
        .from('plans')
        .select('client_id, title, status')
        .in('client_id', clientIds)
    : { data: [] as any[] };

  const dailyAdherence = weekDates.map((date) => {
    const rows = (checkins ?? []).filter((row) => row.checkin_date === date);
    let tracked = 0;
    let completed = 0;
    for (const row of rows) {
      if (row.workout_status !== 'not_applicable') {
        tracked += 1;
        if (row.workout_status === 'completed') completed += 1;
      }
      if (row.meal_status !== 'not_applicable') {
        tracked += 1;
        if (row.meal_status === 'completed') completed += 1;
      }
    }
    return { date, tracked, completed, adherence: tracked ? Math.round((completed / tracked) * 100) : 0 };
  });

  const breakdownMap = new Map<string, number>();
  for (const row of plans ?? []) {
    breakdownMap.set(row.status, (breakdownMap.get(row.status) ?? 0) + 1);
  }

  const checkinsByClient = new Map<string, any[]>();
  for (const row of checkins ?? []) {
    const bucket = checkinsByClient.get(row.client_id) ?? [];
    bucket.push(row);
    checkinsByClient.set(row.client_id, bucket);
  }

  const clientSummaries = clientIds.map((clientId) => {
    const rows = (checkinsByClient.get(clientId) ?? []).sort((a, b) => b.checkin_date.localeCompare(a.checkin_date));
    let tracked = 0;
    let completed = 0;
    let missedItems = 0;
    for (const row of rows) {
      if (row.workout_status !== 'not_applicable') {
        tracked += 1;
        if (row.workout_status === 'completed') completed += 1;
        if (row.workout_status === 'skipped') missedItems += 1;
      }
      if (row.meal_status !== 'not_applicable') {
        tracked += 1;
        if (row.meal_status === 'completed') completed += 1;
        if (row.meal_status === 'skipped') missedItems += 1;
      }
    }

    let currentStreak = 0;
    for (const row of rows) {
      const success = ['completed', 'not_applicable'].includes(row.workout_status) && ['completed', 'not_applicable'].includes(row.meal_status);
      if (success) currentStreak += 1;
      else break;
    }

    const activePlanTitle = (plans ?? []).find((plan) => plan.client_id === clientId && plan.status === 'active')?.title ?? null;

    return {
      clientId,
      clientName: clientNameById.get(clientId) ?? 'Client',
      adherence: tracked ? Math.round((completed / tracked) * 100) : 0,
      currentStreak,
      missedItems,
      activePlanTitle
    };
  }).sort((a, b) => a.adherence - b.adherence || b.missedItems - a.missedItems);

  return {
    dailyAdherence,
    statusBreakdown: Array.from(breakdownMap.entries()).map(([label, count]) => ({ label, count })),
    clientSummaries
  };
}
