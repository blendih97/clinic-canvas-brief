// Text for the notice a recipient sees before opening a shared health brief.
// Deliberately law-neutral: recipients may be anywhere in the world, so it refers to
// "the rules where you work" rather than naming one country's law.

export interface ShareGateText {
  title: string;
  intro: string;
  body: string;
  open: string;
  notForMe: string;
  logged: string;
  language: string;
  loading: string;
  declinedTitle: string;
  declinedBody: string;
}

export interface ShareGateLanguage {
  code: string;
  name: string; // in its own language
  dir: "ltr" | "rtl";
  text: ShareGateText;
}

export const SHARE_GATE_LANGUAGES: ShareGateLanguage[] = [
  {
    code: "en", name: "English", dir: "ltr",
    text: {
      title: "Medical records shared with you",
      intro: "A patient has shared their medical records with you through RinVita.",
      body: "These records are confidential. Please use them only for this patient's care, and handle them under the medical confidentiality and data protection rules where you work.",
      open: "Open records",
      notForMe: "This isn't for me",
      logged: "Opening the records is logged with the time and your IP address.",
      language: "Language",
      loading: "Opening…",
      declinedTitle: "Records not opened",
      declinedBody: "Nothing was opened. If this link was sent to you by mistake, you can close this page and let the sender know.",
    },
  },
  {
    code: "ar", name: "العربية", dir: "rtl",
    text: {
      title: "سجلات طبية تمت مشاركتها معك",
      intro: "شارك أحد المرضى سجلاته الطبية معك عبر RinVita.",
      body: "هذه السجلات سرية. يُرجى استخدامها فقط لرعاية هذا المريض، والتعامل معها وفقًا لقواعد السرية الطبية وحماية البيانات المعمول بها في مكان عملك.",
      open: "فتح السجلات",
      notForMe: "هذا ليس موجّهًا إليّ",
      logged: "يتم تسجيل فتح السجلات مع الوقت وعنوان IP الخاص بك.",
      language: "اللغة",
      loading: "جارٍ الفتح…",
      declinedTitle: "لم يتم فتح السجلات",
      declinedBody: "لم يتم فتح أي شيء. إذا أُرسل إليك هذا الرابط عن طريق الخطأ، يمكنك إغلاق هذه الصفحة وإبلاغ المُرسِل.",
    },
  },
  {
    code: "zh", name: "中文（简体）", dir: "ltr",
    text: {
      title: "与您共享的病历",
      intro: "一位患者通过 RinVita 与您共享了其病历。",
      body: "这些病历属于保密信息。请仅将其用于该患者的诊疗，并遵守您执业所在地的医疗保密和数据保护规定。",
      open: "打开病历",
      notForMe: "这不是发给我的",
      logged: "打开病历的时间和您的 IP 地址将被记录。",
      language: "语言",
      loading: "正在打开…",
      declinedTitle: "未打开病历",
      declinedBody: "未打开任何内容。如果此链接是误发给您的，您可以关闭此页面并告知发送者。",
    },
  },
  {
    code: "fr", name: "Français", dir: "ltr",
    text: {
      title: "Dossier médical partagé avec vous",
      intro: "Un patient a partagé son dossier médical avec vous via RinVita.",
      body: "Ces informations sont confidentielles. Veuillez les utiliser uniquement pour la prise en charge de ce patient, dans le respect des règles de secret médical et de protection des données applicables là où vous exercez.",
      open: "Ouvrir le dossier",
      notForMe: "Ce message ne m'est pas destiné",
      logged: "L'ouverture du dossier est enregistrée avec l'heure et votre adresse IP.",
      language: "Langue",
      loading: "Ouverture…",
      declinedTitle: "Dossier non ouvert",
      declinedBody: "Rien n'a été ouvert. Si ce lien vous a été envoyé par erreur, vous pouvez fermer cette page et prévenir l'expéditeur.",
    },
  },
  {
    code: "de", name: "Deutsch", dir: "ltr",
    text: {
      title: "Mit Ihnen geteilte medizinische Unterlagen",
      intro: "Ein Patient hat seine medizinischen Unterlagen über RinVita mit Ihnen geteilt.",
      body: "Diese Unterlagen sind vertraulich. Bitte verwenden Sie sie ausschließlich für die Behandlung dieses Patienten und behandeln Sie sie gemäß der ärztlichen Schweigepflicht und den Datenschutzvorschriften, die an Ihrem Arbeitsort gelten.",
      open: "Unterlagen öffnen",
      notForMe: "Das ist nicht für mich",
      logged: "Das Öffnen der Unterlagen wird mit Uhrzeit und Ihrer IP-Adresse protokolliert.",
      language: "Sprache",
      loading: "Wird geöffnet…",
      declinedTitle: "Unterlagen nicht geöffnet",
      declinedBody: "Es wurde nichts geöffnet. Falls Sie diesen Link irrtümlich erhalten haben, schließen Sie diese Seite und informieren Sie den Absender.",
    },
  },
  {
    code: "id", name: "Bahasa Indonesia", dir: "ltr",
    text: {
      title: "Rekam medis yang dibagikan kepada Anda",
      intro: "Seorang pasien telah membagikan rekam medisnya kepada Anda melalui RinVita.",
      body: "Rekam medis ini bersifat rahasia. Gunakan hanya untuk perawatan pasien ini, dan tangani sesuai dengan aturan kerahasiaan medis dan perlindungan data yang berlaku di tempat Anda bekerja.",
      open: "Buka rekam medis",
      notForMe: "Ini bukan untuk saya",
      logged: "Pembukaan rekam medis dicatat beserta waktu dan alamat IP Anda.",
      language: "Bahasa",
      loading: "Membuka…",
      declinedTitle: "Rekam medis tidak dibuka",
      declinedBody: "Tidak ada yang dibuka. Jika tautan ini terkirim kepada Anda secara keliru, Anda dapat menutup halaman ini dan memberi tahu pengirimnya.",
    },
  },
  {
    code: "it", name: "Italiano", dir: "ltr",
    text: {
      title: "Documentazione medica condivisa con lei",
      intro: "Un paziente ha condiviso con lei la propria documentazione medica tramite RinVita.",
      body: "Questa documentazione è riservata. La utilizzi esclusivamente per l'assistenza a questo paziente, nel rispetto del segreto medico e delle norme sulla protezione dei dati vigenti dove lavora.",
      open: "Apri la documentazione",
      notForMe: "Non è destinato a me",
      logged: "L'apertura della documentazione viene registrata con l'orario e il suo indirizzo IP.",
      language: "Lingua",
      loading: "Apertura…",
      declinedTitle: "Documentazione non aperta",
      declinedBody: "Non è stato aperto nulla. Se ha ricevuto questo link per errore, può chiudere questa pagina e avvisare il mittente.",
    },
  },
  {
    code: "pt", name: "Português", dir: "ltr",
    text: {
      title: "Registros médicos compartilhados com você",
      intro: "Um paciente compartilhou os registros médicos dele com você pelo RinVita.",
      body: "Estas informações são confidenciais. Use-as somente para o atendimento deste paciente e trate-as de acordo com as regras de sigilo médico e proteção de dados aplicáveis onde você trabalha.",
      open: "Abrir registros",
      notForMe: "Isto não é para mim",
      logged: "A abertura dos registros é registrada com o horário e o seu endereço IP.",
      language: "Idioma",
      loading: "Abrindo…",
      declinedTitle: "Registros não abertos",
      declinedBody: "Nada foi aberto. Se este link foi enviado a você por engano, feche esta página e avise o remetente.",
    },
  },
  {
    code: "ru", name: "Русский", dir: "ltr",
    text: {
      title: "С вами поделились медицинскими документами",
      intro: "Пациент поделился с вами своими медицинскими документами через RinVita.",
      body: "Эти документы конфиденциальны. Используйте их только для лечения этого пациента и соблюдайте правила врачебной тайны и защиты персональных данных, действующие по месту вашей работы.",
      open: "Открыть документы",
      notForMe: "Это не для меня",
      logged: "Открытие документов фиксируется с указанием времени и вашего IP-адреса.",
      language: "Язык",
      loading: "Открытие…",
      declinedTitle: "Документы не открыты",
      declinedBody: "Ничего не было открыто. Если ссылка пришла вам по ошибке, закройте эту страницу и сообщите отправителю.",
    },
  },
  {
    code: "es", name: "Español", dir: "ltr",
    text: {
      title: "Historial médico compartido con usted",
      intro: "Un paciente ha compartido su historial médico con usted a través de RinVita.",
      body: "Esta información es confidencial. Úsela únicamente para la atención de este paciente y trátela conforme a las normas de confidencialidad médica y protección de datos aplicables donde usted ejerce.",
      open: "Abrir historial",
      notForMe: "Esto no es para mí",
      logged: "La apertura del historial queda registrada con la hora y su dirección IP.",
      language: "Idioma",
      loading: "Abriendo…",
      declinedTitle: "Historial no abierto",
      declinedBody: "No se ha abierto nada. Si recibió este enlace por error, puede cerrar esta página e informar al remitente.",
    },
  },
  {
    code: "th", name: "ไทย", dir: "ltr",
    text: {
      title: "เวชระเบียนที่มีผู้แชร์กับคุณ",
      intro: "ผู้ป่วยรายหนึ่งได้แชร์เวชระเบียนของตนกับคุณผ่าน RinVita",
      body: "ข้อมูลนี้เป็นความลับ โปรดใช้เพื่อการดูแลรักษาผู้ป่วยรายนี้เท่านั้น และปฏิบัติตามหลักการรักษาความลับทางการแพทย์และกฎหมายคุ้มครองข้อมูลส่วนบุคคลที่ใช้บังคับในสถานที่ที่คุณปฏิบัติงาน",
      open: "เปิดเวชระเบียน",
      notForMe: "ข้อความนี้ไม่ได้ส่งถึงฉัน",
      logged: "ระบบจะบันทึกเวลาและหมายเลข IP ของคุณเมื่อเปิดเวชระเบียน",
      language: "ภาษา",
      loading: "กำลังเปิด…",
      declinedTitle: "ยังไม่ได้เปิดเวชระเบียน",
      declinedBody: "ไม่มีการเปิดข้อมูลใด ๆ หากคุณได้รับลิงก์นี้โดยไม่ได้ตั้งใจ โปรดปิดหน้านี้และแจ้งผู้ส่ง",
    },
  },
  {
    code: "tr", name: "Türkçe", dir: "ltr",
    text: {
      title: "Sizinle paylaşılan tıbbi kayıtlar",
      intro: "Bir hasta, tıbbi kayıtlarını RinVita aracılığıyla sizinle paylaştı.",
      body: "Bu kayıtlar gizlidir. Lütfen yalnızca bu hastanın bakımı için kullanın ve çalıştığınız yerde geçerli olan hekimlik gizliliği ve kişisel verilerin korunması kurallarına uygun şekilde işleyin.",
      open: "Kayıtları aç",
      notForMe: "Bu bana gönderilmedi",
      logged: "Kayıtların açılması, saat ve IP adresinizle birlikte kaydedilir.",
      language: "Dil",
      loading: "Açılıyor…",
      declinedTitle: "Kayıtlar açılmadı",
      declinedBody: "Hiçbir şey açılmadı. Bu bağlantı size yanlışlıkla gönderildiyse sayfayı kapatıp gönderene bildirebilirsiniz.",
    },
  },
];

const STORAGE_KEY = "rinvita.shareGateLang";

export function findShareGateLanguage(code: string | null | undefined): ShareGateLanguage | undefined {
  if (!code) return undefined;
  const primary = code.toLowerCase().split(/[-_]/)[0];
  return SHARE_GATE_LANGUAGES.find((l) => l.code === primary);
}

/** The viewer's saved choice, else their browser's preferred language, else English. */
export function initialShareGateLanguage(): ShareGateLanguage {
  try {
    const saved = findShareGateLanguage(localStorage.getItem(STORAGE_KEY));
    if (saved) return saved;
  } catch { /* storage unavailable */ }
  if (typeof navigator !== "undefined") {
    const prefs = (navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language]) as readonly string[];
    for (const p of prefs) {
      const hit = findShareGateLanguage(p);
      if (hit) return hit;
    }
  }
  return SHARE_GATE_LANGUAGES[0];
}

export function saveShareGateLanguage(code: string) {
  try { localStorage.setItem(STORAGE_KEY, code); } catch { /* storage unavailable */ }
}
