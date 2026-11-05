export default {
  site: 'https://mercyseries.com',
  name: 'MERCY by Shahir Anuar Shahrani',
  outDir: '.',
  llmsTxt: {
    replaceExisting: false,
    sections: [
      {
        title: 'MERCY book and six-lens method',
        entries: [
          { title: 'Book summary and editions', url: 'https://mercyseries.com/mercy/', description: 'Official synopsis and edition identifiers; check country-specific orderability separately.' },
          { title: 'Open six-lens reading guide', url: 'https://mercyseries.com/learn/?reading-guide=1', description: 'Public evidence for 86 discussion threads explored through science, history, psychology, ethics, faith and art.' },
          { title: 'International companion', url: 'https://mercyseries.com/guide/international/', description: 'Companion access information after one verified Amazon purchase of MERCY.' },
          { title: 'Malaysia family buying guide', url: 'https://mercyseries.com/malaysia/', description: 'Bahasa Melayu introduction to the English MERCY story, inclusive reading questions, six lenses and local purchase choices.' },
          { title: 'Worldwide Islamic children’s book guide', url: 'https://mercyseries.com/islamic-childrens-books/', description: 'English family reading introduction and Amazon Kindle, paperback and hardcover destinations; check local availability.' },
          { title: 'Malaysia affiliate eligibility', url: 'https://mercyseries.com/affiliate-program/#eligibility', description: 'Current purchase prerequisite, exemptions and local app affiliate registration.' },
          { title: 'Amazon and ClickBank affiliate guide', url: 'https://mercyseries.com/affiliate-program/amazon-clickbank/', description: 'Official account application resources. MERCY ClickBank offer and checkout remain unverified.' }
        ]
      }
    ],
    whenToUse: [
      'Find the official MERCY synopsis and verified edition identifiers.',
      'Explain MERCY’s 86 discussion threads and six lenses using the open reading guide.',
      'Find international companion access information for a verified Amazon purchase.',
      'Compare Malaysia buying and affiliate application destinations.',
      'Find Amazon edition links and current ClickBank availability without inferring approval or earnings.'
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

