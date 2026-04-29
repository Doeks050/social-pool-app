const TEAM_COUNTRY_CODES: Record<string, string> = {
  afghanistan: "af",
  albanie: "al",
  albania: "al",
  algerije: "dz",
  algeria: "dz",
  andorra: "ad",
  angola: "ao",
  argentinie: "ar",
  argentina: "ar",
  armenie: "am",
  armenia: "am",
  australie: "au",
  australia: "au",
  oostenrijk: "at",
  austria: "at",

  bahrein: "bh",
  bahrain: "bh",
  belgie: "be",
  belgium: "be",
  bolivia: "bo",
  bosnie: "ba",
  "bosnie en herzegovina": "ba",
  "bosnia and herzegovina": "ba",
  brazilie: "br",
  brazil: "br",
  bulgarije: "bg",
  bulgaria: "bg",

  cambodja: "kh",
  cambodia: "kh",
  kameroen: "cm",
  cameroon: "cm",
  canada: "ca",
  chili: "cl",
  chile: "cl",
  china: "cn",
  colombia: "co",
  congo: "cg",
  "dr congo": "cd",
  "democratic republic of congo": "cd",
  "costa rica": "cr",
  curacao: "cw",
  kroatie: "hr",
  croatia: "hr",
  cuba: "cu",
  cyprus: "cy",

  denemarken: "dk",
  denmark: "dk",
  "dominicaanse republiek": "do",
  "dominican republic": "do",
  duitsland: "de",
  germany: "de",

  ecuador: "ec",
  egypte: "eg",
  egypt: "eg",
  engeland: "gb-eng",
  england: "gb-eng",
  estland: "ee",
  estonia: "ee",

  faroer: "fo",
  "faroe islands": "fo",
  finland: "fi",
  frankrijk: "fr",
  france: "fr",

  gabon: "ga",
  gambia: "gm",
  georgie: "ge",
  georgia: "ge",
  ghana: "gh",
  griekenland: "gr",
  greece: "gr",
  guatemala: "gt",
  guinea: "gn",

  haiti: "ht",
  honduras: "hn",
  hongarije: "hu",
  hungary: "hu",

  ijsland: "is",
  iceland: "is",
  india: "in",
  indonesie: "id",
  indonesia: "id",
  iran: "ir",
  irak: "iq",
  iraq: "iq",
  ierland: "ie",
  ireland: "ie",
  israel: "il",
  italie: "it",
  italy: "it",
  ivoorkust: "ci",
  "cote divoire": "ci",
  "cote d ivoire": "ci",
  "cote d'ivoire": "ci",
  "ivory coast": "ci",

  jamaica: "jm",
  japan: "jp",
  jordanie: "jo",
  jordan: "jo",

  kaapverdie: "cv",
  "cape verde": "cv",
  kazachstan: "kz",
  kazakhstan: "kz",
  kenia: "ke",
  kenya: "ke",
  kosovo: "xk",

  letland: "lv",
  latvia: "lv",
  libanon: "lb",
  lebanon: "lb",
  libie: "ly",
  libya: "ly",
  litouwen: "lt",
  lithuania: "lt",
  luxemburg: "lu",
  luxembourg: "lu",

  macedonie: "mk",
  "noord macedonie": "mk",
  "north macedonia": "mk",
  maleisie: "my",
  malaysia: "my",
  mali: "ml",
  malta: "mt",
  marokko: "ma",
  morocco: "ma",
  mexico: "mx",
  moldavie: "md",
  moldova: "md",
  montenegro: "me",

  nederland: "nl",
  netherlands: "nl",
  "the netherlands": "nl",
  "nieuw zeeland": "nz",
  "nieuw-zeeland": "nz",
  "new zealand": "nz",
  nigeria: "ng",
  "noord ierland": "gb-nir",
  "noord-ierland": "gb-nir",
  "northern ireland": "gb-nir",
  noorwegen: "no",
  norway: "no",

  oekraine: "ua",
  ukraine: "ua",
  oman: "om",

  pakistan: "pk",
  panama: "pa",
  paraguay: "py",
  peru: "pe",
  polen: "pl",
  poland: "pl",
  portugal: "pt",

  qatar: "qa",

  roemenie: "ro",
  romania: "ro",
  rusland: "ru",
  russia: "ru",

  "saoedi arabie": "sa",
  "saoedi-arabie": "sa",
  "saudi arabie": "sa",
  "saudi-arabie": "sa",
  "saudi arabia": "sa",
  schotland: "gb-sct",
  scotland: "gb-sct",
  senegal: "sn",
  servie: "rs",
  serbia: "rs",
  slowakije: "sk",
  slovakia: "sk",
  slovenie: "si",
  slovenia: "si",
  spanje: "es",
  spain: "es",
  sudan: "sd",
  suriname: "sr",
  syrie: "sy",
  syria: "sy",
  zweden: "se",
  sweden: "se",
  zwitserland: "ch",
  switzerland: "ch",

  tajikistan: "tj",
  thailand: "th",
  togo: "tg",
  trinidad: "tt",
  "trinidad en tobago": "tt",
  "trinidad and tobago": "tt",
  tsjechie: "cz",
  "czech republic": "cz",
  czechia: "cz",
  tunesie: "tn",
  tunisia: "tn",
  turkije: "tr",
  turkey: "tr",

  uruguay: "uy",
  usa: "us",
  amerika: "us",
  "verenigde staten": "us",
  "verenigde staten van amerika": "us",
  "united states": "us",
  "united states of america": "us",

  venezuela: "ve",
  vietnam: "vn",

  wales: "gb-wls",

  "zuid afrika": "za",
  "zuid-afrika": "za",
  "south africa": "za",
  "zuid korea": "kr",
  "zuid-korea": "kr",
  "south korea": "kr",
  korea: "kr",
};

function normalizeTeamName(teamName: string) {
  return teamName
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’']/g, "")
    .replace(/[().,]/g, "")
    .replace(/\s+/g, " ");
}

function isPlaceholderTeam(normalizedTeamName: string) {
  return (
    !normalizedTeamName ||
    normalizedTeamName === "tbd" ||
    normalizedTeamName.includes("winner") ||
    normalizedTeamName.includes("runner") ||
    normalizedTeamName.includes("group") ||
    normalizedTeamName.includes("third") ||
    normalizedTeamName.includes("beste nummer") ||
    normalizedTeamName.includes("winnaar") ||
    normalizedTeamName.includes("verliezer")
  );
}

export function getTeamCountryCode(teamName: string | null | undefined) {
  if (!teamName) return null;

  const normalized = normalizeTeamName(teamName);

  if (isPlaceholderTeam(normalized)) {
    return null;
  }

  return TEAM_COUNTRY_CODES[normalized] ?? null;
}

export function getTeamFlagSrc(teamName: string | null | undefined) {
  const code = getTeamCountryCode(teamName);

  if (!code) {
    return null;
  }

  return `https://flagcdn.com/w80/${code}.png`;
}

export function getTeamFlagAlt(teamName: string | null | undefined) {
  if (!teamName) return "Team flag";
  return `${teamName} flag`;
}