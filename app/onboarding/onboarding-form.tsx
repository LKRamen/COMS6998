"use client";

import { useActionState } from "react";
import { ArrowRight } from "@phosphor-icons/react/dist/csr/ArrowRight";
import { finishOnboarding } from "./actions";

export default function OnboardingForm({ username, displayName }: { username: string; displayName: string }) {
 const [state, action, pending] = useActionState(finishOnboarding, { error: "", username, display_name: displayName });
 return <form action={action} className="settings-form">
  {state.error && <p className="form-message" role="alert">{state.error}</p>}
  <label>Display name<input name="display_name" defaultValue={state.display_name} maxLength={80} required autoComplete="nickname" placeholder="What should we call you?"/></label>
  <label>Username<input name="username" defaultValue={state.username} pattern="[a-zA-Z0-9_]{3,40}" minLength={3} maxLength={40} required autoComplete="username" placeholder="your_handle"/><span className="field-help">Your public @handle. Use 3–40 letters, numbers or underscores. You can change it later.</span></label>
  <p className="login-small">Your display name and username are public. Your email stays private.</p>
  <button className="button" type="submit" disabled={pending}>{pending ? "Creating your profile…" : "Create my profile"}<ArrowRight size={17}/></button>
 </form>;
}
