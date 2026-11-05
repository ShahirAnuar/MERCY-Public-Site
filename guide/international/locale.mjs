// ISO 3166-1 regions plus XK, which is also recognised by CLDR.
function internationalRegions() {
  return 'AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS XK YE YT ZA ZM ZW'.split(' ');
}

function normaliseInternationalCountry(value) {
  if (typeof value !== 'string') return null;
  const code = value.trim().toUpperCase();
  if (code === 'GLOBAL') return 'global';
  return internationalRegions().includes(code) ? code : null;
}

export function internationalLocaleModel(country, availableLanguages = ['en', 'ar', 'ms']) {
  const selected = normaliseInternationalCountry(country) || 'global';
  // Only map editions with existing content. Arabic and Malay territory
  // coverage follows CLDR's Language–Territory Information.
  const regionsByLanguage = {
    ar: 'AE BH DJ DZ EG EH ER IL IQ JO KM KW LB LY MA MR OM PS QA SA SD SO SY TD TN YE'.split(' '),
    ms: ['BN', 'MY', 'SG']
  };
  const names = { en: 'English', ar: 'العربية', ms: 'Bahasa Melayu' };
  const localLanguages = Object.keys(regionsByLanguage).filter(
    language => availableLanguages.includes(language) && regionsByLanguage[language].includes(selected)
  );
  // Keep one international app with two choices. Regions with an existing
  // Malay translation use it; elsewhere the international second language is
  // Arabic. Never advertise a translation the content service does not have.
  const secondaryLanguage = localLanguages[0] || (availableLanguages.includes('ar') ? 'ar' : null);
  const languages = ['en', ...(secondaryLanguage ? [secondaryLanguage] : [])];
  return {
    country: selected,
    secondaryLanguage,
    languages,
    labels: Object.fromEntries(languages.map(language => [language, names[language]]))
  };
}

export function preferredInternationalLanguage(search, stored, languages, browserLanguages = []) {
  const requested = new URLSearchParams(search).get('lang');
  if (languages.includes(requested)) return requested;
  if (languages.includes(stored)) return stored;
  for (const tag of browserLanguages) {
    try {
      const language = new Intl.Locale(tag).language;
      if (languages.includes(language)) return language;
    } catch {}
  }
  return 'en';
}

export function internationalEditionCountry(search, stored) {
  const params=new URLSearchParams(search),edition=params.get('edition')||params.get('vip');
  if(edition==='ypkdt')return 'MY';
  if(edition==='parentingu')return 'GB';
  return ['MY','GB'].includes(stored)?stored:null;
}

export function internationalLocaleOptions(country) {
  const { country: selected } = internationalLocaleModel(country);
  const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
  const countries = internationalRegions()
    .map(code => [code, regionNames.of(code)])
    .sort((a, b) => a[1].localeCompare(b[1], 'en'));
  const choices = [['global', 'Global / other'], ...countries];
  return choices.map(([code, name]) => {
    const label = name.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
    return '<option value="' + code + '"' + (code === selected ? ' selected' : '') + '>' + label + '</option>';
  }).join('');
}

export function initialiseInternationalCountry(
  select = document.getElementById('international-country'),
  { storageKey = 'mercyInternationalCountry', availableLanguages, countryOverride, onChange } = {}
) {
  const url = new URL(location.href);
  const supplied = normaliseInternationalCountry(url.searchParams.get('country'));
  let stored;
  try {
    stored = normaliseInternationalCountry(localStorage.getItem(storageKey));
  } catch {}

  let inferred;
  if (!supplied && !stored) {
    for (const tag of navigator.languages || [navigator.language]) {
      try {
        inferred = normaliseInternationalCountry(new Intl.Locale(tag).region);
        if (inferred) break;
      } catch {}
    }
  }

  let model = internationalLocaleModel(normaliseInternationalCountry(countryOverride) || supplied || stored || inferred, availableLanguages);

  function remember(country) {
    try { localStorage.setItem(storageKey, country); } catch {}
  }

  if (supplied) remember(supplied);
  if (select) {
    select.innerHTML = internationalLocaleOptions(model.country);
    select.value = model.country;
    select.addEventListener('change', () => {
      const selected = normaliseInternationalCountry(select.value);
      if (!selected || selected === model.country) return;
      model = internationalLocaleModel(selected, availableLanguages);
      remember(model.country);
      const next = new URL(location.href);
      next.searchParams.set('country', model.country);
      history.replaceState(history.state, '', next);
      onChange?.(model);
    });
  }

  onChange?.(model);
  return model;
}
