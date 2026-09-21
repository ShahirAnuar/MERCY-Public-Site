export function filterItems(items, query = '') {
  const needle = String(query).trim().toLowerCase();
  if (!needle) return items;
  return items.filter((item) => {
    const haystack = [item.name, item.title, item.category, item.area, item.role, item.summary, item.shortDescription, ...(item.tags || [])]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return haystack.includes(needle);
  });
}

export function safeQuestionResponse(question) {
  const forbidden = /diagnos|prescrib|change your dose|stop taking|start taking/i;
  const body = String(question.responseBody || '').replace(forbidden, 'speak with a pharmacist');
  const nextStep = String(question.nextStep || 'Speak with a pharmacist or healthcare professional.').replace(forbidden, 'Speak with a pharmacist or healthcare professional');
  return {
    title: question.responseTitle || 'A pharmacist can help',
    body,
    nextStep,
    nextHref: question.nextHref || 'pages/services.html',
    tone: question.tone || 'cyan'
  };
}

export function requiredDataKeys(kind) {
  return {
    site: ['brand', 'event', 'navigation', 'safety'],
    services: ['services'],
    tour: ['stops'],
    filler: ['items'],
    questions: ['questions']
  }[kind] || [];
}

export function translate(values, language = 'en') {
  return values?.[language] ?? values?.en ?? '';
}
