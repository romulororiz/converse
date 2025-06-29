// Map ISO 639-1 language codes to country flag emojis (best guess)
// Note: Some languages are spoken in multiple countries; this is a best-effort mapping.
const languageToFlag: Record<string, string> = {
	en: '🇬🇧', // English (UK)
	es: '🇪🇸', // Spanish (Spain)
	fr: '🇫🇷', // French (France)
	de: '🇩🇪', // German
	it: '🇮🇹', // Italian
	pt: '🇵🇹', // Portuguese (Portugal)
	ru: '🇷🇺', // Russian
	ja: '🇯🇵', // Japanese
	zh: '🇨🇳', // Chinese (China)
	ko: '🇰🇷', // Korean
	ar: '🇸🇦', // Arabic (Saudi Arabia)
	hi: '🇮🇳', // Hindi
	nl: '🇳🇱', // Dutch
	sv: '🇸🇪', // Swedish
	no: '🇳🇴', // Norwegian
	da: '🇩🇰', // Danish
	fi: '🇫🇮', // Finnish
	pl: '🇵🇱', // Polish
	tr: '🇹🇷', // Turkish
	he: '🇮🇱', // Hebrew
	th: '🇹🇭', // Thai
	vi: '🇻🇳', // Vietnamese
	id: '🇮🇩', // Indonesian
	ms: '🇲🇾', // Malay
	fa: '🇮🇷', // Persian (Iran)
	ur: '🇵🇰', // Urdu (Pakistan)
	bn: '🇧🇩', // Bengali (Bangladesh)
	ta: '🇮🇳', // Tamil (India)
	te: '🇮🇳', // Telugu (India)
	mr: '🇮🇳', // Marathi (India)
	gu: '🇮🇳', // Gujarati (India)
	kn: '🇮🇳', // Kannada (India)
	ml: '🇮🇳', // Malayalam (India)
	pa: '🇮🇳', // Punjabi (India)
	or: '🇮🇳', // Odia (India)
	as: '🇮🇳', // Assamese (India)
	ne: '🇳🇵', // Nepali
	si: '🇱🇰', // Sinhala (Sri Lanka)
	my: '🇲🇲', // Burmese (Myanmar)
	km: '🇰🇭', // Khmer (Cambodia)
	lo: '🇱🇦', // Lao
	mn: '🇲🇳', // Mongolian
	ka: '🇬🇪', // Georgian
	am: '🇪🇹', // Amharic (Ethiopia)
	sw: '🇰🇪', // Swahili (Kenya)
	zu: '🇿🇦', // Zulu (South Africa)
	af: '🇿🇦', // Afrikaans (South Africa)
	xh: '🇿🇦', // Xhosa (South Africa)
	yo: '🇳🇬', // Yoruba (Nigeria)
	ig: '🇳🇬', // Igbo (Nigeria)
	ha: '🇳🇬', // Hausa (Nigeria)
	so: '🇸🇴', // Somali (Somalia)
	rw: '🇷🇼', // Kinyarwanda (Rwanda)
	lg: '🇺🇬', // Luganda (Uganda)
	ak: '🇬🇭', // Akan (Ghana)
	tw: '🇬🇭', // Twi (Ghana)
	ee: '🇬🇭', // Ewe (Ghana)
	wo: '🇸🇳', // Wolof (Senegal)
	bm: '🇲🇱', // Bambara (Mali)
	sn: '🇿🇼', // Shona (Zimbabwe)
	ny: '🇲🇼', // Chichewa (Malawi)
	st: '🇱🇸', // Southern Sotho (Lesotho)
	tn: '🇧🇼', // Tswana (Botswana)
	ts: '🇿🇦', // Tsonga (South Africa)
	ve: '🇿🇦', // Venda (South Africa)
	ss: '🇸🇿', // Swati (Eswatini)
	nr: '🇿🇦', // Southern Ndebele (South Africa)
	nd: '🇿🇼', // Northern Ndebele (Zimbabwe)
	kg: '🇨🇬', // Kongo (Congo)
	ln: '🇨🇩', // Lingala (DR Congo)
	lu: '🇨🇩', // Luba-Katanga (DR Congo)
};

export function getFlagForLanguage(lang: string | null | undefined): string {
	if (!lang) return '🏳️';
	// Some APIs return 3-letter codes or region codes (e.g., en-US)
	const code = lang.slice(0, 2).toLowerCase();
	return languageToFlag[code] || '🏳️';
}

export function getFlagsForLanguages(
	langs: string | string[] | null | undefined
): string[] {
	if (!langs) return [];
	if (Array.isArray(langs)) {
		return langs.map(getFlagForLanguage);
	}
	// Split comma/space separated
	if (typeof langs === 'string' && langs.includes(',')) {
		return langs.split(',').map(l => getFlagForLanguage(l.trim()));
	}
	return [getFlagForLanguage(langs)];
}
