/**
 * Locale Loader - 自动加载并注册所有语言包
 */

import { registerTranslations, Locale } from './index';

// 导入所有语言包
import zhCN from './locales/zh-CN';
import enUS from './locales/en-US';
import jaJP from './locales/ja-JP';
import koKR from './locales/ko-KR';
import deDE from './locales/de-DE';
import frFR from './locales/fr-FR';
import esES from './locales/es-ES';
import ruRU from './locales/ru-RU';
import ptBR from './locales/pt-BR';
import itIT from './locales/it-IT';

// 语言包映射
const localeMap: Record<Locale, typeof zhCN> = {
  'zh-CN': zhCN,
  'en-US': enUS,
  'ja-JP': jaJP,
  'ko-KR': koKR,
  'de-DE': deDE,
  'fr-FR': frFR,
  'es-ES': esES,
  'ru-RU': ruRU,
  'pt-BR': ptBR,
  'it-IT': itIT,
};

// 自动检测浏览器语言
export function detectBrowserLocale(): Locale {
  if (typeof navigator === 'undefined') {
    return 'en-US';
  }
  
  const lang = navigator.language || (navigator as any).userLanguage || 'en-US';
  
  // 精确匹配
  if (lang in localeMap) {
    return lang as Locale;
  }
  
  // 模糊匹配（如 'zh' -> 'zh-CN', 'en' -> 'en-US'）
  const langPrefix = lang.split('-')[0];
  const matched = Object.keys(localeMap).find(key => 
    key.toLowerCase().startsWith(langPrefix.toLowerCase())
  );
  
  return (matched as Locale) || 'en-US';
}

// 初始化所有语言包
export function initLocales(): void {
  Object.entries(localeMap).forEach(([locale, translations]) => {
    registerTranslations(locale as Locale, translations as Record<string, string>);
  });
}

// 获取支持的语言列表
export function getSupportedLocales(): Array<{ code: Locale; name: string; nativeName: string }> {
  return [
    { code: 'zh-CN', name: 'Chinese (Simplified)', nativeName: '简体中文' },
    { code: 'en-US', name: 'English', nativeName: 'English' },
    { code: 'ja-JP', name: 'Japanese', nativeName: '日本語' },
    { code: 'ko-KR', name: 'Korean', nativeName: '한국어' },
    { code: 'de-DE', name: 'German', nativeName: 'Deutsch' },
    { code: 'fr-FR', name: 'French', nativeName: 'Français' },
    { code: 'es-ES', name: 'Spanish', nativeName: 'Español' },
    { code: 'ru-RU', name: 'Russian', nativeName: 'Русский' },
    { code: 'pt-BR', name: 'Portuguese (Brazil)', nativeName: 'Português' },
    { code: 'it-IT', name: 'Italian', nativeName: 'Italiano' },
  ];
}

// 自动初始化
initLocales();
