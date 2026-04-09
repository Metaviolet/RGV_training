import { AppLocale } from '@/i18n/routing';
import { signOutAction } from '@/lib/auth/actions';

export function SignOutButton({ locale, label }: { locale: AppLocale; label: string }) {
  const action = signOutAction.bind(null, locale);

  return (
    <form action={action}>
      <button className="button secondary" type="submit">{label}</button>
    </form>
  );
}
