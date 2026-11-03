import s from "./blog.module.css";

// Indian languages first, then widely read ones. `code` is Google Translate's.
const LANGUAGES = [
  { code: "hi", name: "हिन्दी", english: "Hindi" },
  { code: "bn", name: "বাংলা", english: "Bengali" },
  { code: "mr", name: "मराठी", english: "Marathi" },
  { code: "te", name: "తెలుగు", english: "Telugu" },
  { code: "ta", name: "தமிழ்", english: "Tamil" },
  { code: "gu", name: "ગુજરાતી", english: "Gujarati" },
  { code: "kn", name: "ಕನ್ನಡ", english: "Kannada" },
  { code: "ml", name: "മലയാളം", english: "Malayalam" },
  { code: "pa", name: "ਪੰਜਾਬੀ", english: "Punjabi" },
  { code: "or", name: "ଓଡ଼ିଆ", english: "Odia" },
  { code: "ne", name: "नेपाली", english: "Nepali" },
  { code: "ur", name: "اردو", english: "Urdu" },
  { code: "es", name: "Español", english: "Spanish" },
  { code: "fr", name: "Français", english: "French" },
  { code: "de", name: "Deutsch", english: "German" },
  { code: "pt", name: "Português", english: "Portuguese" },
  { code: "ru", name: "Русский", english: "Russian" },
  { code: "ar", name: "العربية", english: "Arabic" },
  { code: "zh-CN", name: "中文", english: "Chinese" },
  { code: "ja", name: "日本語", english: "Japanese" },
];

function TranslateIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 5h9M8.5 3v2M6 5c.6 3.4 2.9 6.2 6 7.6M11 5c-.8 3.6-3.4 6.6-7 8" />
      <path d="m12.5 21 4-9 4 9M14 17.5h5" />
    </svg>
  );
}

/**
 * Opens this page in Google Translate, in a new tab. Plain links, so it needs
 * no script and sets no cookies here. It only works for the live site, which
 * Google can reach.
 */
export function TranslateMenu({ url }: { url: string }) {
  return (
    <details className={`${s.follow} ${s.translate}`}>
      <summary className="btn btnGhost">
        <TranslateIcon />
        Translate
      </summary>
      <div className={s.followPanel}>
        <p>
          Read this page in another language. It opens in Google Translate, in a new tab. Press <strong>Listen</strong> there to hear it in that language.
        </p>
        <ul className={s.languages}>
          {LANGUAGES.map((language) => (
            <li key={language.code}>
              <a
                href={`https://translate.google.com/translate?sl=en&tl=${language.code}&hl=${language.code}&u=${encodeURIComponent(url)}`}
                target="_blank"
                rel="noopener noreferrer"
                lang={language.code}
              >
                {language.name}
                <span lang="en">{language.english}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </details>
  );
}
