/**
 * Internationalization (i18n) support for Vantage AI
 */

export type Locale = "en" | "es" | "fr" | "de" | "ja" | "zh" | "pt" | "ar";

export interface Translation {
  [key: string]: string | Translation;
}

export interface I18nConfig {
  defaultLocale: Locale;
  fallbackLocale?: Locale;
  translations: Record<Locale, Translation>;
}

export class I18n {
  private currentLocale: Locale;
  private fallbackLocale: Locale;
  private translations: Record<Locale, Translation>;

  constructor(config: I18nConfig) {
    this.currentLocale = config.defaultLocale;
    this.fallbackLocale = config.fallbackLocale || "en";
    this.translations = config.translations;
  }

  setLocale(locale: Locale): void {
    if (!this.translations[locale]) {
      console.warn(`Locale ${locale} not found, using ${this.currentLocale}`);
      return;
    }
    this.currentLocale = locale;
  }

  getLocale(): Locale {
    return this.currentLocale;
  }

  t(key: string, params?: Record<string, string>): string {
    let translation = this.getTranslation(key, this.currentLocale);

    // Fallback to fallback locale
    if (!translation) {
      translation = this.getTranslation(key, this.fallbackLocale);
    }

    // Final fallback to key
    if (!translation) {
      console.warn(`Translation not found: ${key}`);
      return key;
    }

    // Replace parameters
    if (params) {
      Object.entries(params).forEach(([param, value]) => {
        translation = translation!.replace(new RegExp(`\\{${param}\\}`, "g"), value);
      });
    }

    return translation;
  }

  private getTranslation(key: string, locale: Locale): string | null {
    const keys = key.split(".");
    let current: any = this.translations[locale];

    for (const k of keys) {
      if (current && typeof current === "object" && k in current) {
        current = current[k];
      } else {
        return null;
      }
    }

    return typeof current === "string" ? current : null;
  }

  addTranslations(locale: Locale, translations: Translation): void {
    this.translations[locale] = {
      ...this.translations[locale],
      ...translations
    };
  }
}

// Default translations
export const defaultTranslations: Record<Locale, Translation> = {
  en: {
    widgets: {
      banner: {
        dismiss: "Dismiss",
        learnMore: "Learn more"
      },
      tooltip: {
        close: "Close"
      },
      checklist: {
        completed: "completed",
        of: "of"
      },
      modal: {
        close: "Close"
      },
      tour: {
        next: "Next",
        previous: "Previous",
        skip: "Skip tour",
        finish: "Finish",
        of: "of"
      }
    },
    errors: {
      generic: "Something went wrong",
      network: "Network error occurred",
      validation: "Please check your input"
    }
  },
  es: {
    widgets: {
      banner: {
        dismiss: "Descartar",
        learnMore: "Aprende más"
      },
      tooltip: {
        close: "Cerrar"
      },
      checklist: {
        completed: "completado",
        of: "de"
      }
    }
  },
  fr: {
    widgets: {
      banner: {
        dismiss: "Rejeter",
        learnMore: "En savoir plus"
      }
    }
  },
  de: {
    widgets: {
      banner: {
        dismiss: "Verwerfen",
        learnMore: "Mehr erfahren"
      }
    }
  },
  ja: {
    widgets: {
      banner: {
        dismiss: "閉じる",
        learnMore: "詳細を見る"
      }
    }
  },
  zh: {
    widgets: {
      banner: {
        dismiss: "关闭",
        learnMore: "了解更多"
      }
    }
  },
  pt: {
    widgets: {
      banner: {
        dismiss: "Dispensar",
        learnMore: "Saiba mais"
      }
    }
  },
  ar: {
    widgets: {
      banner: {
        dismiss: "رفض",
        learnMore: "يتعلم أكثر"
      }
    }
  }
};

export function createI18n(config?: Partial<I18nConfig>): I18n {
  return new I18n({
    defaultLocale: config?.defaultLocale || "en",
    fallbackLocale: config?.fallbackLocale || "en",
    translations: {
      ...defaultTranslations,
      ...config?.translations
    }
  });
}
