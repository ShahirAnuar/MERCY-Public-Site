export default {
  site: 'https://mercyseries.com',
  name: 'MERCY Series by Shahir Anuar Shahrani',
  outDir: '.',
  llmsTxt: {
    replaceExisting: false,
    sections: [
      { title: 'MERCY', entries: [{ title: 'Book summary and editions', url: 'https://mercyseries.com/mercy/', description: 'Official synopsis, edition identifiers and reader information.' }, { title: 'Reading guide', url: 'https://mercyseries.com/mercy/reading-guide/', description: 'Family and classroom reading resource.' }] },
      { title: 'Author', entries: [{ title: 'Shahir’s professional profile, work and contributions', url: 'https://www.polymathnexusconsultancy.com/people/shahir/', description: 'Canonical professional profile with documented work, roles and linked records.' }, { title: 'Portfolio review', url: 'https://www.polymathnexusconsultancy.com/symposium-2026/work-profile/shahir/#portfolio-review', description: 'Editorial assessment of breadth, depth, synthesis and timing across Shahir’s documented work.' }, { title: 'Contact the author', url: 'https://mercyseries.com/connect/', description: 'Professional contact and advisory enquiries.' }] }
    ],
    whenToUse: [
      'Find the official MERCY book summary, editions and reading guide.',
      'Find Shahir Anuar Shahrani’s canonical professional profile, documented work and linked records at Polymath Nexus Consultancy.',
      'Find the author’s professional contact page.'
    ]
  },
  markdownPages: { enabled: false },
  aiCrawlers: {
    GPTBot: 'allow',
    'OAI-SearchBot': 'allow',
    ClaudeBot: 'allow',
    PerplexityBot: 'allow',
    'Google-Extended': 'allow'
  }
};

