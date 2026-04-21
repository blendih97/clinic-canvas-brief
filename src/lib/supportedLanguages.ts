// Centralised list of supported translation target languages for RinVita.
// Used by upload modal, retranslate action, PDF export modal, and Share Brief modal.

export interface SupportedLanguage {
  code: string;       // ISO 639-1 (or BCP-47 short)
  name: string;       // English display name
  nativeName?: string;
  rtl?: boolean;
}

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "ar", name: "Arabic", nativeName: "العربية", rtl: true },
  { code: "zh", name: "Mandarin", nativeName: "中文" },
  { code: "es", name: "Spanish", nativeName: "Español" },
  { code: "fr", name: "French", nativeName: "Français" },
  { code: "tr", name: "Turkish", nativeName: "Türkçe" },
  { code: "ru", name: "Russian", nativeName: "Русский" },
  { code: "pl", name: "Polish", nativeName: "Polski" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी" },
  { code: "pt", name: "Portuguese", nativeName: "Português" },
  { code: "de", name: "German", nativeName: "Deutsch" },
  { code: "it", name: "Italian", nativeName: "Italiano" },
  { code: "sq", name: "Albanian", nativeName: "Shqip" },
  { code: "nl", name: "Dutch", nativeName: "Nederlands" },
  { code: "el", name: "Greek", nativeName: "Ελληνικά" },
  { code: "he", name: "Hebrew", nativeName: "עברית", rtl: true },
  { code: "ja", name: "Japanese", nativeName: "日本語" },
  { code: "ko", name: "Korean", nativeName: "한국어" },
  { code: "th", name: "Thai", nativeName: "ไทย" },
  { code: "vi", name: "Vietnamese", nativeName: "Tiếng Việt" },
  { code: "ur", name: "Urdu", nativeName: "اردو", rtl: true },
  { code: "fa", name: "Persian", nativeName: "فارسی", rtl: true },
  { code: "sw", name: "Swahili", nativeName: "Kiswahili" },
  { code: "ro", name: "Romanian", nativeName: "Română" },
  { code: "uk", name: "Ukrainian", nativeName: "Українська" },
  { code: "cs", name: "Czech", nativeName: "Čeština" },
  { code: "sv", name: "Swedish", nativeName: "Svenska" },
  { code: "no", name: "Norwegian", nativeName: "Norsk" },
  { code: "da", name: "Danish", nativeName: "Dansk" },
  { code: "fi", name: "Finnish", nativeName: "Suomi" },
  { code: "hu", name: "Hungarian", nativeName: "Magyar" },
  { code: "bg", name: "Bulgarian", nativeName: "Български" },
  { code: "sr", name: "Serbian", nativeName: "Српски" },
  { code: "hr", name: "Croatian", nativeName: "Hrvatski" },
  { code: "sk", name: "Slovak", nativeName: "Slovenčina" },
  { code: "sl", name: "Slovenian", nativeName: "Slovenščina" },
  { code: "lt", name: "Lithuanian", nativeName: "Lietuvių" },
  { code: "lv", name: "Latvian", nativeName: "Latviešu" },
  { code: "et", name: "Estonian", nativeName: "Eesti" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు" },
  { code: "mr", name: "Marathi", nativeName: "मराठी" },
  { code: "id", name: "Indonesian", nativeName: "Bahasa Indonesia" },
  { code: "ms", name: "Malay", nativeName: "Bahasa Melayu" },
  { code: "tl", name: "Tagalog", nativeName: "Tagalog" },
];

export const RTL_LANGUAGE_CODES = new Set(
  SUPPORTED_LANGUAGES.filter((l) => l.rtl).map((l) => l.code),
);

export const getLanguageName = (code?: string | null): string => {
  if (!code) return "English";
  const found = SUPPORTED_LANGUAGES.find((l) => l.code === code.toLowerCase());
  return found?.name || code.toUpperCase();
};

export const getLanguageByCode = (code?: string | null): SupportedLanguage | undefined => {
  if (!code) return undefined;
  return SUPPORTED_LANGUAGES.find((l) => l.code === code.toLowerCase());
};

// Localised PDF section headings — used by PDF export so the entire output
// is in the export language (not just the data fields).
type PdfStrings = {
  cover_subtitle: string;
  patient: string;
  date_of_birth: string;
  generated: string;
  page: string;
  of: string;
  alerts: string;
  allergies: string;
  blood_results: string;
  imaging: string;
  medications: string;
  documents: string;
  visit_history: string;
  selected_documents: string;
  appendix_originals: string;
  marker: string;
  value: string;
  unit: string;
  range: string;
  status: string;
  source: string;
  date: string;
  name: string;
  dose: string;
  frequency: string;
  prescriber: string;
  facility: string;
  active: string;
  yes: string;
  no: string;
  type: string;
  country: string;
  pages: string;
  extracted: string;
  region: string;
  finding: string;
  no_findings: string;
  substance: string;
  reaction: string;
  severity: string;
  footer: string;
  no_data: string;
};

const PDF_STRINGS_EN: PdfStrings = {
  cover_subtitle: "Your health history. Everywhere you go.",
  patient: "Patient",
  date_of_birth: "Date of Birth",
  generated: "Generated",
  page: "Page",
  of: "of",
  alerts: "Key Alerts",
  allergies: "Allergies",
  blood_results: "Blood Results",
  imaging: "Imaging Findings",
  medications: "Medications",
  documents: "Uploaded Documents",
  visit_history: "Visit History",
  selected_documents: "Selected Documents",
  appendix_originals: "Appendix — Original Documents",
  marker: "Marker",
  value: "Value",
  unit: "Unit",
  range: "Range",
  status: "Status",
  source: "Source",
  date: "Date",
  name: "Name",
  dose: "Dose",
  frequency: "Frequency",
  prescriber: "Prescriber",
  facility: "Facility",
  active: "Active",
  yes: "Yes",
  no: "No",
  type: "Type",
  country: "Country",
  pages: "Pages",
  extracted: "Extracted",
  region: "Region",
  finding: "Finding",
  no_findings: "No findings recorded",
  substance: "Substance",
  reaction: "Reaction",
  severity: "Severity",
  footer:
    "Generated by RinVita Health Intelligence. This document contains extracted health data and is not a substitute for original clinical records. RinVita is not a medical device. ICO Registration ZC123014.",
  no_data: "No data available for this section.",
};

// Translated copies for every supported export language.
// Pre-translated strings keep PDF rendering instant (no AI call needed for headings/labels).
// Keep keys in sync with PdfStrings type above.
const PDF_STRING_OVERRIDES: Partial<Record<string, Partial<PdfStrings>>> = {
  ar: {
    cover_subtitle: "سجلك الصحي. معك أينما ذهبت.",
    patient: "المريض",
    date_of_birth: "تاريخ الميلاد",
    generated: "تم الإنشاء",
    page: "صفحة",
    of: "من",
    alerts: "تنبيهات مهمة",
    allergies: "الحساسيات",
    blood_results: "نتائج الدم",
    imaging: "نتائج التصوير",
    medications: "الأدوية",
    documents: "المستندات المرفوعة",
    visit_history: "سجل الزيارات",
    selected_documents: "المستندات المحددة",
    appendix_originals: "ملحق — المستندات الأصلية",
    marker: "المؤشر", value: "القيمة", unit: "الوحدة", range: "النطاق", status: "الحالة",
    source: "المصدر", date: "التاريخ", name: "الاسم", dose: "الجرعة", frequency: "التكرار",
    prescriber: "الطبيب الواصف", facility: "المنشأة", active: "نشط", yes: "نعم", no: "لا",
    type: "النوع", country: "البلد", pages: "الصفحات", extracted: "مستخرج",
    region: "المنطقة", finding: "النتيجة", no_findings: "لا توجد نتائج مسجلة",
    substance: "المادة", reaction: "التفاعل", severity: "الشدة",
    footer: "تم إنشاؤه بواسطة RinVita Health Intelligence. يحتوي هذا المستند على بيانات صحية مستخرجة وليس بديلاً عن السجلات السريرية الأصلية. RinVita ليست جهازًا طبيًا. تسجيل ICO رقم ZC123014.",
    no_data: "لا توجد بيانات لهذا القسم.",
  },
  es: {
    cover_subtitle: "Tu historial médico. Donde quieras que vayas.",
    patient: "Paciente", date_of_birth: "Fecha de nacimiento", generated: "Generado",
    page: "Página", of: "de", alerts: "Alertas clave", allergies: "Alergias",
    blood_results: "Resultados de sangre", imaging: "Resultados de imágenes",
    medications: "Medicamentos", documents: "Documentos cargados",
    visit_history: "Historial de visitas", selected_documents: "Documentos seleccionados",
    appendix_originals: "Apéndice — Documentos originales",
    marker: "Marcador", value: "Valor", unit: "Unidad", range: "Rango", status: "Estado",
    source: "Fuente", date: "Fecha", name: "Nombre", dose: "Dosis", frequency: "Frecuencia",
    prescriber: "Prescriptor", facility: "Centro", active: "Activo", yes: "Sí", no: "No",
    type: "Tipo", country: "País", pages: "Páginas", extracted: "Extraído",
    region: "Región", finding: "Hallazgo", no_findings: "Sin hallazgos registrados",
    substance: "Sustancia", reaction: "Reacción", severity: "Gravedad",
    footer: "Generado por RinVita Health Intelligence. Este documento contiene datos médicos extraídos y no sustituye los registros clínicos originales. RinVita no es un dispositivo médico. Registro ICO ZC123014.",
    no_data: "No hay datos disponibles para esta sección.",
  },
  fr: {
    cover_subtitle: "Votre historique médical. Partout où vous allez.",
    patient: "Patient", date_of_birth: "Date de naissance", generated: "Généré",
    page: "Page", of: "sur", alerts: "Alertes clés", allergies: "Allergies",
    blood_results: "Résultats sanguins", imaging: "Résultats d'imagerie",
    medications: "Médicaments", documents: "Documents téléchargés",
    visit_history: "Historique des visites", selected_documents: "Documents sélectionnés",
    appendix_originals: "Annexe — Documents originaux",
    marker: "Marqueur", value: "Valeur", unit: "Unité", range: "Plage", status: "Statut",
    source: "Source", date: "Date", name: "Nom", dose: "Dose", frequency: "Fréquence",
    prescriber: "Prescripteur", facility: "Établissement", active: "Actif", yes: "Oui", no: "Non",
    type: "Type", country: "Pays", pages: "Pages", extracted: "Extrait",
    region: "Région", finding: "Constatation", no_findings: "Aucune constatation enregistrée",
    substance: "Substance", reaction: "Réaction", severity: "Gravité",
    footer: "Généré par RinVita Health Intelligence. Ce document contient des données de santé extraites et ne remplace pas les dossiers cliniques originaux. RinVita n'est pas un dispositif médical. Enregistrement ICO ZC123014.",
    no_data: "Aucune donnée disponible pour cette section.",
  },
  de: {
    cover_subtitle: "Ihre Krankengeschichte. Überall, wo Sie hingehen.",
    patient: "Patient", date_of_birth: "Geburtsdatum", generated: "Erstellt",
    page: "Seite", of: "von", alerts: "Wichtige Warnungen", allergies: "Allergien",
    blood_results: "Blutergebnisse", imaging: "Bildgebung",
    medications: "Medikamente", documents: "Hochgeladene Dokumente",
    visit_history: "Besuchsverlauf", selected_documents: "Ausgewählte Dokumente",
    appendix_originals: "Anhang — Originaldokumente",
    marker: "Marker", value: "Wert", unit: "Einheit", range: "Bereich", status: "Status",
    source: "Quelle", date: "Datum", name: "Name", dose: "Dosis", frequency: "Häufigkeit",
    prescriber: "Verschreiber", facility: "Einrichtung", active: "Aktiv", yes: "Ja", no: "Nein",
    type: "Typ", country: "Land", pages: "Seiten", extracted: "Extrahiert",
    region: "Region", finding: "Befund", no_findings: "Keine Befunde verzeichnet",
    substance: "Substanz", reaction: "Reaktion", severity: "Schweregrad",
    footer: "Erstellt von RinVita Health Intelligence. Dieses Dokument enthält extrahierte Gesundheitsdaten und ist kein Ersatz für klinische Originalunterlagen. RinVita ist kein Medizinprodukt. ICO-Registrierung ZC123014.",
    no_data: "Keine Daten für diesen Abschnitt verfügbar.",
  },
  it: {
    cover_subtitle: "La tua storia medica. Ovunque tu vada.",
    patient: "Paziente", date_of_birth: "Data di nascita", generated: "Generato",
    page: "Pagina", of: "di", alerts: "Avvisi chiave", allergies: "Allergie",
    blood_results: "Risultati del sangue", imaging: "Diagnostica per immagini",
    medications: "Farmaci", documents: "Documenti caricati",
    visit_history: "Storico visite", selected_documents: "Documenti selezionati",
    appendix_originals: "Appendice — Documenti originali",
    marker: "Marcatore", value: "Valore", unit: "Unità", range: "Intervallo", status: "Stato",
    source: "Fonte", date: "Data", name: "Nome", dose: "Dose", frequency: "Frequenza",
    prescriber: "Prescrittore", facility: "Struttura", active: "Attivo", yes: "Sì", no: "No",
    type: "Tipo", country: "Paese", pages: "Pagine", extracted: "Estratto",
    region: "Regione", finding: "Reperto", no_findings: "Nessun reperto registrato",
    substance: "Sostanza", reaction: "Reazione", severity: "Gravità",
    footer: "Generato da RinVita Health Intelligence. Questo documento contiene dati sanitari estratti e non sostituisce le cartelle cliniche originali. RinVita non è un dispositivo medico. Registrazione ICO ZC123014.",
    no_data: "Nessun dato disponibile per questa sezione.",
  },
  pt: {
    cover_subtitle: "O seu histórico médico. Onde quer que vá.",
    patient: "Paciente", date_of_birth: "Data de nascimento", generated: "Gerado",
    page: "Página", of: "de", alerts: "Alertas principais", allergies: "Alergias",
    blood_results: "Resultados de sangue", imaging: "Imagiologia",
    medications: "Medicamentos", documents: "Documentos carregados",
    visit_history: "Histórico de visitas", selected_documents: "Documentos selecionados",
    appendix_originals: "Anexo — Documentos originais",
    marker: "Marcador", value: "Valor", unit: "Unidade", range: "Intervalo", status: "Estado",
    source: "Fonte", date: "Data", name: "Nome", dose: "Dose", frequency: "Frequência",
    prescriber: "Prescritor", facility: "Instalação", active: "Ativo", yes: "Sim", no: "Não",
    type: "Tipo", country: "País", pages: "Páginas", extracted: "Extraído",
    region: "Região", finding: "Achado", no_findings: "Sem achados registados",
    substance: "Substância", reaction: "Reação", severity: "Gravidade",
    footer: "Gerado pela RinVita Health Intelligence. Este documento contém dados de saúde extraídos e não substitui os registos clínicos originais. A RinVita não é um dispositivo médico. Registo ICO ZC123014.",
    no_data: "Sem dados disponíveis para esta secção.",
  },
  tr: {
    cover_subtitle: "Sağlık geçmişiniz. Gittiğiniz her yerde.",
    patient: "Hasta", date_of_birth: "Doğum tarihi", generated: "Oluşturuldu",
    page: "Sayfa", of: "/", alerts: "Önemli uyarılar", allergies: "Alerjiler",
    blood_results: "Kan sonuçları", imaging: "Görüntüleme bulguları",
    medications: "İlaçlar", documents: "Yüklenen belgeler",
    visit_history: "Ziyaret geçmişi", selected_documents: "Seçili belgeler",
    appendix_originals: "Ek — Orijinal belgeler",
    marker: "Belirteç", value: "Değer", unit: "Birim", range: "Aralık", status: "Durum",
    source: "Kaynak", date: "Tarih", name: "Ad", dose: "Doz", frequency: "Sıklık",
    prescriber: "Reçete eden", facility: "Tesis", active: "Aktif", yes: "Evet", no: "Hayır",
    type: "Tür", country: "Ülke", pages: "Sayfa", extracted: "Çıkarıldı",
    region: "Bölge", finding: "Bulgu", no_findings: "Kaydedilen bulgu yok",
    substance: "Madde", reaction: "Reaksiyon", severity: "Şiddet",
    footer: "RinVita Health Intelligence tarafından oluşturulmuştur. Bu belge çıkarılmış sağlık verilerini içerir ve orijinal klinik kayıtların yerine geçmez. RinVita bir tıbbi cihaz değildir. ICO Kayıt ZC123014.",
    no_data: "Bu bölüm için veri yok.",
  },
};

export const getPdfStrings = (langCode?: string): PdfStrings => {
  const code = (langCode || "en").toLowerCase();
  const overrides = PDF_STRING_OVERRIDES[code];
  if (!overrides) return PDF_STRINGS_EN;
  return { ...PDF_STRINGS_EN, ...overrides };
};
