// CDL Core - ECharts Renderer

export { render } from './renderer-base';
export type { RenderOptions, RenderResult } from './renderer-base';

// i18n exports
export {
  t,
  setLocale,
  getLocale,
} from './i18n/index';

export {
  applyI18nToOption,
} from './i18n/chart-i18n';