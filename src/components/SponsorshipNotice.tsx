import { useAuth } from "@/hooks/useAuth";
import { useSponsorship } from "@/hooks/useSponsorship";
import { formatSponsorshipDate, hasComplimentaryAccess } from "@/lib/sponsorship";

export default function SponsorshipNotice() {
  const { profile } = useAuth();
  const sponsorship = useSponsorship();
  if (!hasComplimentaryAccess(profile)) return null;
  const until = formatSponsorshipDate(profile?.comped_until);
  if (sponsorship?.active && sponsorship.kind === "partner_staff") {
    return (
      <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 flex items-center gap-3">
        {sponsorship.logo_url && <img src={sponsorship.logo_url} alt={sponsorship.org_name} className="h-8 w-auto max-w-[80px] object-contain" />}
        <div>
          <p className="text-sm font-medium text-foreground">Full access, provided by RinVita for the {sponsorship.org_name} partnership</p>
          <p className="text-xs text-muted-foreground mt-0.5">All features are included until {until}. No payment details are needed.</p>
        </div>
      </div>
    );
  }
  return (
    <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 flex items-center gap-3">
      {sponsorship?.active && sponsorship.logo_url && <img src={sponsorship.logo_url} alt={sponsorship.org_name} className="h-8 w-auto max-w-[80px] object-contain" />}
      <p className="text-sm text-foreground">
        {sponsorship?.active ? `Your plan is provided by ${sponsorship.org_name}` : "Your plan is complimentary"} until {until}. No payment is needed.
      </p>
    </div>
  );
}
