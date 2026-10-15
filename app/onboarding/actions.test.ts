// @vitest-environment node
import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ rpc: vi.fn(), profile: vi.fn(), redirect: vi.fn((path: string) => { throw new Error(`redirect:${path}`); }), revalidate: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
vi.mock("../../lib/auth", () => ({ requireUser: async () => ({ user: {id:"owner"}, supabase: {rpc:mocks.rpc,from:()=>({select:()=>({eq:()=>({maybeSingle:mocks.profile})})})} }) }));
import { finishOnboarding } from "./actions";
const state = {error:"",username:"",display_name:""};
function form(username = "Ada_L", name = "Ada") { const data = new FormData(); data.set("username",username); data.set("display_name",name); return data; }
beforeEach(() => { vi.clearAllMocks(); mocks.profile.mockResolvedValue({data:{bio:"Existing bio",public_avatar_path:"owner/photo.jpg"},error:null}); mocks.rpc.mockResolvedValue({error:null}); });
it("claims a validated handle, preserves old profile settings, and enters the feed", async () => {
 await expect(finishOnboarding(state,form())).rejects.toThrow("redirect:/feed");
 expect(mocks.rpc).toHaveBeenCalledWith("brainrot_save_profile",{p_username:"ada_l",p_display_name:"Ada",p_bio:"Existing bio",p_avatar_path:"owner/photo.jpg"});
 expect(mocks.revalidate).toHaveBeenCalledWith("/","layout");
});
it("retains entered fields for a username conflict", async () => { mocks.rpc.mockResolvedValue({error:{code:"23505"}}); expect(await finishOnboarding(state,form())).toEqual({error:"That username is already taken. Try another.",username:"Ada_L",display_name:"Ada"}); expect(mocks.redirect).not.toHaveBeenCalled(); });
it("rejects invalid input before saving", async () => { expect((await finishOnboarding(state,form("a"))).error).toMatch(/3–40/); expect(mocks.rpc).not.toHaveBeenCalled(); });
it("does not overwrite settings after a failed profile read", async () => { mocks.profile.mockResolvedValue({data:null,error:{message:"unavailable"}}); expect((await finishOnboarding(state,form())).error).toContain("loaded"); expect(mocks.rpc).not.toHaveBeenCalled(); });
