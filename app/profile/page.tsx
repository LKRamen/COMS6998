import Link from "next/link";
import { isProfileComplete, readProfile, requireUser } from "../../lib/auth";
import { saveProfile } from "./actions";
import { signOut } from "../auth/actions";

const errors: Record<string, string> = {
  names: "Enter both names, using up to 80 characters each.",
  photo: "Choose a JPEG, PNG, or WebP photo no larger than 2 MB.",
  upload: "Your photo could not be uploaded. Please try again.",
  save: "Your profile could not be saved. Please try again.",
  signout: "Sign-out failed. Please try again.",
};

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string }> }) {
  const { supabase, user } = await requireUser();
  const profile = await readProfile(supabase, user.id);
  const { error, saved } = await searchParams;
  let photoUrl: string | undefined;
  if (profile?.avatar_path) {
    const { data } = await supabase.storage.from("avatars").createSignedUrl(profile.avatar_path, 300);
    photoUrl = data?.signedUrl;
  }
  const complete = isProfileComplete(profile);
  return <main className="account-page"><div className="account-card">
    <p className="eyebrow">BEEN THERE / YOUR ACCOUNT</p>
    <h1>{complete ? "Your profile" : "Let’s get to know you."}</h1>
    <p className="page-intro">{complete ? "Keep your name and photo up to date." : "Add your first and last name to finish signing up and start your travel map."}</p>
    <p className="account-email">Signed in as {user.email}</p>
    {photoUrl && <picture><img className="avatar" src={photoUrl} alt="Your profile photo" width="96" height="96" /></picture>}
    {error && <p className="form-message" role="alert">{errors[error] ?? "Something went wrong. Please try again."}</p>}
    {saved && <p className="form-message success" role="status">Profile saved.</p>}
    {!profile && <p className="form-message" role="alert">Your profile is unavailable. Please try again later.</p>}
    <form action={saveProfile} className="profile-form">
      <label>First name<input name="first_name" autoComplete="given-name" defaultValue={profile?.first_name ?? ""} required maxLength={80} /></label>
      <label>Last name<input name="last_name" autoComplete="family-name" defaultValue={profile?.last_name ?? ""} required maxLength={80} /></label>
      <label>Profile photo <span className="optional">(optional)</span><input type="file" name="photo" accept="image/jpeg,image/png,image/webp" aria-describedby="photo-help" /></label>
      <p id="photo-help" className="field-help">JPEG, PNG, or WebP. Maximum 2 MB.</p>
      <button className="button" type="submit" disabled={!profile}>Save profile</button>
    </form>
    <nav className="account-links" aria-label="Account">
      {complete && <Link href="/members">Go to my travels →</Link>}
      <Link href="/">Community map</Link>
      <form action={signOut}><button type="submit" className="text-button">Sign out</button></form>
    </nav>
  </div></main>;
}
