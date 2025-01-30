import React, { useEffect, useState, useRef, useMemo } from 'react';
import '../styles/modules/landing.css';
import { WordCard } from './WordCard';
import { SentenceBuilder } from './SentenceBuilder';
import { useLanguage } from '../hooks/useLanguage';
import { SUPPORTED_LANGS as REGISTRY_LANGS } from '../lib/languages';
import { SelectDialog } from './modals/Dialogs';
import { ChevronDown } from 'lucide-react';

interface LandingPageProps {
  onStart: () => void;
}

const METADATA: Record<string, { font: string, align: string }> = {
    ur: { font: "'Noto Nastaliq Urdu', serif", align: 'right' },
    en: { font: "'Inter', sans-serif", align: 'left' },
    es: { font: "'Inter', sans-serif", align: 'left' },
    ar: { font: "'Noto Nastaliq Urdu', serif", align: 'right' },
    hi: { font: "'Inter', sans-serif", align: 'left' },
    zh: { font: "'Inter', sans-serif", align: 'left' },
    fr: { font: "'Inter', sans-serif", align: 'left' }
};

const SUPPORTED_LANGS = REGISTRY_LANGS.map(l => ({
    ...l,
    font: METADATA[l.code]?.font || "'Inter', sans-serif",
    align: METADATA[l.code]?.align || 'left'
}));

const LANDING_CONTENT: Record<string, any> = {
  ur: {
    problem_tag: "مسئلہ",
    problem_title: "رابطے کی خاموشی",
    problem_desc: "جدید ٹیکنالوجی نے ہمارے بزرگوں کے لیے پوشیدہ رکاوٹیں کھڑی کر دی ہیں۔ پیچیدہ انٹرفیس اور غیر ملکی زبانیں انہیں تنہا کر دیتی ہیں۔ ہر پیارے کو وقار اور آسانی کے ساتھ اپنی ضروریات بیان کرنے کا حق حاصل ہے۔",
    solution_tag: "حل",
    solution_title: "ایک ہمدرد ساتھی",
    solution_desc: "شکریہ ایک اردو اول، بغیر چھوئے بات چیت کا پلیٹ فارم ہے جو سکون کے لیے بنایا گیا ہے۔ یہ سادہ کاموں کو واضح گفتگو میں بدل دیتا ہے۔",
    f1_tag: "فیچر 01",
    f1_title: "الفاظ اور جملے",
    f1_desc: "مکمل جملے بنانے کے لیے نستعلیق ورڈ کارڈز کا استعمال کریں۔ اپنی روزمرہ کی ضروریات کے لیے الفاظ شامل کریں۔",
    f2_tag: "فیچر 02",
    f2_title: "تصویر سے گفتگو",
    f2_desc: "اپنی ضرورت کا خاکہ بنائیں۔ ہماری لوکل AI آپ کی ڈرائنگ کو فوری طور پر اردو الفاظ میں بدل دیتی ہے۔",
    f3_tag: "فیچر 03",
    f3_title: "بغیر چھوئے اشارے",
    f3_desc: "چہرے اور ہاتھ کے سادہ اشاروں سے ایپ کو کنٹرول کریں۔ چھونے کی ضرورت نہیں ہے۔",
    f4_tag: "فیچر 04",
    f4_title: "خاندان کی آواز",
    f4_desc: "روبوٹک آوازوں کی جگہ اپنے پیاروں کی آوازیں ریکارڈ کریں۔ ہر لفظ میں اپنائیت محسوس کریں۔",
    f5_tag: "فیچر 05",
    f5_title: "ہنگامی مدد (SOS)",
    f5_desc: "ذہنی سکون صرف ایک بٹن کی دوری پر۔ ہنگامی صورتحال میں فوری الارم اور خاندان کو اطلاع۔",
    privacy_tag: "ڈیجیٹل خودمختاری",
    privacy_title: "مکمل پرائیویسی",
    privacy_desc: "آپ کا ڈیٹا آپ کے آلے پر رہتا ہے۔ کوئی اکاؤنٹ نہیں، کوئی ٹریکنگ نہیں۔ 100% آف لائن۔",
    lang_tag: "عالمی رسائی",
    lang_title: "بڑھتی ہوئی زبانیں",
    lang_desc: "شکریہ اب بہت سی زبانوں میں دستیاب ہے۔ ہم اسے دنیا بھر کے بزرگوں کے لیے بہتر بنا رہے ہیں۔",
    pwa_tag: "انسٹال کریں",
    pwa_title: "شکریہ آپ کی ہوم اسکرین پر",
    pwa_desc: "کسی ایپ اسٹور کی ضرورت نہیں۔ ایک ٹیپ میں شکریہ حاصل کریں۔ یہ آف لائن کام کرتا ہے۔",
    gift_tag: "تحفہ",
    gift_title: "انسانیت کی خدمت",
    gift_desc: "شکریہ ہمیشہ مفت رہے گا۔ کوئی اشتہار نہیں، کوئی فیس نہیں۔ اگر آپ کو کوئی بگ ملے تو ہمیں بتائیں۔",
    install_btn: "ایپ انسٹال کریں",
    launch_btn: "ایپ شروع کریں",
    contribute_btn: "گٹ ہب پر تعاون کریں",
    bug_report: "🐛 بگ رپورٹ کریں",
    whatsapp_placeholder: "سوال پوچھیں یا رائے دیں...",
    send_wa: "واٹس ایپ پر بھیجیں"
  },
  en: {
    problem_tag: "The Problem",
    problem_title: "Silent Isolation",
    problem_desc: "Modern technology has created invisible barriers. Complex interfaces and foreign languages leave our elders feeling isolated and frustrated. Every loved one deserves a way to express their needs with dignity and ease.",
    solution_tag: "The Solution",
    solution_title: "The Empathetic Bridge",
    solution_desc: "Shukr is an Urdu-first, touchless communication platform built for comfort. It turns simple actions into clear speech, reconnecting families.",
    f1_tag: "Feature 01",
    f1_title: "Build Sentences Effortlessly",
    f1_desc: "Tap familiar word cards to build complete sentences. Easily add custom words or phrases to personalize your vocabulary.",
    f2_tag: "Feature 02",
    f2_title: "Sketch to Search",
    f2_desc: "Can't find the right word? Draw a simple sketch. Our local AI instantly translates your doodles into spoken words.",
    f3_tag: "Feature 03",
    f3_title: "Hands-Free Control",
    f3_desc: "Navigate using face and hand gestures. Perfect for those with limited mobility. No touch required.",
    f4_tag: "Feature 04",
    f4_title: "The Warmth of Family",
    f4_desc: "Replace robotic voices with the voices of loved ones. Record custom audio so they hear the people they trust.",
    f5_tag: "Feature 05",
    f5_title: "Instant SOS Alerts",
    f5_desc: "Peace of mind is just a long-press away. Notify family members immediately when urgent help is needed.",
    privacy_tag: "Digital Sovereignty",
    privacy_title: "100% Offline First",
    privacy_desc: "Your family's conversations never leave the device. No accounts, no cloud, no tracking. Absolute privacy.",
    lang_tag: "Global Access",
    lang_title: "Growing Language Support",
    lang_desc: "Shukr is expanding to support more languages and cultures. Help us make communication accessible for everyone.",
    pwa_tag: "Install Now",
    pwa_title: "Shukr on your Screen",
    pwa_desc: "No App Store needed. One tap to get Shukr on your home screen. Works natively, offline, forever.",
    gift_tag: "A Gift",
    gift_title: "A Gift to Humanity",
    gift_desc: "Shukr will always be free. No subscriptions, no ads, no paywalls. If you found a bug, reach out directly.",
    install_btn: "Install App",
    launch_btn: "Launch App",
    contribute_btn: "Contribute on GitHub",
    bug_report: "🐛 Report a Bug",
    whatsapp_placeholder: "Ask a question or send feedback...",
    send_wa: "Send to WhatsApp"
  },
  es: {
    problem_tag: "El Problema",
    problem_title: "Aislamiento Silencioso",
    problem_desc: "La tecnología moderna ha creado barreras invisibles. Las interfaces complejas y los idiomas extranjeros dejan a nuestros mayores aislados.",
    solution_tag: "La Solución",
    solution_title: "El Puente Empático",
    solution_desc: "Shukr es una plataforma de comunicación sin contacto, diseñada para el confort y la dignidad.",
    f1_tag: "Función 01",
    f1_title: "Construye Frases",
    f1_desc: "Toca tarjetas de palabras familiares para construir oraciones completas fácilmente.",
    f2_tag: "Función 02",
    f2_title: "Dibujar para Buscar",
    f2_desc: "Dibuja un boceto simple y nuestra IA lo traducirá instantáneamente en palabras habladas.",
    f3_tag: "Función 03",
    f3_title: "Control sin Manos",
    f3_desc: "Navega usando gestos faciales y manuales. Ideal para movilidad limitada.",
    f4_tag: "Función 04",
    f4_title: "Calidez Familiar",
    f4_desc: "Graba las voces de tus seres queridos para que la comunicación se sienta personal.",
    f5_tag: "Función 05",
    f5_title: "Alertas SOS",
    f5_desc: "Paz mental con un solo toque largo para alertar a la familia en emergencias.",
    privacy_tag: "Soberanía Digital",
    privacy_title: "100% Fuera de Línea",
    privacy_desc: "Tus datos nunca salen del dispositivo. Sin cuentas ni rastreo.",
    lang_tag: "Acceso Global",
    lang_title: "Más Idiomas",
    lang_desc: "Shukr se expande para apoyar más idiomas. Ayúdanos en GitHub.",
    pwa_tag: "Instalar Ahora",
    pwa_title: "Shukr en tu Pantalla",
    pwa_desc: "Sin necesidad de App Store. Un toque para tener Shukr. Funciona sin conexión.",
    gift_tag: "Un Regalo",
    gift_title: "Un Regalo a la Humanidad",
    gift_desc: "Shukr siempre será gratis. Sin anuncios ni suscripciones.",
    install_btn: "Instalar App",
    launch_btn: "Iniciar App",
    contribute_btn: "Contribuir en GitHub",
    bug_report: "🐛 Reportar Error",
    whatsapp_placeholder: "Pregunta o sugerencia...",
    send_wa: "Enviar a WhatsApp"
  },
  ar: {
    problem_tag: "المشكلة",
    problem_title: "العزلة الصامتة",
    problem_desc: "خلق التكنولوجيا الحديثة حواجز غير مرئية لكبار السن. الواجهات المعقدة واللغات الأجنبية تتركهم يشعرون بالعزلة.",
    solution_tag: "الحل",
    solution_title: "الجسر المتعاطف",
    solution_desc: "شكر هو منصة تواصل بدون لمس، مصممة للراحة والكرامة.",
    f1_tag: "الميزة 01",
    f1_title: "بناء الجمل بسهولة",
    f1_desc: "اضغط على بطاقات الكلمات المألوفة لبناء جمل كاملة. أضف كلمات مخصصة بسهولة.",
    f2_tag: "الميزة 02",
    f2_title: "الرسم للبحث",
    f2_desc: "ارسم شكلاً بسيطاً وسيقوم الذكاء الاصطناعي بتحويله إلى كلمات منطوقة فوراً.",
    f3_tag: "الميزة 03",
    f3_title: "التحكم بدون يدين",
    f3_desc: "التنقل باستخدام إيماءات الوجه واليد. مثالي لذوي الحركة المحدودة.",
    f4_tag: "الميزة 04",
    f4_title: "دفء العائلة",
    f4_desc: "سجل أصوات أفراد العائلة لجعل كل كلمة منطوقة تبدو شخصية ومألوفة.",
    f5_tag: "الميزة 05",
    f5_title: "تنبيهات SOS",
    f5_desc: "راحة البال بضغطة واحدة طويلة لتنبيه العائلة في حالات الطوارئ.",
    privacy_tag: "السيادة الرقمية",
    privacy_title: "100% بدون إنترنت",
    privacy_desc: "بياناتك لا تغادر جهازك أبداً. لا حسابات ولا تتبع.",
    lang_tag: "وصول عالمي",
    lang_title: "دعم لغات متزايد",
    lang_desc: "شكر يتوسع لدعم المزيد من اللغات. ساعدنا على GitHub.",
    pwa_tag: "تثبيت الآن",
    pwa_title: "شكر على شاشتك",
    pwa_desc: "لا حاجة لمتجر تطبيقات. ضغطة واحدة للحصول على شكر. يعمل بدون إنترنت.",
    gift_tag: "هدية",
    gift_title: "هدية للإنسانية",
    gift_desc: "شكر سيكون دائماً مجانياً. لا إعلانات ولا اشتراكات.",
    install_btn: "تثبيت التطبيق",
    launch_btn: "ابدأ التطبيق",
    contribute_btn: "ساهم على GitHub",
    bug_report: "🐛 أبلغ عن خطأ",
    whatsapp_placeholder: "اسأل أو شاركنا رأيك...",
    send_wa: "إرسال عبر واتساب"
  },
  bn: {
    problem_tag: "সমস্যা",
    problem_title: "নিঃশব্দ বিচ্ছিন্নতা",
    problem_desc: "আধুনিক প্রযুক্তি আমাদের বয়স্কদের জন্য অদৃশ্য বাধা তৈরি করেছে। জটিল ইন্টারফেস এবং বিদেশী ভাষা তাদের বিচ্ছিন্ন করে দেয়।",
    solution_tag: "সমাধান",
    solution_title: "সহমর্মিতার সেতু",
    solution_desc: "শুকর হলো একটি স্পর্শহীন যোগাযোগ মাধ্যম, যা বয়স্কদের মর্যাদাকে ফিরিয়ে দিতে তৈরি করা হয়েছে।",
    f1_tag: "ফিচার ০১",
    f1_title: "সহজে বাক্য গঠন",
    f1_desc: "সম্পূর্ণ বাক্য তৈরি করতে পরিচিত শব্দ কার্ডগুলো ব্যবহার করুন। আপনার প্রয়োজন অনুযায়ী শব্দ যোগ করুন।",
    f2_tag: "ফিচার ০২",
    f2_title: "আঁকার মাধ্যমে শব্দ সন্ধান",
    f2_desc: "সহজ একটি ছবি আঁকুন, এবং আমাদের লোকাল AI আপনার ড্রয়িংকে তাৎক্ষণিকভাবে শব্দে রূপান্তরিত করবে।",
    f3_tag: "ফিচার ০৩",
    f3_title: "স্পর্শহীন নিয়ন্ত্রণ",
    f3_desc: "মুখ এবং হাতের সহজ ইশারার মাধ্যমে অ্যাপটি নিয়ন্ত্রণ করুন। স্পর্শ করার প্রয়োজন নেই।",
    f4_tag: "ফিচার ০৪",
    f4_title: "পরিবারের কণ্ঠস্বর",
    f4_desc: "রোবোটিক শব্দের বদলে আপনার প্রিয়জনদের কণ্ঠস্বর রেকর্ড করুন। প্রতিটি শব্দে আপনভাব অনুভব করুন।",
    f5_tag: "ফিচার ০৫",
    f5_title: "জরুরী অ্যালার্ট (SOS)",
    f5_desc: "জরুরী পরিস্থিতিতে তাৎক্ষণিক অ্যালার্ম এবং পরিবারকে অবহিত করার সুবিধা।",
    privacy_tag: "ডিজিটাল সার্বভৌমত্ব",
    privacy_title: "১০০% অফলাইন",
    privacy_desc: "আপনার ডেটা আপনার ডিভাইসেই থাকে। কোনো অ্যাকাউন্ট বা ট্র্যাকিং নেই।",
    lang_tag: "বিশ্বব্যাপী প্রসার",
    lang_title: "ক্রমবর্ধমান ভাষা সমর্থন",
    lang_desc: "শুকর এখন অনেক ভাষায় উপলব্ধ। আমাদের সাহায্য করতে GitHub এ যোগ দিন।",
    pwa_tag: "ইনস্টল করুন",
    pwa_title: "আপনার স্ক্রিনে শুকর",
    pwa_desc: "অ্যাপ স্টোরের প্রয়োজন নেই। এক ট্যাপে আপনার হোম স্ক্রিনে শুকর পান। এটি অফলাইনে কাজ করে।",
    gift_tag: "উপহার",
    gift_title: "মানবতার সেবা",
    gift_desc: "শুকর সবসময় বিনামূল্যে থাকবে। কোনো বিজ্ঞাপন বা সাবস্ক্রিপশন নেই।",
    install_btn: "অ্যাপ ইনস্টল করুন",
    launch_btn: "অ্যাপ শুরু করুন",
    contribute_btn: "GitHub এ অবদান রাখুন",
    bug_report: "🐛 বাগ রিপোর্ট করুন",
    whatsapp_placeholder: "প্রশ্ন জিজ্ঞাসা করুন...",
    send_wa: "WhatsApp এ পাঠান"
  },
  hi: {
    problem_tag: "समस्या",
    problem_title: "खामोश अलगाव",
    problem_desc: "आधुनिक तकनीक ने हमारे बुजुर्गों के लिए बाधाएं खड़ी कर दी हैं। जटिल इंटरफ़ेस और विदेशी भाषाएं उन्हें अकेला महसूस कराती हैं।",
    solution_tag: "समाधान",
    solution_title: "एक सहानुभूतिपूर्ण सेतु",
    solution_desc: "शुक्र एक टचलेस संचार मंच है जिसे बुजुर्गों के सम्मान और सुविधा के लिए बनाया गया है।",
    f1_tag: "फीचर 01",
    f1_title: "आसानी से वाक्य बनाएं",
    f1_desc: "पूरे वाक्य बनाने के लिए परिचित वर्ड कार्ड्स का उपयोग करें। अपनी जरूरत के शब्द जोड़ें।",
    f2_tag: "फीचर 02",
    f2_title: "चित्र से शब्द खोज",
    f2_desc: "एक साधारण चित्र बनाएं और हमारी AI इसे तुरंत बोले जाने वाले शब्दों में बदल देगी।",
    f3_tag: "फीचर 03",
    f3_title: "टचलेस कंट्रोल",
    f3_desc: "चेहरे और हाथ के इशारों से ऐप को कंट्रोल करें। टच की जरूरत नहीं है।",
    f4_tag: "फीचर 04",
    f4_title: "अपनों की आवाज़",
    f4_desc: "रोबोटिक आवाज़ के बजाय अपने परिवार के सदस्यों की आवाज़ रिकॉर्ड करें।",
    f5_tag: "फीचर 05",
    f5_title: "आपातकालीन अलर्ट (SOS)",
    f5_desc: "आपातकालीन स्थिति में तुरंत अलार्म और परिवार को सूचित करने की सुविधा।",
    privacy_tag: "डिजिटल संप्रभुता",
    privacy_title: "100% ऑफलाइन",
    privacy_desc: "आपका डेटा आपके डिवाइस पर रहता है। कोई अकाउंट या ट्रैकिंग नहीं।",
    lang_tag: "वैश्विक पहुंच",
    lang_title: "भाषा समर्थन",
    lang_desc: "शुक्र अब कई भाषाओं में उपलब्ध है। GitHub पर हमारा साथ दें।",
    pwa_tag: "अभी इंस्टॉल करें",
    pwa_title: "शुक्र आपकी स्क्रीन पर",
    pwa_desc: "किसी ऐप स्टोर की आवश्यकता नहीं। एक टैप में शुक्र प्राप्त करें। यह ऑफलाइन काम करता है।",
    gift_tag: "उपहार",
    gift_title: "मानवता के लिए उपहार",
    gift_desc: "शुक्र हमेशा मुफ़्त रहेगा। कोई विज्ञापन या शुल्क नहीं।",
    install_btn: "ऐप इंस्टॉल करें",
    launch_btn: "ऐप शुरू करें",
    contribute_btn: "GitHub पर मदद करें",
    bug_report: "🐛 बग रिपोर्ट करें",
    whatsapp_placeholder: "सवाल पूछें...",
    send_wa: "WhatsApp पर भेजें"
  }
};

export const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
  const { primaryLanguage, secondaryLanguage, setLanguagePair } = useLanguage();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [showLangSelect, setShowLangSelect] = useState(false);
  const builderScrollRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const primary = useMemo(() => LANDING_CONTENT[primaryLanguage] || LANDING_CONTENT['en'], [primaryLanguage]);
  const secondary = useMemo(() => LANDING_CONTENT[secondaryLanguage] || LANDING_CONTENT['en'], [secondaryLanguage]);

  const pConfig = useMemo(() => SUPPORTED_LANGS.find(l => l.code === primaryLanguage), [primaryLanguage]);
  const sConfig = useMemo(() => SUPPORTED_LANGS.find(l => l.code === secondaryLanguage), [secondaryLanguage]);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstallable(false);
    }
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setIsInstallable(false);
    setDeferredPrompt(null);
  };

  const scrollSlide = (direction: 'up' | 'down') => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const slideHeight = container.offsetHeight;
    const currentScroll = container.scrollTop;
    
    let targetScroll;
    if (direction === 'down') {
      targetScroll = Math.ceil((currentScroll + 1) / slideHeight) * slideHeight;
    } else {
      targetScroll = Math.floor((currentScroll - 1) / slideHeight) * slideHeight;
    }
    
    container.scrollTo({
      top: targetScroll,
      behavior: 'smooth'
    });
  };

  return (
    <div className="landing-container" 
         ref={containerRef}
         dir={pConfig?.align === 'right' ? 'rtl' : 'ltr'} 
         style={{ 
           '--font-primary-override': pConfig?.font,
           '--font-secondary-override': sConfig?.font,
           '--slide-text-align': pConfig?.align === 'right' ? 'right' : 'left',
           '--slide-text-align-rev': pConfig?.align === 'right' ? 'left' : 'right'
         } as any}>
      
      <div className="landing-nav-controls">
        <button className="nav-arrow-btn" onClick={() => scrollSlide('up')} aria-label="Previous Slide">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 15l-6-6-6 6"/></svg>
        </button>
        <button className="nav-arrow-btn" onClick={() => scrollSlide('down')} aria-label="Next Slide">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg>
        </button>
      </div>

      <header className="landing-header" dir="ltr">
        <div className="landing-logo">
          <span>شکریہ</span> Shukr
        </div>
        
        <div className="lang-picker-group">
          <button 
            className="lang-select-minimal"
            style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'transparent', border: 'none', padding: '2px 4px', cursor: 'pointer' }}
            onClick={() => setShowLangSelect(true)}
          >
            <span>{SUPPORTED_LANGS.find(l => l.code === primaryLanguage)?.label}</span>
            <ChevronDown size={14} />
          </button>
        </div>

        <div style={{ display: 'flex', gap: '0.4rem' }}>
          {isInstallable && (
            <button className="btn-pitch btn-pitch-white" style={{ padding: '0.4rem 0.75rem', fontSize: '0.7rem' }} onClick={handleInstall}>
              {primary.install_btn}
            </button>
          )}
          <button className="btn-pitch btn-pitch-primary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.7rem' }} onClick={onStart}>
            {primary.launch_btn}
          </button>
        </div>
      </header>

      <SelectDialog
        isOpen={showLangSelect}
        onClose={() => setShowLangSelect(false)}
        title="Select Language (زبان کا انتخاب)"
        options={SUPPORTED_LANGS.map(l => ({ value: l.code, label: l.label }))}
        selectedValue={primaryLanguage}
        onSelect={(val) => {
          const newSec = val === secondaryLanguage ? (val === 'en' ? 'ur' : 'en') : secondaryLanguage;
          setLanguagePair(val, newSec);
          setShowLangSelect(false);
        }}
      />

      <main>
        {/* SLIDE 1: WHY (The Problem) + VIDEO */}
        <section className="pitch-slide slide-why">
          <div className="slide-content">
            <div className="tagline">{primary.problem_tag}</div>
            <h2 className="slide-title-primary">{primary.problem_title}</h2>
            <h2 className="slide-title-secondary">{secondary.problem_title}</h2>
            <p className="slide-desc" style={{ maxWidth: '800px', marginBottom: '2.5rem' }}>
              {primary.problem_desc}
            </p>
            
            <div className="video-hero-container">
              <iframe 
                src="https://www.youtube.com/embed/hPDp2pjVfZk?si=VAnut3GOT5NSG239" 
                title="Shukr Walkthrough" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                allowFullScreen
              ></iframe>
            </div>

            <div style={{ marginTop: '3rem' }}>
              <button className="btn-pitch btn-pitch-primary" onClick={onStart}>
                {primary.launch_btn}
              </button>
            </div>
          </div>
          <div className="scroll-hint">Scroll to See Features</div>
        </section>

        {/* SLIDE 2: WHAT (The Solution) */}
        <section className="pitch-slide slide-what">
          <div className="slide-content-split">
            <div className="slide-text-side">
              <div className="tagline">{primary.solution_tag}</div>
              <h2 className="slide-title-primary">{primary.solution_title}</h2>
              <h2 className="slide-title-secondary">{secondary.solution_title}</h2>
              <p className="slide-desc" style={{ marginBottom: '2.5rem' }}>
                {primary.solution_desc}
              </p>
              <button className="btn-pitch btn-pitch-white" onClick={onStart}>
                {primary.launch_btn}
              </button>
            </div>
            <div className="slide-visual-side">
               <div className="floating-mockup" style={{ width: '100%', maxWidth: '480px' }}>
                  <SentenceBuilder
                     words={[{ id: 'intro_1', ur: 'السلام علیکم', en: 'Salam', icon: 'volume2' }]}
                     onClear={() => {}}
                     onBackspace={() => {}}
                     onPlay={() => {}}
                     focusedIndex={-1}
                     offset={0}
                     canAddWords={true}
                     builderScrollRef={builderScrollRef}
                     flashBorder={false}
                     currentlyPlayingId={null}
                  />
               </div>
            </div>
          </div>
        </section>

        {/* SLIDE 3: DIGITAL SOVEREIGNTY */}
        <section className="pitch-slide slide-feature">
          <div className="slide-content-split reverse">
            <div className="slide-text-side">
              <div className="tagline">{primary.privacy_tag}</div>
              <h2 className="slide-title-primary">{primary.privacy_title}</h2>
              <h2 className="slide-title-secondary">{secondary.privacy_title}</h2>
              <p className="slide-desc" style={{ marginBottom: '2.5rem' }}>
                {primary.privacy_desc}
              </p>
              <button className="btn-pitch btn-pitch-primary" onClick={onStart}>
                {primary.launch_btn}
              </button>
            </div>
            <div className="slide-visual-side">
              <div className="floating-mockup">
                <div className="mockup-bare-component" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem', width: '100%', maxWidth: '340px' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>Local Data</span>
                      <div style={{ width: '44px', height: '22px', background: '#4ade80', borderRadius: '11px' }} />
                   </div>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: 0.5 }}>
                      <span style={{ fontWeight: 800, fontSize: '1.1rem', textDecoration: 'line-through' }}>Cloud Sync</span>
                      <div style={{ width: '44px', height: '22px', background: '#e5e7eb', borderRadius: '11px', position: 'relative' }}>
                         <div style={{ position: 'absolute', left: '3px', top: '3px', width: '16px', height: '16px', background: '#9ca3af', borderRadius: '50%' }} />
                      </div>
                   </div>
                   <div style={{ marginTop: '1rem', padding: '1.25rem', background: 'rgba(45,90,39,0.05)', borderRadius: '16px', fontSize: '0.95rem', color: 'var(--color-primary)', fontWeight: 800, textAlign: 'center', border: '1px solid var(--color-primary)' }}>
                      ✓ OFFLINE SECURE
                   </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SLIDE 4: FEATURE 1 (Words & Sentences) */}
        <section className="pitch-slide slide-feature">
          <div className="slide-content-split">
            <div className="slide-text-side">
              <div className="tagline">{primary.f1_tag}</div>
              <h2 className="slide-title-primary">{primary.f1_title}</h2>
              <h2 className="slide-title-secondary">{secondary.f1_title}</h2>
              <p className="slide-desc" style={{ marginBottom: '2.5rem' }}>
                {primary.f1_desc}
              </p>
              <button className="btn-pitch btn-pitch-primary" onClick={onStart}>
                {primary.launch_btn}
              </button>
            </div>
            <div className="slide-visual-side">
              <div className="floating-mockup">
                <div className="mockup-phone-tilted">
                   <div style={{ padding: '4.5rem 1.25rem 1.25rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                      <WordCard 
                        item={{ id: 'sys_iwant', ur: 'مجھے', en: 'I want', roman: 'mujhe', icon: 'user' }} 
                        isFocused={false} 
                        variant={1} 
                        onClick={() => {}} 
                      />
                      <WordCard 
                        item={{ id: 'sys_water', ur: 'پانی', en: 'Water', roman: 'paani', icon: 'droplets' }} 
                        isFocused={true} 
                        variant={1} 
                        onClick={() => {}} 
                      />
                   </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SLIDE 5: FEATURE 2 (Doodle) */}
        <section className="pitch-slide slide-feature">
          <div className="slide-content-split reverse">
            <div className="slide-text-side">
              <div className="tagline">{primary.f2_tag}</div>
              <h2 className="slide-title-primary">{primary.f2_title}</h2>
              <h2 className="slide-title-secondary">{secondary.f2_title}</h2>
              <p className="slide-desc" style={{ marginBottom: '2.5rem' }}>
                {primary.f2_desc}
              </p>
              <button className="btn-pitch btn-pitch-primary" onClick={onStart}>
                {primary.launch_btn}
              </button>
            </div>
            <div className="slide-visual-side">
              <div className="floating-mockup">
                <div className="mockup-tab" style={{ background: '#fff', border: '12px solid #1a1a1a' }}>
                   <div style={{ width: '100%', height: '100%', padding: '2.5rem', display: 'flex', flexDirection: 'column' }}>
                      <div style={{ flex: 1, border: '2px dashed #ccc', borderRadius: '16px', position: 'relative', background: '#fdfdfd', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                         <svg width="80%" height="80%" viewBox="0 0 200 150">
                            <circle cx="100" cy="75" r="40" fill="none" stroke="var(--color-primary)" strokeWidth="6" />
                            <path d="M100,35 Q110,10 120,20" fill="none" stroke="var(--color-primary)" strokeWidth="6" strokeLinecap="round" />
                         </svg>
                      </div>
                   </div>
                </div>
                <div className="mockup-ui-card-floating" style={{ bottom: '-15%', right: '5%' }}>
                   <WordCard 
                      item={{ id: 'sys_apple', ur: 'سیب', en: 'Apple', roman: 'saib', icon: 'utensils' }} 
                      isFocused={false} 
                      variant={1} 
                      onClick={() => {}} 
                   />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SLIDE 6: FEATURE 3 (Gestures) */}
        <section className="pitch-slide slide-feature">
          <div className="slide-content-split">
            <div className="slide-text-side">
              <div className="tagline">{primary.f3_tag}</div>
              <h2 className="slide-title-primary">{primary.f3_title}</h2>
              <h2 className="slide-title-secondary">{secondary.f3_title}</h2>
              <p className="slide-desc" style={{ marginBottom: '2.5rem' }}>
                {primary.f3_desc}
              </p>
              <button className="btn-pitch btn-pitch-primary" onClick={onStart}>
                {primary.launch_btn}
              </button>
            </div>
            <div className="slide-visual-side">
              <div className="floating-mockup">
                <div className="mockup-phone-tilted" style={{ transform: 'rotate(5deg)', background: '#111' }}>
                   <div style={{ flex: 1, height: '100%', position: 'relative', overflow: 'hidden' }}>
                      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at center, rgba(45,90,39,0.3) 0%, transparent 70%)', zIndex: 1 }} />
                      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 2 }}>
                         <span style={{ fontSize: '5.5rem' }}>🖐️</span>
                      </div>
                      <div style={{ position: 'absolute', bottom: '30px', left: '30px', right: '30px', height: '3px', background: 'var(--color-accent)', borderRadius: '2px', animation: 'scan 2.5s infinite linear', boxShadow: '0 0 15px var(--color-accent)' }} />
                   </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SLIDE 7: FEATURE 4 (Voice Studio) */}
        <section className="pitch-slide slide-feature">
          <div className="slide-content-split reverse">
            <div className="slide-text-side">
              <div className="tagline">{primary.f4_tag}</div>
              <h2 className="slide-title-primary">{primary.f4_title}</h2>
              <h2 className="slide-title-secondary">{secondary.f4_title}</h2>
              <p className="slide-desc" style={{ marginBottom: '2.5rem' }}>
                {primary.f4_desc}
              </p>
              <button className="btn-pitch btn-pitch-primary" onClick={onStart}>
                {primary.launch_btn}
              </button>
            </div>
            <div className="slide-visual-side">
              <div className="floating-mockup">
                <div className="mockup-phone-tilted" style={{ transform: 'rotate(-5deg)' }}>
                   <div style={{ padding: '3.5rem 1.5rem' }}>
                      <div className="mockup-ui-circle" style={{ margin: '0 auto 2.5rem auto', width: '90px', height: '90px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '2.5rem', background: 'var(--color-primary)', boxShadow: '0 10px 30px rgba(45,90,39,0.4)' }}>🎙️</div>
                      <div style={{ display: 'flex', gap: '8px', height: '90px', alignItems: 'center', marginBottom: '3.5rem' }}>
                        {[30, 70, 100, 50, 80, 40, 90, 60, 40, 70, 50, 80].map((h, i) => (
                          <div key={i} style={{ flex: 1, height: `${h}%`, background: 'var(--color-accent)', borderRadius: '6px', animation: `wave 1.5s ease-in-out infinite ${i * 0.1}s` }} />
                        ))}
                      </div>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SLIDE 8: FEATURE 5 (SOS) */}
        <section className="pitch-slide slide-feature">
          <div className="slide-content-split">
            <div className="slide-text-side">
              <div className="tagline">{primary.f5_tag}</div>
              <h2 className="slide-title-primary">{primary.f5_title}</h2>
              <h2 className="slide-title-secondary">{secondary.f5_title}</h2>
              <p className="slide-desc" style={{ marginBottom: '2.5rem' }}>
                {primary.f5_desc}
              </p>
              <button className="btn-pitch btn-pitch-primary" onClick={onStart}>
                {primary.launch_btn}
              </button>
            </div>
            <div className="slide-visual-side">
              <div className="floating-mockup">
                <div className="mockup-bare-component" style={{ padding: '3rem', borderRadius: '50%', background: 'rgba(220, 38, 38, 0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center', animation: 'pulse 1.5s infinite' }}>
                   <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: 'var(--color-danger)', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 10px 30px rgba(220, 38, 38, 0.4)' }}>
                      <span style={{ color: 'white', fontSize: '3rem', fontWeight: 900 }}>SOS</span>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SLIDE 9: GROWING LANGUAGE SUPPORT */}
        <section className="pitch-slide slide-feature">
          <div className="slide-content-split reverse">
            <div className="slide-text-side">
              <div className="tagline">{primary.lang_tag}</div>
              <h2 className="slide-title-primary">{primary.lang_title}</h2>
              <h2 className="slide-title-secondary">{secondary.lang_title}</h2>
              <p className="slide-desc" style={{ marginBottom: '2.5rem' }}>
                {primary.lang_desc}
              </p>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                <a href="https://github.com/hammaadworks/shukr" target="_blank" rel="noreferrer" className="btn-pitch btn-pitch-primary">
                  {primary.contribute_btn}
                </a>
                <button className="btn-pitch btn-pitch-white" onClick={onStart}>
                  {primary.launch_btn}
                </button>
              </div>
            </div>
            <div className="slide-visual-side">
              <div className="floating-mockup">
                <div className="mockup-bare-component" style={{ padding: '2rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', maxWidth: '400px', justifyContent: 'center' }}>
                   {SUPPORTED_LANGS.map(l => (
                     <div key={l.code} style={{ background: 'var(--color-bg)', padding: '0.75rem 1.25rem', borderRadius: '12px', fontWeight: 800, border: '1px solid rgba(45,90,39,0.1)' }}>
                        {l.label}
                     </div>
                   ))}
                   <div style={{ background: 'var(--color-accent)', padding: '0.75rem 1.25rem', borderRadius: '12px', fontWeight: 800, color: 'var(--color-primary)' }}>
                      + Many More
                   </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SLIDE 10: PWA (Dedicated) */}
        <section className="pitch-slide slide-where">
          <div className="slide-content">
            <span className="feature-icon-large">📲</span>
            <div className="tagline">{primary.pwa_tag}</div>
            <h2 className="slide-title-primary">{primary.pwa_title}</h2>
            <h2 className="slide-title-secondary">{secondary.pwa_title}</h2>
            <p className="slide-desc" style={{ marginBottom: '3rem', maxWidth: '700px' }}>
              {primary.pwa_desc}
            </p>
            <div className="pitch-cta-group">
              {isInstallable && (
                <button className="btn-pitch btn-pitch-white" onClick={handleInstall} style={{ boxShadow: '0 15px 35px rgba(0,0,0,0.2)' }}>
                  {primary.install_btn}
                </button>
              )}
              <button className="btn-pitch btn-pitch-primary" onClick={onStart} style={{ boxShadow: '0 15px 35px rgba(45,90,39,0.3)' }}>
                {primary.launch_btn}
              </button>
            </div>
          </div>
        </section>

        {/* SLIDE 11: FREE FOREVER & CONTACT */}
        <section className="pitch-slide slide-final">
          <div className="slide-content">
            <div className="free-forever-badge">100% FREE FOREVER</div>
            <h2 className="slide-title-primary">{primary.gift_title}</h2>
            <h2 className="slide-title-secondary">{secondary.gift_title}</h2>
            <p className="slide-desc" style={{ opacity: 0.9 }}>
              {primary.gift_desc}
            </p>

            <form 
              className="contact-form"
              onSubmit={(e) => {
                e.preventDefault();
                const msg = (e.currentTarget.elements.namedItem('message') as HTMLTextAreaElement).value;
                window.open(`https://wa.me/919663527755?text=${encodeURIComponent(msg)}`, '_blank');
              }}
            >
              <textarea 
                name="message" 
                className="contact-input" 
                placeholder={primary.whatsapp_placeholder}
                rows={3}
                required
              />
              <button type="submit" className="btn-pitch btn-pitch-primary" style={{ width: '100%' }}>
                {primary.send_wa}
              </button>
            </form>

            <div className="social-links" style={{ flexWrap: 'wrap' }}>
              <a href="https://github.com/hammaadworks/shukr/issues/new" target="_blank" rel="noreferrer" className="social-link" style={{ background: 'var(--color-primary)', color: 'white' }}>{primary.bug_report}</a>
              <a href="mailto:hammaadworks@gmail.com" className="social-link">Email</a>
              <a href="tel:+919663527755" className="social-link">Call</a>
              <a href="https://github.com/hammaadworks" target="_blank" rel="noreferrer" className="social-link">GitHub</a>
            </div>
            <p style={{ marginTop: '2rem', fontSize: '0.8rem', opacity: 0.6 }}>
              WhatsApp: +91 96635 27755 | hammaadworks@gmail.com
            </p>
          </div>
        </section>
      </main>
    </div>
  );
};
