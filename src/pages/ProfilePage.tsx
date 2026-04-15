import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useVaultStore } from "@/store/vaultStore";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Camera, Trash2, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const planLabels: Record<string, string> = {
  free: "Free",
  standard: "Standard",
  family: "Family",
};

const ProfilePage = () => {
  const { user, profile, refreshProfile, signOut } = useAuth();
  const { medications, allergies } = useVaultStore();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [showDelete, setShowDelete] = useState(false);

  const [fullName, setFullName] = useState("");
  const [dob, setDob] = useState("");
  const [nationality, setNationality] = useState("");
  const [phone, setPhone] = useState("");
  const [bloodType, setBloodType] = useState("");
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [biologicalSex, setBiologicalSex] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [currentDiagnoses, setCurrentDiagnoses] = useState("");

  const bmi = useMemo(() => {
    const h = parseFloat(heightCm);
    const w = parseFloat(weightKg);
    if (h > 0 && w > 0) return (w / ((h / 100) ** 2)).toFixed(1);
    return null;
  }, [heightCm, weightKg]);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setDob(profile.date_of_birth || "");
      setNationality(profile.nationality || "");
      setPhone(profile.phone || "");
      setBloodType(profile.blood_type || "");
      setEmergencyName(profile.emergency_contact_name || "");
      setEmergencyPhone(profile.emergency_contact_phone || "");
      setBiologicalSex((profile as any).biological_sex || "");
      setHeightCm((profile as any).height_cm?.toString() || "");
      setWeightKg((profile as any).weight_kg?.toString() || "");
      setCurrentDiagnoses((profile as any).current_diagnoses || "");
    }
  }, [profile]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      full_name: fullName,
      date_of_birth: dob || null,
      nationality,
      phone,
      blood_type: bloodType,
      emergency_contact_name: emergencyName,
      emergency_contact_phone: emergencyPhone,
      biological_sex: biologicalSex || null,
      height_cm: heightCm ? parseFloat(heightCm) : null,
      weight_kg: weightKg ? parseFloat(weightKg) : null,
      current_diagnoses: currentDiagnoses || null,
    } as any).eq("id", user.id);
    setSaving(false);
    if (error) {
      toast.error("Failed to save — please try again");
    } else {
      toast.success("Profile updated");
      await refreshProfile();
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const path = `${user.id}/${Date.now()}-${file.name}`;
    const { error: uploadErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (uploadErr) { toast.error("Upload failed"); return; }
    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
    await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("id", user.id);
    await refreshProfile();
    toast.success("Avatar updated");
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== "DELETE" || !user) return;
    await Promise.all([
      supabase.from("blood_results").delete().eq("user_id", user.id),
      supabase.from("imaging_results").delete().eq("user_id", user.id),
      supabase.from("medications").delete().eq("user_id", user.id),
      supabase.from("documents").delete().eq("user_id", user.id),
      supabase.from("allergies").delete().eq("user_id", user.id),
      supabase.from("alerts").delete().eq("user_id", user.id),
      supabase.from("profiles").delete().eq("id", user.id),
    ]);
    await signOut();
    navigate("/auth");
  };

  const initials = (fullName || user?.email?.split("@")[0] || "U")
    .split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const activeMeds = medications.filter((m) => m.active);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto p-6 md:p-8">
        <button onClick={() => navigate("/")} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        <h1 className="font-heading text-3xl font-light text-foreground mb-6">Profile</h1>

        <div className="flex items-center gap-4 mb-8">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center text-primary text-xl font-heading font-semibold overflow-hidden">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} className="w-16 h-16 rounded-full object-cover" alt="" />
              ) : initials}
            </div>
            <label className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center cursor-pointer hover:bg-primary/90">
              <Camera className="w-3 h-3" />
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            </label>
          </div>
          <div>
            <p className="text-foreground font-medium">{fullName || "Your Name"}</p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </div>

        <section className="bg-card border border-border rounded-xl p-6 mb-6">
          <h2 className="font-heading text-lg text-foreground mb-4">Personal Information</h2>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-foreground">Full Name</label>
              <input value={fullName} onChange={(e) => setFullName(e.target.value)}
                className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground">Email</label>
              <input value={user?.email || ""} readOnly
                className="w-full mt-1 px-3 py-2 bg-muted border border-border rounded-lg text-sm text-muted-foreground cursor-not-allowed" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-foreground">Date of Birth</label>
                <input type="date" value={dob} onChange={(e) => setDob(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground">Nationality</label>
                <input value={nationality} onChange={(e) => setNationality(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-foreground">Phone</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)}
                className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          </div>
        </section>

        {/* About Me / Medical */}
        <section className="bg-card border border-border rounded-xl p-6 mb-6">
          <h2 className="font-heading text-lg text-foreground mb-4">About Me</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-foreground">Biological Sex</label>
                <select value={biologicalSex} onChange={(e) => setBiologicalSex(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30">
                  <option value="">Select...</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
                <p className="text-[10px] text-muted-foreground mt-1">Used to show personalised blood result reference ranges.</p>
              </div>
              <div>
                <label className="text-xs font-medium text-foreground">Blood Type</label>
                <select value={bloodType} onChange={(e) => setBloodType(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30">
                  <option value="">Select...</option>
                  {bloodTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-medium text-foreground">Height (cm)</label>
                <input type="number" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} placeholder="175"
                  className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground">Weight (kg)</label>
                <input type="number" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} placeholder="75"
                  className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground">BMI</label>
                <input value={bmi || "—"} readOnly
                  className="w-full mt-1 px-3 py-2 bg-muted border border-border rounded-lg text-sm text-muted-foreground cursor-not-allowed" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-foreground">Current Diagnoses</label>
              <textarea value={currentDiagnoses} onChange={(e) => setCurrentDiagnoses(e.target.value)}
                placeholder="e.g. Type 2 Diabetes, Hypertension"
                className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none h-20" />
            </div>

            {/* Current Medications (read-only from store) */}
            <div>
              <label className="text-xs font-medium text-foreground">Current Medications</label>
              {activeMeds.length > 0 ? (
                <div className="mt-1 space-y-1">
                  {activeMeds.map((m) => (
                    <div key={m.id} className="text-sm text-foreground/80 px-3 py-1.5 bg-muted rounded">
                      {m.name} {m.dose} — {m.frequency}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground mt-1">No active medications</p>
              )}
            </div>

            {/* Known Allergies (read-only from store) */}
            <div>
              <label className="text-xs font-medium text-foreground">Known Allergies</label>
              {allergies.length > 0 ? (
                <div className="mt-1 flex flex-wrap gap-2">
                  {allergies.map((a, i) => (
                    <span key={a.id || i} className="text-xs px-2 py-1 bg-destructive/10 text-destructive rounded border border-destructive/20">
                      {a.substance} ({a.severity})
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground mt-1">No known allergies</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-foreground">Emergency Contact Name</label>
                <input value={emergencyName} onChange={(e) => setEmergencyName(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground">Emergency Contact Phone</label>
                <input value={emergencyPhone} onChange={(e) => setEmergencyPhone(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
            </div>
          </div>
        </section>

        <section className="bg-card border border-border rounded-xl p-6 mb-6">
          <h2 className="font-heading text-lg text-foreground mb-4">Account</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">Plan</p>
              <span className="inline-block mt-1 px-2.5 py-0.5 bg-primary/10 text-primary text-xs rounded-full font-medium">
                {planLabels[profile?.plan || "free"]}
              </span>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Member since</p>
              <p className="text-foreground mt-1">{profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : "—"}</p>
            </div>
          </div>
        </section>

        <button onClick={handleSave} disabled={saving}
          className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 mb-6">
          {saving ? "Saving..." : "Save Changes"}
        </button>

        <section className="border border-destructive/30 rounded-xl p-6">
          <h2 className="font-heading text-lg text-destructive mb-2">Danger Zone</h2>
          <p className="text-sm text-muted-foreground mb-4">Permanently delete your account and all associated health data. This cannot be undone.</p>
          {!showDelete ? (
            <button onClick={() => setShowDelete(true)}
              className="flex items-center gap-2 px-4 py-2 border border-destructive text-destructive rounded-lg text-sm hover:bg-destructive/5 transition-colors">
              <Trash2 className="w-4 h-4" /> Delete Account
            </button>
          ) : (
            <div className="space-y-3">
              <div className="flex items-start gap-2 p-3 bg-destructive/5 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                <p className="text-xs text-destructive">Type <strong>DELETE</strong> to confirm permanent account deletion.</p>
              </div>
              <input value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)} placeholder="Type DELETE"
                className="w-full px-3 py-2 bg-background border border-destructive/30 rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-destructive/30" />
              <div className="flex gap-2">
                <button onClick={() => { setShowDelete(false); setDeleteConfirm(""); }}
                  className="flex-1 py-2 border border-border rounded-lg text-sm text-foreground hover:bg-muted">Cancel</button>
                <button onClick={handleDeleteAccount} disabled={deleteConfirm !== "DELETE"}
                  className="flex-1 py-2 bg-destructive text-destructive-foreground rounded-lg text-sm font-medium disabled:opacity-50">
                  Confirm Delete
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default ProfilePage;
