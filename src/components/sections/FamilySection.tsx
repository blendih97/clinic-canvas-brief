import { useState, useEffect } from "react";
import { Users, Plus, Trash2, Eye, Loader2, Mail, Lock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { hasAccess } from "@/lib/planAccess";

interface FamilyMember {
  id: string;
  email: string;
  status: string;
  member_id: string | null;
  member_name?: string;
  doc_count?: number;
}

const FamilySection = ({ onViewMember }: { onViewMember: (memberId: string, memberName: string) => void }) => {
  const { user, profile } = useAuth();
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);

  const isFamilyPlan = hasAccess(profile, "family_invite");

  useEffect(() => {
    if (user && isFamilyPlan) loadMembers();
    else setLoading(false);
  }, [user, isFamilyPlan]);

  const loadMembers = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("family_members")
      .select("*")
      .eq("owner_id", user.id);

    if (data) {
      const enriched: FamilyMember[] = await Promise.all(
        data.map(async (m: { id: string; email: string; status: string; member_id: string | null }) => {
          let memberName = m.email;
          let docCount = 0;

          if (m.member_id) {
            const { data: prof } = await supabase
              .from("profiles")
              .select("full_name")
              .eq("id", m.member_id)
              .single();
            if (prof?.full_name) memberName = prof.full_name;

            const { count: dc } = await supabase
              .from("documents")
              .select("*", { count: "exact", head: true })
              .eq("user_id", m.member_id);
            docCount = dc || 0;
          }

          return {
            id: m.id,
            email: m.email,
            status: m.status,
            member_id: m.member_id,
            member_name: memberName,
            doc_count: docCount,
          };
        })
      );
      setMembers(enriched);
    }
    setLoading(false);
  };

  const handleInvite = async () => {
    if (!inviteEmail || !user) return;
    setInviting(true);
    const { error } = await supabase.from("family_members").insert({
      owner_id: user.id,
      email: inviteEmail,
      status: "pending",
    });
    if (error) {
      toast.error("Failed to send invitation");
    } else {
      toast.success(`Invitation sent to ${inviteEmail}`);
      setInviteEmail("");
      loadMembers();
    }
    setInviting(false);
  };

  const handleRemove = async (id: string) => {
    const { error } = await supabase.from("family_members").delete().eq("id", id);
    if (!error) {
      toast.success("Member removed");
      loadMembers();
    }
  };

  const initials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!isFamilyPlan) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="font-heading text-3xl font-light text-foreground">Family Vault</h2>
          <p className="text-sm text-muted-foreground mt-2">Manage and view health records for your family members</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-5 h-5 text-primary" />
          </div>
          <h3 className="font-heading text-xl text-foreground mb-2">Family Plan Required</h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
            The Family Vault is available on the Family plan at £89.99/month. Manage health records for up to 6 members from one account.
          </p>
          <p className="text-xs text-muted-foreground">Upgrade coming soon.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-3xl font-light text-foreground">Family Vault</h2>
        <p className="text-sm text-muted-foreground mt-2">Manage and view health records for your family members</p>
      </div>

      {/* Invite */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="font-heading text-lg text-foreground mb-4">Invite a Member</h3>
        <div className="flex gap-3">
          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="Enter email address"
            className="flex-1 px-4 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <button
            onClick={handleInvite}
            disabled={inviting || !inviteEmail}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Invite
          </button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Up to 5 additional members · Each member has completely private health records
        </p>
      </div>

      {/* Member cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {members.map((m) => (
          <div key={m.id} className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center text-primary text-sm font-heading font-semibold">
                  {initials(m.member_name || m.email)}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{m.member_name}</p>
                  <p className="text-xs text-muted-foreground">{m.email}</p>
                </div>
              </div>
              <button onClick={() => handleRemove(m.id)} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {m.status === "pending" ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted rounded-lg p-3">
                <Mail className="w-3.5 h-3.5" />
                Invitation pending
              </div>
            ) : (
              <>
                <div className="p-3 bg-muted rounded-lg mb-4">
                  <p className="text-xs text-muted-foreground">Documents</p>
                  <p className="font-heading text-lg text-foreground">{m.doc_count}</p>
                </div>
                <button
                  onClick={() => m.member_id && onViewMember(m.member_id, m.member_name || m.email)}
                  disabled={!m.member_id}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary/10 text-primary rounded-lg text-sm font-medium hover:bg-primary/20 transition-colors disabled:opacity-40"
                >
                  <Eye className="w-4 h-4" />
                  View Vault
                </button>
              </>
            )}
          </div>
        ))}

        {members.length === 0 && (
          <div className="col-span-full text-center py-12 bg-card border border-border rounded-xl">
            <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No family members yet. Invite someone to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FamilySection;

