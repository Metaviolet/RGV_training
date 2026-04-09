export default function ForgotPasswordPage() {
  return (
    <div className="container" style={{ maxWidth: 520 }}>
      <div className="card stack">
        <h2>Reset password</h2>
        <p className="muted">Add your Supabase password reset flow here.</p>
        <input className="input" type="email" placeholder="name@example.com" />
        <button className="button">Send reset email</button>
      </div>
    </div>
  );
}
