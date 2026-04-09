import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { CoachClientForm } from '@/components/coach/client-form';
import { ClientInvitationCard } from '@/components/coach/client-invitation-card';
import { AppLocale } from '@/i18n/routing';
import { requireRole } from '@/lib/auth/queries';
import { getCoachClientFormData, getCoachIdByProfileId } from '@/lib/clients/queries';
import { getLatestInvitationForClient } from '@/lib/invitations/queries';

export default async function EditClientPage({ params }: { params: Promise<{ locale: AppLocale; clientId: string }> }) {
  const { locale, clientId } = await params;
  const profile = await requireRole(locale, 'coach');
  const client = await getCoachClientFormData(profile.id, clientId);
  if (!client) notFound();
  const coachId = await getCoachIdByProfileId(profile.id);
  const invitation = coachId ? await getLatestInvitationForClient(coachId, clientId) : null;

  const t = await getTranslations('coach');
  const common = await getTranslations('common');

  return (
    <div className="stack">
      <CoachClientForm
        locale={locale}
        mode="edit"
        initialValues={client}
        labels={{
          title: t('editClient'),
          subtitle: t('editClientIntro'),
          save: common('save'),
          fullName: t('clientFullName'),
          email: t('clientEmail'),
          phone: t('clientPhone'),
          language: t('clientLanguage'),
          dateOfBirth: t('clientDateOfBirth'),
          sex: t('clientSex'),
          heightCm: t('clientHeightCm'),
          startingWeightKg: t('clientStartingWeightKg'),
          currentWeightKg: t('clientCurrentWeightKg'),
          goalSummary: t('clientGoalSummary'),
          medicalNotes: t('clientMedicalNotes'),
          preferredContactMethod: t('clientPreferredContactMethod'),
          emergencyContactName: t('clientEmergencyContactName'),
          emergencyContactPhone: t('clientEmergencyContactPhone'),
          active: t('clientIsActive'),
          accountNote: t('newClientAccountNote'),
          english: common('english'),
          spanish: common('spanish'),
          female: t('female'),
          male: t('male'),
          other: t('other'),
          preferNotToSay: t('preferNotToSay'),
          whatsapp: t('whatsapp'),
          emailMethod: t('emailMethod')
        }}
      />

      <ClientInvitationCard
        locale={locale}
        clientId={clientId}
        invitation={invitation}
        labels={{
          title: t('invitationTitle'),
          intro: t('invitationIntro'),
          statusPending: t('invitationStatusPending'),
          statusAccepted: t('invitationStatusAccepted'),
          statusExpired: t('invitationStatusExpired'),
          statusMissing: t('invitationStatusMissing'),
          expires: t('invitationExpires'),
          generated: t('invitationGenerated'),
          regenerate: t('regenerateInvitation'),
          invitationReady: t('invitationReady'),
          emailSubject: t('invitationEmailSubject'),
          emailBody: t('invitationEmailBody'),
          copyLink: t('invitationLink'),
          copyEmail: t('emailMethod'),
          mailto: t('openDraftEmail')
        }}
      />
    </div>
  );
}
