export type UserRole = 'coach' | 'client';
export type LanguageCode = 'en' | 'es';

export type Profile = {
  id: string;
  auth_user_id: string;
  role: UserRole;
  full_name: string;
  email: string;
  phone: string | null;
  photo_url: string | null;
  language: LanguageCode;
  timezone: string;
};

export type DashboardMetric = {
  label: string;
  value: string;
  hint?: string;
};

export type AuthActionState = {
  error?: string;
  success?: boolean;
};

export type ProfileFormState = {
  error?: string;
  success?: string;
};

export type CoachClientListItem = {
  id: string;
  full_name: string;
  email: string;
  goal_summary: string | null;
  current_weight_kg: number | null;
  active: boolean;
};

export type CoachDashboardData = {
  activeClients: number;
  lowAdherence: number;
  plansExpiring: number;
  recentCheckins: Array<{
    clientName: string;
    workoutStatus: string;
    mealStatus: string;
    date: string;
  }>;
};

export type ClientDashboardData = {
  currentStreak: number;
  weeklyAdherence: number;
  todayPlanCount: number;
  todayWorkout: string | null;
  todayMeal: string | null;
  coachWhatsApp: string | null;
  coachEmail: string | null;
  activePlanTitle: string | null;
  dayLabel: string | null;
  todayCheckinSaved: boolean;
  adherenceTrend: Array<{ date: string; adherence: number }>;
};

export type ClientTodayData = {
  clientId: string;
  planId: string | null;
  activePlanTitle: string | null;
  dayLabel: string | null;
  workout: string | null;
  meal: string | null;
  isRestDay: boolean;
  coachWhatsApp: string | null;
  coachEmail: string | null;
  todayDate: string;
  canSubmit: boolean;
  existingCheckin: {
    workoutStatus: CheckinStatus;
    mealStatus: CheckinStatus;
    workoutNote: string | null;
    mealNote: string | null;
    overallDayRating: number | null;
    submittedAt: string | null;
  } | null;
  summary: DailyCheckinSummary;
  recentWeek: Array<{
    date: string;
    workoutStatus: string;
    mealStatus: string;
    adherence: number;
  }>;
};

export type CoachReportData = {
  dailyAdherence: Array<{ date: string; completed: number; tracked: number; adherence: number }>;
  statusBreakdown: Array<{ label: string; count: number }>;
  clientSummaries: Array<{
    clientId: string;
    clientName: string;
    adherence: number;
    currentStreak: number;
    missedItems: number;
    activePlanTitle: string | null;
  }>;
};

export type CoachClientFormValues = {
  clientId?: string;
  fullName: string;
  email: string;
  phone: string;
  language: LanguageCode;
  dateOfBirth: string;
  sex: 'female' | 'male' | 'other' | 'prefer_not_to_say';
  heightCm: string;
  startingWeightKg: string;
  currentWeightKg: string;
  goalSummary: string;
  medicalNotes: string;
  preferredContactMethod: 'whatsapp' | 'email';
  emergencyContactName: string;
  emergencyContactPhone: string;
  active: boolean;
};

export type CoachClientFormState = {
  error?: string;
  success?: string;
};

export const emptyCoachClientFormValues: CoachClientFormValues = {
  fullName: '',
  email: '',
  phone: '',
  language: 'es',
  dateOfBirth: '',
  sex: 'prefer_not_to_say',
  heightCm: '',
  startingWeightKg: '',
  currentWeightKg: '',
  goalSummary: '',
  medicalNotes: '',
  preferredContactMethod: 'whatsapp',
  emergencyContactName: '',
  emergencyContactPhone: '',
  active: true
};

export type CoachPlanListItem = {
  id: string;
  title: string;
  type: 'training' | 'nutrition' | 'combined';
  status: 'draft' | 'active' | 'completed' | 'archived';
  start_date: string;
  end_date: string;
  updated_at: string;
  version: number;
};

export type CoachPlanDayFormValue = {
  dayDate: string;
  dayLabel: string;
  workoutText: string;
  mealText: string;
  isRestDay: boolean;
};

export type CoachPlanFormValues = {
  planId?: string;
  clientId: string;
  title: string;
  type: 'training' | 'nutrition' | 'combined';
  goal: string;
  startDate: string;
  endDate: string;
  status: 'draft' | 'active' | 'completed' | 'archived';
  notes: string;
  days: CoachPlanDayFormValue[];
};

export type CoachPlanFormState = {
  error?: string;
  success?: string;
};

export const emptyCoachPlanFormValues: CoachPlanFormValues = {
  clientId: '',
  title: '',
  type: 'combined',
  goal: '',
  startDate: new Date().toISOString().slice(0, 10),
  endDate: new Date().toISOString().slice(0, 10),
  status: 'draft',
  notes: '',
  days: []
};

export type CheckinStatus = 'completed' | 'skipped' | 'changed' | 'not_applicable';

export type DailyCheckinSummary = {
  trackedItems: number;
  completedItems: number;
  skippedItems: number;
  changedItems: number;
  adherence: number;
};

export type DailyCheckinFormState = {
  error?: string;
  success?: string;
};
