import type { Lang } from "../i18n/translations"

export interface Company {
  id: string
  name: string
  initials: string
  color: string // tailwind bg class
  role: { en: string; hi: string }
  location: { en: string; hi: string }
  description: { en: string; hi: string }
  openings: number
}

export const companies: Company[] = [
  {
    id: "techcorp",
    name: "TechCorp",
    initials: "TC",
    color: "bg-brand",
    role: { en: "Senior Product Designer", hi: "सीनियर प्रोडक्ट डिज़ाइनर" },
    location: { en: "Remote · US", hi: "रिमोट · अमेरिका" },
    description: { en: "Consumer software for small teams.", hi: "छोटी टीमों के लिए उपभोक्ता सॉफ्टवेयर।" },
    openings: 3,
  },
  {
    id: "nimbus-health",
    name: "Nimbus Health",
    initials: "NH",
    color: "bg-amethyst",
    role: { en: "Frontend Engineer", hi: "फ्रंटएंड इंजीनियर" },
    location: { en: "Hybrid · Boston", hi: "हाइब्रिड · बोस्टन" },
    description: { en: "Digital health records platform.", hi: "डिजिटल स्वास्थ्य रिकॉर्ड प्लेटफॉर्म।" },
    openings: 5,
  },
  {
    id: "bluepeak",
    name: "BluePeak Finance",
    initials: "BP",
    color: "bg-ember",
    role: { en: "Data Analyst", hi: "डेटा एनालिस्ट" },
    location: { en: "Onsite · NYC", hi: "ऑनसाइट · न्यूयॉर्क" },
    description: { en: "Risk analytics for retail banking.", hi: "रिटेल बैंकिंग के लिए जोखिम विश्लेषण।" },
    openings: 2,
  },
  {
    id: "solstice-robotics",
    name: "Solstice Robotics",
    initials: "SR",
    color: "bg-blue-500",
    role: { en: "Backend Engineer", hi: "बैकएंड इंजीनियर" },
    location: { en: "Onsite · Austin", hi: "ऑनसाइट · ऑस्टिन" },
    description: { en: "Autonomous warehouse robotics.", hi: "स्वायत्त गोदाम रोबोटिक्स।" },
    openings: 4,
  },
  {
    id: "meridian-retail",
    name: "Meridian Retail",
    initials: "MR",
    color: "bg-pink-500",
    role: { en: "Operations Associate", hi: "ऑपरेशंस एसोसिएट" },
    location: { en: "Remote · Global", hi: "रिमोट · वैश्विक" },
    description: { en: "Omnichannel retail operations.", hi: "ओमनीचैनल रिटेल संचालन।" },
    openings: 6,
  },
  {
    id: "aurora-labs",
    name: "Aurora Labs",
    initials: "AL",
    color: "bg-indigo-500",
    role: { en: "Machine Learning Engineer", hi: "मशीन लर्निंग इंजीनियर" },
    location: { en: "Remote · US", hi: "रिमोट · अमेरिका" },
    description: { en: "Applied AI research studio.", hi: "एप्लाइड एआई रिसर्च स्टूडियो।" },
    openings: 2,
  },
]

export function companyName(c: Company | undefined, lang: Lang): string {
  if (!c) return ""
  return c.name
}

export function companyRole(c: Company | undefined, lang: Lang): string {
  if (!c) return ""
  return c.role[lang]
}

export function findCompany(id: string | null): Company | undefined {
  return companies.find(c => c.id === id)
}
