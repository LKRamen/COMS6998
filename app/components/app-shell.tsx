import "./generation-status.css";
import Link from "next/link";
import { Stack } from "@phosphor-icons/react/dist/ssr/Stack";
import { Compass } from "@phosphor-icons/react/dist/ssr/Compass";
import { Plus } from "@phosphor-icons/react/dist/ssr/Plus";
import { User } from "@phosphor-icons/react/dist/ssr/User";
import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr/ArrowUpRight";
import { Lightning } from "@phosphor-icons/react/dist/ssr/Lightning";
import GenerationStatus from "./generation-status";
export type AppSection = "feed" | "explore" | "create" | "profile" | "creations";
export default function AppShell({ children, signedIn, current }: { children: React.ReactNode; signedIn: boolean; current?: AppSection }) {
 const links = [{ href: "/feed", label: "Feed", key: "feed", icon: Stack }, { href: "/explore", label: "Explore", key: "explore", icon: Compass }, { href: "/create", label: "Create", key: "create", icon: Plus }, { href: signedIn ? "/profile" : "/login", label: "Profile", key: "profile", icon: User }];
 return <div className="brainrot-app"><a className="skip-link" href="#main-content">Skip to content</a><header className="app-header">
  <Link href={signedIn ? "/feed" : "/"} className="brand" aria-label="Brainrot home"><span className="brand-icon"><Lightning size={23} weight="fill"/></span>brainrot<span className="brand-period">.</span></Link>
  <nav className="desktop-nav" aria-label="Main navigation">{links.slice(0, 2).map(link => <Link key={link.key} href={link.href} aria-current={current === link.key ? "page" : undefined}><link.icon size={18}/>{link.label}</Link>)}</nav>
  <div className="header-actions"><Link className="create-link" href={signedIn ? "/create" : "/login"}><Plus size={17}/>Create with AI</Link><Link className="account-link-button" href={signedIn ? "/profile" : "/login"}>{signedIn ? <User size={21}/> : <>Log in <ArrowUpRight size={16}/></>}</Link></div>
 </header>{signedIn && <GenerationStatus/>}<div id="main-content" className="app-main">{children}</div>
 <footer className="app-footer"><span>A little AI. A lot of personality.</span><span>Made for your sense of humor.</span></footer>
 <nav className="mobile-nav" aria-label="Mobile navigation">{links.map(link => <Link key={link.key} href={link.href} aria-current={current === link.key ? "page" : undefined}><link.icon size={23} weight={current === link.key ? "fill" : "regular"}/><span>{link.label}</span></Link>)}</nav></div>;
}
