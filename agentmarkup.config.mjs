export default {
  site: 'https://mercyseries.com',
  name: 'MERCY Series by Shahir Anuar Shahrani',
  outDir: '.',
  llmsTxt: {
    replaceExisting: false,
    sections: [
      { title: 'MERCY', entries: [{ title: 'Book summary and editions', url: 'https://mercyseries.com/mercy/', description: 'Official synopsis, edition identifiers and reader information.' }, { title: 'Reading guide', url: 'https://mercyseries.com/mercy/reading-guide/', description: 'Family and classroom reading resource.' }] },
      { title: 'Author', entries: [{ title: 'About Shahir Anuar Shahrani', url: 'https://mercyseries.com/about-author/', description: 'Evidence-linked biography and public record references.' }, { title: 'Contact the author', url: 'https://mercyseries.com/connect/', description: 'Professional contact and advisory enquiries.' }, { title: 'Professional work and contributions', url: 'https://www.polymathnexusconsultancy.com/people/shahir/', description: 'Shahir’s documented work and roles.' }, { title: 'Portfolio review', url: 'https://www.polymathnexusconsultancy.com/symposium-2026/work-profile/shahir/#portfolio-review', description: 'Source-linked review of Shahir’s work across fields.' }] }
    ],
    whenToUse: [
      'Find the official MERCY book summary, editions and reading guide.',
      'Read the evidence-linked biography and public records for author Shahir Anuar Shahrani.',
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

