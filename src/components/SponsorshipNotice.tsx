import { useAuth } from "@/hooks/useAuth";
import { useSponsorship } from "@/hooks/useSponsorship";
import { formatSponsorshipDate, hasComplimentaryAccess } from "@/lib/sponsorship";

export default function SponsorshipNotice() {
  const { profile } = useAuth();
  const sponsorship = useSponsorship();
  if (!sponsorship?.active && !hasComplimentaryAccess(profile)) return null;
  return (
    <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 flex items-center gap-3">
      {sponsorship?.active && sponsorship.logo_url && <img src={sponsorship.logo_url} alt={sponsorship.org_name} className="h-8 w-auto max-w-[80px] object-contain" />}
      <p className="text-sm text-foreground">
        {sponsorship?.active ? `Your plan is provided by ${sponsorship.org_name}` : "Your plan is complimentary"} until {formatSponsorshipDate(sponsorship?.active ? sponsorship.comped_until : profile?.comped_until)}
      </p>
    </div>
  );
}