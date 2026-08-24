export type AppLocale = "ko" | "en";

/** 이 프로젝트의 기본 언어. 지원하지 않는 로케일은 이 값으로 폴백한다. */
export const DEFAULT_LOCALE: AppLocale = "ko";

/** Discord가 주는 BCP-47 로케일 문자열(예: "ko", "en-US", "en-GB")을 지원 로케일로 매핑한다. */
export function resolveLocale(discordLocale?: string | null): AppLocale {
  if (!discordLocale) return DEFAULT_LOCALE;
  return discordLocale.toLowerCase().startsWith("en") ? "en" : DEFAULT_LOCALE;
}
