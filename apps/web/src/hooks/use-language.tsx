"use client"

import type React from "react"

import { createContext, useContext, useState } from "react"
import { type Language, translations } from "@/lib/i18n"

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string, fallback?: string) => string
  /**
   * Retrieve typed translations, including nested objects.
   * Falls back to the provided value or the key when missing.
   */
  get: <T = unknown>(key: string, fallback?: T) => T
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>("ja")

  const t = (key: string, fallback?: string): string => {
    const keys = key.split(".")
    let value: any = translations[language]

    for (const k of keys) {
      value = value?.[k]
    }

    return typeof value === "string" ? value : fallback || key
  }

  const get = <T = unknown>(key: string, fallback?: T): T => {
    const keys = key.split(".")
    let value: any = translations[language]

    for (const k of keys) {
      value = value?.[k]
    }

    if (value === undefined) {
      return (fallback ?? (key as unknown as T)) as T
    }

    return value as T
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, get }}>{children}</LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider")
  }
  return context
}
