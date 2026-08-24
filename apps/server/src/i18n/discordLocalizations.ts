import { Locale } from "discord.js";

/** 슬래시 커맨드 이름/설명에 영어 로케일라이제이션을 붙일 때 쓰는 헬퍼. */
export function enLocalization(text: string): Partial<Record<Locale, string>> {
  return { [Locale.EnglishUS]: text, [Locale.EnglishGB]: text };
}
