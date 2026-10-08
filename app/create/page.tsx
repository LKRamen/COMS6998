import { requireCompleteProfile } from "../../lib/auth";
import TravelNav from "../components/travel-nav";
import PhotoUpload from "../components/photo-upload";
export default async function Create() {
 await requireCompleteProfile();
 return <main className="travel-page"><div className="travel-frame"><TravelNav signedIn current="create"/><header className="caption-heading"><div><p className="eyebrow">MAKE SOMETHING OF THE MOMENT</p><h1>Start with<br/><span>somewhere.</span></h1><p className="page-intro">A photo from anywhere. Three ways to say it. One caption to share.</p></div></header><section className="upload-card"><PhotoUpload/></section></div></main>;
}
