import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowRight, ShieldCheck, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import GrowthDemos from "@/components/growth/GrowthDemos";
import { applicationSchema, segmentCopy, safeSource, type Preview } from "@/lib/growth";

const fieldClass = "w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm";
export default function GrowthPreviewPage() {
  const { slug = "" } = useParams();
  const [preview, setPreview] = useState<Preview | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [form, setForm] = useState({ company: "", work_email: "", name: "", role: "", express_agreement: false });
  const [sending, setSending] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const counted = useRef("");
  useEffect(() => {
    let cancelled = false;
    setLoading(true); setLoadError(false); setSubmitted(false);
    supabase.rpc("get_growth_preview", { _slug: slug }).then(({ data, error: fetchError }) => {
      if (cancelled) return;
      const result = data?.[0] as Preview | undefined;
      setPreview(result ?? null); setLoadError(!!fetchError); setLoading(false);
      if (result) {
        setForm({ company: result.organisation, work_email: "", name: "", role: "", express_agreement: false });
        if (counted.current !== slug) { counted.current = slug; void supabase.rpc("record_growth_preview_view", { _slug: slug }); }
      }
    });
    return () => { cancelled = true; };
  }, [slug, retry]);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setError("");
    const validated = applicationSchema.safeParse(form);
    if (!validated.success) { setError(validated.error.issues[0]?.message ?? "Check your details."); return; }
    setSending(true);
    try {
      const { data, error: submitError } = await supabase.rpc("submit_growth_application", { _slug: slug, _company: validated.data.company, _work_email: validated.data.work_email, _name: validated.data.name, _role: validated.data.role, _agreement: true });
      if (submitError || !data) throw new Error("submission_failed");
      setSubmitted(true);
    } catch { setError("Your application could not be saved. Please try again or email info@rinvita.co.uk."); }
    finally { setSending(false); }
  };
  const copy = preview ? segmentCopy[preview.segment] : segmentCopy.clinic;
  return <div className="min-h-screen bg-background">
    <SEO title={preview ? `${preview.organisation} — Proposed RinVita demonstration` : "Partnership preview — RinVita"} description="A proposed partnership demonstration using fictional records. No endorsement or active partnership is implied." path={`/preview/${slug}`} noindex/>
    <header className="border-b border-border"><div className="max-w-6xl mx-auto px-5 md:px-8 py-5 flex flex-wrap items-center justify-between gap-3"><Link to="/" className="font-heading text-3xl text-primary">RinVita</Link><p className="text-xs text-muted-foreground">Proposed demonstration · Not an endorsed partnership</p></div></header>
    {loading ? <main className="max-w-6xl mx-auto p-8" aria-busy="true">Loading preview…</main> : !preview ? <main className="max-w-6xl mx-auto px-5 py-20"><h1 className="text-4xl mb-4">{loadError ? "We couldn’t load this preview." : "This preview is not available."}</h1>{loadError && <Button onClick={() => setRetry(n => n + 1)}>Try again</Button>}<Button variant="link" asChild><Link to="/for-clinics">Clinic partnerships</Link></Button></main> : <main className="max-w-6xl mx-auto px-5 md:px-8">
      <section className="py-12 md:py-16"><p className="text-primary text-sm mb-4">A PROPOSAL FOR {preview.organisation.toUpperCase()}</p><h1 className="text-4xl md:text-5xl max-w-3xl leading-tight mb-5">{preview.organisation} × RinVita</h1><h2 className="text-3xl mb-5">{copy.heading}</h2><p className="max-w-2xl leading-7 text-muted-foreground mb-6">{copy.supporting}</p>
        <div className="flex flex-wrap gap-3"><Button asChild><a href="#trial-application">Apply for a 14-day trial<ArrowRight/></a></Button><Button variant="outline" asChild><Link to={copy.link}>{copy.link === "/for-clinics" ? "For clinics" : "For concierges"}</Link></Button></div>
        <p className="mt-6 text-sm leading-6 max-w-3xl">This independent proposal does not imply approval, endorsement or an existing partnership with {preview.organisation}. No organisation logos are used. All medical records below are fictional.</p>
      </section>
      <section className="border-t border-border py-8"><h2 className="text-2xl mb-3">Public context, not a partnership claim</h2><p className="text-sm leading-7 max-w-3xl">{preview.factual_context}</p><div className="flex flex-wrap gap-4 mt-3">{preview.source_urls.filter(url => safeSource.safeParse(url).success).map((url, i) => <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary underline inline-flex items-center gap-1">Public source {i + 1}<ExternalLink className="h-3 w-3"/></a>)}</div></section>
      <GrowthDemos/>
      <section className="border-t border-border py-10 grid md:grid-cols-3 gap-7">{[["Sponsor & invite", "Partners can sponsor access and invite patients or clients to RinVita."], ["Patient-controlled sharing", "Patients store, review and share their own records with any doctor by one-time link or PDF, and can request records from any provider via a secure upload link."], ["Records stay private", "Partners never see medical records. No direct EHR integration or automatic record ingestion is included."]].map(([title, text]) => <div key={title}><ShieldCheck className="h-5 w-5 text-primary mb-3"/><h3 className="text-2xl mb-3">{title}</h3><p className="text-sm leading-7 text-muted-foreground">{text}</p></div>)}</section>
      <section id="trial-application" className="border-t border-border py-12 grid md:grid-cols-2 gap-10 scroll-mt-6"><div><p className="text-sm text-primary mb-3">TRIAL APPLICATION</p><h2 className="text-3xl mb-4">Free 14-day trial — invite as many patients as you like.</h2><p className="text-sm leading-7 mb-4">Pricing is agreed before the trial starts. If you continue, your plan begins on day 15; if not, your patients keep their accounts on the free plan.</p><p className="text-sm leading-7 text-muted-foreground">Applying does not start a trial, create sponsored access or authorise billing. Your identity must be verified and agreed commercial terms signed before a start date is confirmed.</p></div>
        {submitted ? <div role="status" className="py-4"><ShieldCheck className="h-7 w-7 text-primary mb-4"/><h3 className="text-2xl mb-4">Application received — pending verification</h3><p className="text-sm leading-7">We’ll review your details and confirm pricing and commercial terms with you. No trial has started and no payment will be taken from this application.</p></div> : <form onSubmit={submit} className="space-y-4">{([['company','Company'],['work_email','Work email'],['name','Full name'],['role','Role']] as const).map(([key,label]) => <label key={key} className="block text-sm">{label} *<input required className={`${fieldClass} mt-2`} type={key === "work_email" ? "email" : "text"} autoComplete={key === "work_email" ? "email" : key === "name" ? "name" : key === "company" ? "organization" : "organization-title"} maxLength={key === "work_email" ? 255 : 200} value={form[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}/></label>)}
          <label className="flex gap-3 items-start text-sm leading-6"><input type="checkbox" required className="mt-1 shrink-0 accent-primary" checked={form.express_agreement} onChange={e => setForm(p => ({ ...p, express_agreement: e.target.checked }))}/><span>I expressly agree to submit my details for trial review and to be contacted about this application. I understand the trial starts only after verified identity and signed commercial terms, with pricing agreed in advance. This is not a marketing subscription. <Link to="/privacy" className="underline text-primary">Privacy Policy</Link></span></label>
          {error && <p role="alert" className="text-destructive text-sm">{error}</p>}<Button type="submit" disabled={sending}>{sending ? "Saving application…" : "Submit trial application"}<ArrowRight/></Button>
        </form>}
      </section>
    </main>}
    <footer className="border-t border-border py-6 px-5 text-sm text-muted-foreground flex flex-wrap justify-center gap-5"><Link to="/privacy">Privacy</Link><Link to="/terms">Terms</Link><a href="mailto:info@rinvita.co.uk">Contact RinVita</a></footer>
  </div>;
}