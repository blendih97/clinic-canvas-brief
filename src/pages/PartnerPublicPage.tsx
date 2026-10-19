import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams, useNavigate } from "react-router-dom";
import { FolderLock, Eye, Share2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import SEO from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { claimPartner, clearPendingPartner, isValidSlug, isValidToken, savePendingPartner } from "@/lib/partners";

interface PublicPartner { name: string; slug: string; logo_url: string | null; type: string }

const benefits = [
  { icon: FolderLock, title: "Store", text: "Keep every report, scan and letter in one secure place." },
  { icon: Eye, title: "Review", text: "See your history clearly, translated automatically where needed." },
  { icon: Share2, title: "Share", text: "Send any doctor a one-time link or a PDF when you choose." },
];

const PartnerPublicPage = () => {
  const { slug = "" } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [partner, setPartner] = useState<PublicPartner | null>(null);
  const [state, setState] = useState<"loading" | "ok" | "missing">("loading");
  const [accepting, setAccepting] = useState(false);
  const clean = slug.toLowerCase();
  const invite = (params.get("invite") || "").toLowerCase();

  useEffect(() => {
    if (!isValidSlug(clean)) { setState("missing"); return; }
    void supabase.rpc("get_public_partner", { _slug: clean }).then(({ data }) => {
      const row = Array.isArray(data) ? data[0] : null;
      if (row) { setPartner(row as PublicPartner); setState("ok"); } else setState("missing");
    });
  }, [clean]);

  useEffect(() => {
    if (state === "ok" && !user) savePendingPartner({ slug: clean, token: isValidToken(invite) ? invite : undefined });
  }, [state, user, clean, invite]);

  const accept = async () => {
    setAccepting(true);
    const res = await claimPartner({ slug: clean, token: isValidToken(invite) ? invite : undefined });
    setAccepting(false);
    clearPendingPartner();
    if (!res) { toast.error("Something went wrong. Please try again."); return; }
    if (res.status === "joined" || res.status === "already_joined") {
      toast.success(`${partner?.name} is sponsoring your RinVita plan.`);
      window.location.href = "/app";
    } else if (res.status === "seats_full") {
      toast.message(`${partner?.name}'s sponsored places are full right now. You can keep using RinVita on the free plan.`);
    } else {
      toast.message("This invitation is no longer active.");
    }
  };

  if (state === "loading") {
    return <div className="min-h-screen bg-background flex items-center justify-center"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  if (state === "missing" || !partner) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-6 text-center">
        <SEO title="Partner page not found — RinVita" description="This partner page is not available." path={`/p/${clean}`} noindex />
        <h1 className="font-heading text-3xl font-light gold-gradient-text tracking-[0.15em]">RinVita</h1>
        <p className="text-muted-foreground max-w-md">This partner page isn't available. The link may be mistyped or the programme may have ended.</p>
        <Link to="/" className="text-primary underline underline-offset-4 text-sm">Go to RinVita</Link>
      </div>
    );
  }

  const signupHref = `/auth?mode=signup&partner=${encodeURIComponent(partner.slug)}${isValidToken(invite) ? `&invite=${invite}` : ""}`;

  return (
    <div className="min-h-screen bg-background">
      <SEO title={`${partner.name} × RinVita`} description={`${partner.name} gives you RinVita free as part of your care.`} path={`/p/${partner.slug}`} noindex />
      <main className="mx-auto max-w-2xl px-5 py-12 md:py-20">
        <div className="flex items-center justify-center gap-4 mb-10">
          {partner.logo_url ? (
            <img src={partner.logo_url} alt={partner.name} className="h-12 max-w-[160px] object-contain" />
          ) : (
            <span className="font-heading text-2xl text-foreground">{partner.name}</span>
          )}
          <span className="text-muted-foreground text-xl">×</span>
          <span className="font-heading text-2xl font-light tracking-[0.15em] gold-gradient-text">RinVita</span>
        </div>

        <h1 className="font-heading text-3xl md:text-5xl font-light text-center text-foreground leading-tight">
          {partner.name} gives you RinVita free as part of your care
        </h1>
        <p className="mt-4 text-center text-muted-foreground">One secure place to store, review and share your medical records with any doctor.</p>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {benefits.map((b) => (
            <div key={b.title} className="rounded-xl border border-border bg-card p-5">
              <b.icon className="h-5 w-5 text-primary" />
              <p className="mt-3 font-medium text-foreground">{b.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{b.text}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center gap-3">
          {user ? (
            <button onClick={() => void accept()} disabled={accepting}
              className="rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60">
              {accepting ? "Accepting…" : `Accept ${partner.name} sponsorship`}
            </button>
          ) : (
            <button onClick={() => navigate(signupHref)}
              className="rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:opacity-90">
              Create your free account
            </button>
          )}
          {!user && (
            <Link to={`/auth?mode=signin&partner=${encodeURIComponent(partner.slug)}${isValidToken(invite) ? `&invite=${invite}` : ""}`} className="text-sm text-muted-foreground underline underline-offset-4">
              I already have an account
            </Link>
          )}
        </div>

        <p className="mt-10 flex items-start justify-center gap-2 text-center text-sm text-muted-foreground">
          <ShieldCheck className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
          {partner.name} cannot see your medical records. Your records stay private to you.
        </p>
      </main>
    </div>
  );
};

export default PartnerPublicPage;
