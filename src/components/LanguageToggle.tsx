import { useLanguage } from "../i18n/LanguageContext"

interface LanguageToggleProps {
  variant?: "light" | "dark"
}

export default function LanguageToggle({ variant = "light" }: LanguageToggleProps) {
  const { lang, setLang } = useLanguage()

  const base = "flex items-center rounded-full p-0.5 text-xs font-bold"
  const shell =
    variant === "dark"
      ? `${base} bg-white/10 border border-white/15`
      : `${base} bg-gray-100 border border-gray-200`

  const activeCls = variant === "dark" ? "bg-brand text-white" : "bg-brand text-white"
  const inactiveCls = variant === "dark" ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-navy"

  return (
    <div className={shell} role="group" aria-label="Language switcher">
      <button
        onClick={() => setLang("en")}
        className={`px-2.5 py-1 rounded-full transition-colors ${lang === "en" ? activeCls : inactiveCls}`}
      >
        EN
      </button>
      <button
        onClick={() => setLang("hi")}
        className={`px-2.5 py-1 rounded-full transition-colors ${lang === "hi" ? activeCls : inactiveCls}`}
      >
        हि
      </button>
    </div>
  )
}
