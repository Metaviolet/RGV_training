import { createClient } from '@/lib/supabase/server';
import { CoachClientFormValues } from '@/types/app';

export async function getCoachIdByProfileId(profileId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase.from('coaches').select('id').eq('profile_id', profileId).maybeSingle();
  return data?.id ?? null;
}

export async function getCoachClientFormData(profileId: string, clientId: string): Promise<CoachClientFormValues | null> {
  const supabase = await createClient();

  const coachId = await getCoachIdByProfileId(profileId);
  if (!coachId) return null;

  const { data } = await supabase
    .from('clients')
    .select(`
      id,
      date_of_birth,
      sex,
      height_cm,
      starting_weight_kg,
      current_weight_kg,
      goal_summary,
      medical_notes,
      preferred_contact_method,
      emergency_contact_name,
      emergency_contact_phone,
      active,
      profiles!inner(id, full_name, email, phone, language)
    `)
    .eq('id', clientId)
    .eq('coach_id', coachId)
    .single();

  if (!data) return null;

  const profile = Array.isArray(data.profiles) ? data.profiles[0] : data.profiles;
  if (!profile) return null;

  return {
    clientId: data.id,
    fullName: profile.full_name ?? '',
    email: profile.email ?? '',
    phone: profile.phone ?? '',
    language: profile.language ?? 'es',
    dateOfBirth: data.date_of_birth ?? '',
    sex: data.sex ?? 'prefer_not_to_say',
    heightCm: data.height_cm?.toString() ?? '',
    startingWeightKg: data.starting_weight_kg?.toString() ?? '',
    currentWeightKg: data.current_weight_kg?.toString() ?? '',
    goalSummary: data.goal_summary ?? '',
    medicalNotes: data.medical_notes ?? '',
    preferredContactMethod: data.preferred_contact_method ?? 'whatsapp',
    emergencyContactName: data.emergency_contact_name ?? '',
    emergencyContactPhone: data.emergency_contact_phone ?? '',
    active: Boolean(data.active)
  };
}
