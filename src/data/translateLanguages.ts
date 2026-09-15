// Language landing-page configuration for the free medical-document translator.
// Glossaries are orientation aids only — never presented as clinical guidance.

export type GlossaryEntry = { term: string; meaning: string };

export type TranslateLanguage = {
  /** URL slug segment, e.g. "polish" -> /translate/polish-medical-records-to-english */
  slug: string;
  /** Language name as used in copy. */
  name: string;
  /** ISO code of the source language (for analytics only). */
  code: string;
  /** Country/context sentence used in the intro. */
  context: string;
  rtl?: boolean;
  glossary: GlossaryEntry[];
};

export const TRANSLATE_LANGUAGES: TranslateLanguage[] = [
  {
    slug: "polish",
    name: "Polish",
    code: "pl",
    context:
      "results from a laboratory in Poland, a karta informacyjna from a hospital stay, or a child's vaccination record",
    glossary: [
      { term: "morfologia krwi", meaning: "full blood count" },
      { term: "glukoza na czczo", meaning: "fasting glucose" },
      { term: "hemoglobina glikowana (HbA1c)", meaning: "glycated haemoglobin" },
      { term: "lipidogram", meaning: "lipid profile" },
      { term: "kreatynina", meaning: "creatinine" },
      { term: "wynik badania", meaning: "test result" },
      { term: "karta informacyjna leczenia szpitalnego / wypis", meaning: "hospital discharge summary" },
      { term: "recepta", meaning: "prescription" },
      { term: "skierowanie", meaning: "referral" },
      { term: "USG", meaning: "ultrasound" },
      { term: "rezonans magnetyczny", meaning: "MRI" },
      { term: "karta szczepień", meaning: "vaccination record" },
    ],
  },
  {
    slug: "romanian",
    name: "Romanian",
    code: "ro",
    context:
      "analize from a laboratory in Romania, a bilet de externare after a hospital stay, or a child's carnet de vaccinări",
    glossary: [
      { term: "analize de sânge", meaning: "blood tests" },
      { term: "hemogramă completă", meaning: "full blood count" },
      { term: "glicemie", meaning: "blood glucose" },
      { term: "hemoglobină glicată", meaning: "HbA1c" },
      { term: "colesterol total", meaning: "total cholesterol" },
      { term: "creatinină", meaning: "creatinine" },
      { term: "bilet de externare", meaning: "discharge note" },
      { term: "rețetă", meaning: "prescription" },
      { term: "trimitere", meaning: "referral" },
      { term: "ecografie", meaning: "ultrasound" },
      { term: "RMN", meaning: "MRI" },
      { term: "carnet de vaccinări", meaning: "vaccination record" },
    ],
  },
  {
    slug: "spanish",
    name: "Spanish",
    code: "es",
    context:
      "an analítica from Spain or Latin America, an informe de alta after a hospital stay, or a child's cartilla de vacunación",
    glossary: [
      { term: "hemograma", meaning: "full blood count" },
      { term: "glucosa en ayunas", meaning: "fasting glucose" },
      { term: "hemoglobina glicosilada", meaning: "HbA1c" },
      { term: "colesterol total", meaning: "total cholesterol" },
      { term: "triglicéridos", meaning: "triglycerides" },
      { term: "creatinina", meaning: "creatinine" },
      { term: "informe de alta", meaning: "discharge report" },
      { term: "receta", meaning: "prescription" },
      { term: "volante / derivación", meaning: "referral" },
      { term: "ecografía", meaning: "ultrasound" },
      { term: "resonancia magnética", meaning: "MRI" },
      { term: "cartilla de vacunación", meaning: "vaccination record" },
    ],
  },
  {
    slug: "portuguese",
    name: "Portuguese",
    code: "pt",
    context:
      "a hemograma from Portugal or Brazil, a sumário de alta after a hospital stay, or a caderneta de vacinação",
    glossary: [
      { term: "hemograma completo", meaning: "full blood count" },
      { term: "glicemia em jejum", meaning: "fasting glucose" },
      { term: "hemoglobina glicada", meaning: "HbA1c" },
      { term: "colesterol total", meaning: "total cholesterol" },
      { term: "creatinina", meaning: "creatinine" },
      { term: "laudo (Brazil) / relatório (Portugal)", meaning: "medical report" },
      { term: "nota de alta / sumário de alta", meaning: "discharge summary" },
      { term: "receita médica", meaning: "prescription" },
      { term: "encaminhamento", meaning: "referral" },
      { term: "ecografia (PT) / ultrassonografia (BR)", meaning: "ultrasound" },
      { term: "ressonância magnética", meaning: "MRI" },
      { term: "boletim / caderneta de vacinação", meaning: "vaccination record" },
    ],
  },
  {
    slug: "italian",
    name: "Italian",
    code: "it",
    context:
      "a referto from an Italian laboratory, a lettera di dimissione after a hospital stay, or a libretto delle vaccinazioni",
    glossary: [
      { term: "emocromo", meaning: "full blood count" },
      { term: "glicemia a digiuno", meaning: "fasting glucose" },
      { term: "emoglobina glicata", meaning: "HbA1c" },
      { term: "colesterolo totale", meaning: "total cholesterol" },
      { term: "creatinina", meaning: "creatinine" },
      { term: "referto", meaning: "report" },
      { term: "lettera di dimissione", meaning: "discharge letter" },
      { term: "ricetta", meaning: "prescription" },
      { term: "impegnativa", meaning: "referral" },
      { term: "ecografia", meaning: "ultrasound" },
      { term: "risonanza magnetica", meaning: "MRI" },
      { term: "libretto delle vaccinazioni", meaning: "vaccination record" },
    ],
  },
  {
    slug: "french",
    name: "French",
    code: "fr",
    context:
      "a bilan sanguin from France, Belgium or North Africa, a compte rendu d'hospitalisation, or a child's carnet de santé",
    glossary: [
      { term: "NFS (numération formule sanguine)", meaning: "full blood count" },
      { term: "glycémie à jeun", meaning: "fasting glucose" },
      { term: "hémoglobine glyquée", meaning: "HbA1c" },
      { term: "bilan lipidique", meaning: "lipid profile" },
      { term: "créatinine", meaning: "creatinine" },
      { term: "compte rendu", meaning: "report" },
      { term: "compte rendu d'hospitalisation", meaning: "discharge summary" },
      { term: "ordonnance", meaning: "prescription" },
      { term: "lettre d'adressage", meaning: "referral letter" },
      { term: "échographie", meaning: "ultrasound" },
      { term: "IRM", meaning: "MRI" },
      { term: "carnet de santé", meaning: "health/vaccination record" },
    ],
  },
  {
    slug: "german",
    name: "German",
    code: "de",
    context:
      "a Befund from Germany, Austria or Switzerland, an Arztbrief after a hospital stay, or an Impfpass",
    glossary: [
      { term: "großes Blutbild", meaning: "full blood count" },
      { term: "Nüchternblutzucker", meaning: "fasting glucose" },
      { term: "HbA1c", meaning: "glycated haemoglobin" },
      { term: "Lipidprofil / Blutfettwerte", meaning: "lipid profile" },
      { term: "Kreatinin", meaning: "creatinine" },
      { term: "Befund", meaning: "findings/report" },
      { term: "Entlassungsbrief / Arztbrief", meaning: "discharge/doctor's letter" },
      { term: "Rezept", meaning: "prescription" },
      { term: "Überweisung", meaning: "referral" },
      { term: "Ultraschall / Sonographie", meaning: "ultrasound" },
      { term: "MRT", meaning: "MRI" },
      { term: "Impfpass", meaning: "vaccination record" },
    ],
  },
  {
    slug: "dutch",
    name: "Dutch",
    code: "nl",
    context:
      "an uitslag from a Dutch or Belgian laboratory, an ontslagbrief after a hospital stay, or a vaccinatiebewijs",
    glossary: [
      { term: "bloedbeeld", meaning: "blood count" },
      { term: "nuchtere glucose", meaning: "fasting glucose" },
      { term: "HbA1c", meaning: "glycated haemoglobin" },
      { term: "cholesterol", meaning: "cholesterol" },
      { term: "kreatinine", meaning: "creatinine" },
      { term: "uitslag", meaning: "result" },
      { term: "ontslagbrief", meaning: "discharge letter" },
      { term: "recept", meaning: "prescription" },
      { term: "verwijzing", meaning: "referral" },
      { term: "echo", meaning: "ultrasound" },
      { term: "MRI", meaning: "MRI" },
      { term: "vaccinatiebewijs", meaning: "vaccination record" },
    ],
  },
  {
    slug: "greek",
    name: "Greek",
    code: "el",
    context:
      "a γενική αίματος from a Greek or Cypriot laboratory, an εξιτήριο after a hospital stay, or a βιβλιάριο υγείας",
    glossary: [
      { term: "γενική αίματος", meaning: "full blood count" },
      { term: "γλυκόζη νηστείας", meaning: "fasting glucose" },
      { term: "γλυκοζυλιωμένη αιμοσφαιρίνη", meaning: "HbA1c" },
      { term: "χοληστερίνη", meaning: "cholesterol" },
      { term: "κρεατινίνη", meaning: "creatinine" },
      { term: "γνωμάτευση", meaning: "medical opinion/report" },
      { term: "εξιτήριο", meaning: "discharge note" },
      { term: "συνταγή", meaning: "prescription" },
      { term: "παραπεμπτικό", meaning: "referral" },
      { term: "υπέρηχος", meaning: "ultrasound" },
      { term: "μαγνητική τομογραφία", meaning: "MRI" },
      { term: "βιβλιάριο υγείας", meaning: "health booklet/vaccination record" },
    ],
  },
  {
    slug: "turkish",
    name: "Turkish",
    code: "tr",
    context:
      "a tahlil sonucu from a Turkish laboratory, an epikriz after a hospital stay, or a child's aşı kartı",
    glossary: [
      { term: "hemogram / tam kan sayımı", meaning: "full blood count" },
      { term: "açlık kan şekeri", meaning: "fasting glucose" },
      { term: "HbA1c", meaning: "glycated haemoglobin" },
      { term: "kolesterol", meaning: "cholesterol" },
      { term: "kreatinin", meaning: "creatinine" },
      { term: "tahlil sonucu", meaning: "test result" },
      { term: "epikriz", meaning: "discharge summary" },
      { term: "reçete", meaning: "prescription" },
      { term: "sevk", meaning: "referral" },
      { term: "ultrason", meaning: "ultrasound" },
      { term: "MR", meaning: "MRI" },
      { term: "aşı kartı", meaning: "vaccination card" },
    ],
  },
  {
    slug: "russian",
    name: "Russian",
    code: "ru",
    context:
      "an общий анализ крови from a laboratory, a выписной эпикриз after a hospital stay, or a сертификат о прививках",
    glossary: [
      { term: "общий анализ крови (ОАК)", meaning: "full blood count" },
      { term: "глюкоза натощак", meaning: "fasting glucose" },
      { term: "гликированный гемоглобин", meaning: "HbA1c" },
      { term: "холестерин", meaning: "cholesterol" },
      { term: "креатинин", meaning: "creatinine" },
      { term: "заключение", meaning: "conclusion/report" },
      { term: "выписной эпикриз / выписка", meaning: "discharge summary" },
      { term: "рецепт", meaning: "prescription" },
      { term: "направление", meaning: "referral" },
      { term: "УЗИ", meaning: "ultrasound" },
      { term: "МРТ", meaning: "MRI" },
      { term: "сертификат о прививках", meaning: "vaccination certificate" },
    ],
  },
  {
    slug: "arabic",
    name: "Arabic",
    code: "ar",
    context:
      "a تقرير طبي from a hospital in the Gulf, North Africa or the Levant, a discharge report, or a child's بطاقة التطعيم",
    rtl: true,
    glossary: [
      { term: "تعداد الدم الكامل", meaning: "full blood count" },
      { term: "سكر الدم الصائم", meaning: "fasting glucose" },
      { term: "الهيموغلوبين السكري", meaning: "HbA1c" },
      { term: "الكوليسترول", meaning: "cholesterol" },
      { term: "الكرياتينين", meaning: "creatinine" },
      { term: "تقرير طبي", meaning: "medical report" },
      { term: "تقرير الخروج", meaning: "discharge report" },
      { term: "وصفة طبية", meaning: "prescription" },
      { term: "تحويل", meaning: "referral" },
      { term: "الموجات فوق الصوتية", meaning: "ultrasound" },
      { term: "الرنين المغناطيسي", meaning: "MRI" },
      { term: "بطاقة التطعيم", meaning: "vaccination card" },
    ],
  },
  {
    slug: "chinese",
    name: "Chinese (Mandarin)",
    code: "zh",
    context:
      "a 检验报告 from a hospital in China, Taiwan or Singapore, a 出院小结 after an admission, or a 预防接种证",
    glossary: [
      { term: "血常规", meaning: "full blood count" },
      { term: "空腹血糖", meaning: "fasting glucose" },
      { term: "糖化血红蛋白", meaning: "HbA1c" },
      { term: "总胆固醇", meaning: "total cholesterol" },
      { term: "肌酐", meaning: "creatinine" },
      { term: "检验报告", meaning: "lab report" },
      { term: "出院小结", meaning: "discharge summary" },
      { term: "处方", meaning: "prescription" },
      { term: "转诊", meaning: "referral" },
      { term: "B超", meaning: "ultrasound" },
      { term: "核磁共振", meaning: "MRI" },
      { term: "预防接种证", meaning: "vaccination certificate" },
    ],
  },
];

export const translatePath = (slug: string) => `/translate/${slug}-medical-records-to-english`;

export const findTranslateLanguage = (slug: string | undefined): TranslateLanguage | undefined => {
  if (!slug) return undefined;
  const match = slug.match(/^([a-z]+)-medical-records-to-english$/);
  if (!match) return undefined;
  return TRANSLATE_LANGUAGES.find((l) => l.slug === match[1]);
};
