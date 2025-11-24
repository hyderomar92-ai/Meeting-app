
import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'ar' | 'fr' | 'es' | 'de';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  dir: 'ltr' | 'rtl';
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    "app.name": "Sentinel",
    "nav.dashboard": "Dashboard",
    "nav.new_entry": "New Entry",
    "nav.students": "Students",
    "nav.history": "History Logs",
    "nav.behaviour": "Behaviour",
    "nav.seating": "Seating Plan",
    "nav.reports": "Reports",
    "nav.safeguarding": "Safeguarding",
    "nav.specialized": "Specialized",
    "user.switch": "Switch User",
    "dashboard.title": "Dashboard",
    "dashboard.welcome": "Welcome back",
    "chat.placeholder": "Ask about students, risks, or logs...",
    "chat.processing": "Processing school data...",
    "lang.en": "English",
    "lang.ar": "Arabic (العربية)",
    "lang.fr": "French (Français)",
    "lang.es": "Spanish (Español)",
    "lang.de": "German (Deutsch)"
  },
  ar: {
    "app.name": "سنتينل",
    "nav.dashboard": "لوحة القيادة",
    "nav.new_entry": "إدخال جديد",
    "nav.students": "الطلاب",
    "nav.history": "سجل التاريخ",
    "nav.behaviour": "السلوك",
    "nav.seating": "مخطط المقاعد",
    "nav.reports": "التقارير",
    "nav.safeguarding": "حماية الطفل",
    "nav.specialized": "متخصص",
    "user.switch": "تغيير المستخدم",
    "dashboard.title": "لوحة القيادة",
    "dashboard.welcome": "مرحباً بعودتك",
    "chat.placeholder": "اسأل عن الطلاب، المخاطر، أو السجلات...",
    "chat.processing": "جارٍ تحليل البيانات...",
    "lang.en": "English",
    "lang.ar": "العربية",
    "lang.fr": "الفرنسية",
    "lang.es": "الأسبانية",
    "lang.de": "الألمانية"
  },
  fr: {
    "app.name": "Sentinel",
    "nav.dashboard": "Tableau de bord",
    "nav.new_entry": "Nouvelle entrée",
    "nav.students": "Étudiants",
    "nav.history": "Historique",
    "nav.behaviour": "Comportement",
    "nav.seating": "Plan de classe",
    "nav.reports": "Rapports",
    "nav.safeguarding": "Protection",
    "nav.specialized": "Spécialisé",
    "user.switch": "Changer d'utilisateur",
    "dashboard.title": "Tableau de bord",
    "dashboard.welcome": "Bon retour",
    "chat.placeholder": "Posez une question sur les élèves ou les risques...",
    "chat.processing": "Analyse des données...",
    "lang.en": "Anglais",
    "lang.ar": "Arabe",
    "lang.fr": "Français",
    "lang.es": "Espagnol",
    "lang.de": "Allemand"
  },
  es: {
    "app.name": "Centinela",
    "nav.dashboard": "Panel de Control",
    "nav.new_entry": "Nueva Entrada",
    "nav.students": "Estudiantes",
    "nav.history": "Historial",
    "nav.behaviour": "Comportamiento",
    "nav.seating": "Plan de Asientos",
    "nav.reports": "Informes",
    "nav.safeguarding": "Salvaguardia",
    "nav.specialized": "Especializado",
    "user.switch": "Cambiar Usuario",
    "dashboard.title": "Panel de Control",
    "dashboard.welcome": "Bienvenido de nuevo",
    "chat.placeholder": "Pregunte sobre estudiantes o riesgos...",
    "chat.processing": "Procesando datos...",
    "lang.en": "Inglés",
    "lang.ar": "Árabe",
    "lang.fr": "Francés",
    "lang.es": "Español",
    "lang.de": "Alemán"
  },
  de: {
    "app.name": "Sentinel",
    "nav.dashboard": "Dashboard",
    "nav.new_entry": "Neuer Eintrag",
    "nav.students": "Schüler",
    "nav.history": "Verlauf",
    "nav.behaviour": "Verhalten",
    "nav.seating": "Sitzplan",
    "nav.reports": "Berichte",
    "nav.safeguarding": "Schutz",
    "nav.specialized": "Spezialisiert",
    "user.switch": "Benutzer wechseln",
    "dashboard.title": "Dashboard",
    "dashboard.welcome": "Willkommen zurück",
    "chat.placeholder": "Fragen Sie nach Schülern oder Risiken...",
    "chat.processing": "Daten werden verarbeitet...",
    "lang.en": "Englisch",
    "lang.ar": "Arabisch",
    "lang.fr": "Französisch",
    "lang.es": "Spanisch",
    "lang.de": "Deutsch"
  }
};

export const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key) => key,
  dir: 'ltr'
});

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');

  const t = (key: string) => {
    return translations[language][key] || translations['en'][key] || key;
  };

  const dir = language === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    document.documentElement.dir = dir;
    document.documentElement.lang = language;
  }, [dir, language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, dir }}>
      {children}
    </LanguageContext.Provider>
  );
};
