import { Sparkle } from "@phosphor-icons/react/dist/ssr/Sparkle";
import { requireCompleteProfile } from "../../lib/auth";
import AppShell from "../components/app-shell";
import StudioUpload from "../components/studio-upload";
export default async function Create() {
 await requireCompleteProfile();
 return <AppShell signedIn current="create"><main className="studio-page"><header className="section-heading"><div><p className="overline"><Sparkle size={13}/> THE AI MEME STUDIO</p><h1>Let it <span>cook.</span></h1><div className="studio-intro"><span><b>1</b>Your photo</span><span><b>2</b>AI captions</span><span><b>3</b>The feed</span></div></div><p>Your camera roll has potential.<br/>Let’s make it everyone’s problem.</p></header><StudioUpload/></main></AppShell>;
}
