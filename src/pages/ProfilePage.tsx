import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useVaultStore } from "@/store/vaultStore";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Camera } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLocale } from "@/hooks/useLocale";

const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const planLabels: Record<string, string> = {
  free: "Free",
  standard: "Standard",
  family: "Family",
};

const ProfilePage = () => {
  const { user, profile, refreshProfile } = useAuth();
  const { t, isRTL } = useLocale();
  const { medications, allergies } = useVaultStore();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

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
      toast.error(t("profile.saveFailed"));
    } else {
      toast.success(t("profile.profileUpdated"));
      await refreshProfile();
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const path = `${user.id}/${Date.now()}-${file.name}`;
    const { error: uploadErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (uploadErr) { toast.error(t("profile.uploadFailed")); return; }
    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
    await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("id", user.id);
    await refreshProfile();
    toast.success(t("profile.avatarUpdated"));
  };

  const initials = (fullName || user?.email?.split("@")[0] || "U")
    .split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const activeMeds = medications.filter((m) => m.active);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto p-6 md:p-8">
        <button onClick={() => navigate("/app")} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className={`w-4 h-4 ${isRTL ? "rotate-180" : ""}`} /> {t("profile.backToDashboard")}
        </button>

        <h1 className="font-heading text-3xl font-light text-foreground mb-6">{t("profile.title")}</h1>

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
              <p className="text-foreground font-medium">{fullName || t("profile.yourName")}</p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </div>

        <section className="bg-card border border-border rounded-xl p-6 mb-6">
          <h2 className="font-heading text-lg text-foreground mb-4">{t("profile.personalInformation")}</h2>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-foreground">{t("profile.fullName")}</label>
              <input value={fullName} onChange={(e) => setFullName(e.target.value)}
                className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground">{t("profile.email")}</label>
              <input value={user?.email || ""} readOnly
                className="w-full mt-1 px-3 py-2 bg-muted border border-border rounded-lg text-sm text-muted-foreground cursor-not-allowed" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-foreground">{t("profile.dateOfBirth")}</label>
                <input type="date" value={dob} onChange={(e) => setDob(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground">{t("profile.nationality")}</label>
                <input value={nationality} onChange={(e) => setNationality(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-foreground">{t("profile.phone")}</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)}
                className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          </div>
        </section>

        {/* About Me / Medical */}
        <section className="bg-card border border-border rounded-xl p-6 mb-6">
          <h2 className="font-heading text-lg text-foreground mb-4">{t("profile.aboutMe")}</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-foreground">{t("profile.biologicalSex")}</label>
                <select value={biologicalSex} onChange={(e) => setBiologicalSex(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30">
                  <option value="">{t("profile.selectPlaceholder")}</option>
                  <option value="male">{t("profile.male")}</option>
                  <option value="female">{t("profile.female")}</option>
                  <option value="prefer_not_to_say">{t("profile.preferNotToSay")}</option>
                </select>
                <p className="text-[10px] text-muted-foreground mt-1">{t("profile.usedForRanges")}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-foreground">{t("profile.bloodType")}</label>
                <select value={bloodType} onChange={(e) => setBloodType(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30">
                  <option value="">{t("profile.selectPlaceholder")}</option>
                  {bloodTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-medium text-foreground">{t("profile.height")}</label>
                <input type="number" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} placeholder="175"
                  className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground">{t("profile.weight")}</label>
                <input type="number" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} placeholder="75"
                  className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground">{t("profile.bmi")}</label>
                <input value={bmi || "—"} readOnly
                  className="w-full mt-1 px-3 py-2 bg-muted border border-border rounded-lg text-sm text-muted-foreground cursor-not-allowed" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-foreground">{t("profile.currentDiagnoses")}</label>
              <textarea value={currentDiagnoses} onChange={(e) => setCurrentDiagnoses(e.target.value)}
                placeholder={t("profile.diagnosesPlaceholder")}
                className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none h-20" />
            </div>

            {/* Current Medications (read-only from store) */}
            <div>
               <label className="text-xs font-medium text-foreground">{t("profile.currentMedications")}</label>
              {activeMeds.length > 0 ? (
                <div className="mt-1 space-y-1">
                  {activeMeds.map((m) => (
                    <div key={m.id} className="text-sm text-foreground/80 px-3 py-1.5 bg-muted rounded">
                      {m.name} {m.dose} — {m.frequency}
                    </div>
                  ))}
                </div>
              ) : (
                 <p className="text-sm text-muted-foreground mt-1">{t("profile.noActiveMedications")}</p>
              )}
            </div>

            {/* Known Allergies (read-only from store) */}
            <div>
               <label className="text-xs font-medium text-foreground">{t("profile.knownAllergies")}</label>
              {allergies.length > 0 ? (
                <div className="mt-1 flex flex-wrap gap-2">
                  {allergies.map((a, i) => (
                    <span key={a.id || i} className="text-xs px-2 py-1 bg-destructive/10 text-destructive rounded border border-destructive/20">
                      {a.substance} ({a.severity})
                    </span>
                  ))}
                </div>
              ) : (
                 <p className="text-sm text-muted-foreground mt-1">{t("profile.noKnownAllergies")}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                 <label className="text-xs font-medium text-foreground">{t("profile.emergencyContactName")}</label>
                <input value={emergencyName} onChange={(e) => setEmergencyName(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div>
                 <label className="text-xs font-medium text-foreground">{t("profile.emergencyContactPhone")}</label>
                <input value={emergencyPhone} onChange={(e) => setEmergencyPhone(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
            </div>
          </div>
        </section>

        <section className="bg-card border border-border rounded-xl p-6 mb-6">
           <h2 className="font-heading text-lg text-foreground mb-4">{t("profile.account")}</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
               <p className="text-muted-foreground text-xs">{t("profile.plan")}</p>
              <span className="inline-block mt-1 px-2.5 py-0.5 bg-primary/10 text-primary text-xs rounded-full font-medium">
                 {t(`profile.${(profile?.plan || "free") as "free" | "standard" | "family"}`)}
              </span>
            </div>
            <div>
               <p className="text-muted-foreground text-xs">{t("profile.memberSince")}</p>
              <p className="text-foreground mt-1">{profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : "—"}</p>
            </div>
          </div>
        </section>

        <button onClick={handleSave} disabled={saving}
          className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 mb-6">
          {saving ? t("common.saving") : t("common.saveChanges")}
        </button>

      </div>
    </div>
  );
};

export default ProfilePage;
