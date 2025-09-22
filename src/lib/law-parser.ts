export interface LawArticle {
  article: number;
  title: string;
  chapter: string;
  part: string;
  text: string;
  tags: string[];
  subsections?: LawSubsection[];
  lawSource?: string;
}

export interface LawSubsection {
  number: string;
  text: string;
  subsubsections?: LawSubsubsection[];
}

export interface LawSubsubsection {
  letter: string;
  text: string;
}

export interface LawChapter {
  title: string;
  part: string;
  articles: LawArticle[];
}

export interface LawPart {
  title: string;
  chapters: LawChapter[];
}

export class LawParser {
  private content: string;
  private lawSource: string;

  constructor(content: string, lawSource: string = 'Laws of South Sudan') {
    this.content = content;
    this.lawSource = lawSource;
  }

  parse(): LawArticle[] {
    const articles: LawArticle[] = [];
    const lines = this.content.split('\n');
    
    let currentPart = '';
    let currentChapter = '';
    let currentArticle: Partial<LawArticle> | null = null;
    let currentSubsection: Partial<LawSubsection> | null = null;
    let currentSubsubsection: Partial<LawSubsubsection> | null = null;
    let articleText = '';
    let inArticle = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip empty lines and table separators
      if (!line || line === '|' || line.startsWith('|') || line === ':---:') {
        continue;
      }

      // Detect parts
      if (line.startsWith('**PART') && line.includes('**')) {
        currentPart = this.extractPartTitle(line);
        continue;
      }

      // Detect chapters
      if (line.startsWith('***CHAPTER') && line.includes('***')) {
        currentChapter = this.extractChapterTitle(line);
        continue;
      }

      // Detect articles
      const articleMatch = line.match(/^(\d+)\.\s*(.+)$/);
      if (articleMatch) {
        // Save previous article if exists
        if (currentArticle && articleText.trim()) {
          currentArticle.text = articleText.trim();
          currentArticle.tags = this.generateTags(currentArticle);
          articles.push(currentArticle as LawArticle);
        }

        // Start new article
        currentArticle = {
          article: parseInt(articleMatch[1]),
          title: articleMatch[2].trim(),
          chapter: currentChapter,
          part: currentPart,
          text: '',
          tags: [],
          subsections: [],
          lawSource: this.lawSource
        };
        articleText = '';
        inArticle = true;
        continue;
      }

      // Detect subsections (1), (2), etc.
      const subsectionMatch = line.match(/^\((\d+)\)\s*(.+)$/);
      if (subsectionMatch && currentArticle && inArticle) {
        // Save previous subsection if exists
        if (currentSubsection) {
          currentArticle.subsections!.push(currentSubsection as LawSubsection);
        }

        currentSubsection = {
          number: subsectionMatch[1],
          text: subsectionMatch[2].trim(),
          subsubsections: []
        };
        continue;
      }

      // Detect subsubsections (a), (b), etc.
      const subsubsectionMatch = line.match(/^\(([a-z])\)\s*(.+)$/);
      if (subsubsectionMatch && currentSubsection) {
        // Save previous subsubsection if exists
        if (currentSubsubsection) {
          currentSubsection.subsubsections!.push(currentSubsubsection as LawSubsubsection);
        }

        currentSubsubsection = {
          letter: subsubsectionMatch[1],
          text: subsubsectionMatch[2].trim()
        };
        continue;
      }

      // Regular text content
      if (inArticle && line) {
        if (currentSubsubsection) {
          currentSubsubsection.text += ' ' + line;
        } else if (currentSubsection) {
          currentSubsection.text += ' ' + line;
        } else {
          articleText += ' ' + line;
        }
      }
    }

    // Save the last article
    if (currentArticle && articleText.trim()) {
      currentArticle.text = articleText.trim();
      currentArticle.tags = this.generateTags(currentArticle);
      if (currentSubsection) {
        if (currentSubsubsection) {
          currentSubsection.subsubsections!.push(currentSubsubsection as LawSubsubsection);
        }
        currentArticle.subsections!.push(currentSubsection as LawSubsection);
      }
      articles.push(currentArticle as LawArticle);
    }

    return articles;
  }

  private extractPartTitle(line: string): string {
    return line.replace(/\*\*/g, '').replace(/PART\s+\w+\s*/, '').trim();
  }

  private extractChapterTitle(line: string): string {
    return line.replace(/\*/g, '').replace(/CHAPTER\s+\w+\s*/, '').trim();
  }

  private generateTags(article: Partial<LawArticle>): string[] {
    const tags = new Set<string>();
    
    // Add part-based tags
    if (article.part) {
      const partKeywords = this.extractKeywords(article.part);
      partKeywords.forEach(keyword => tags.add(keyword));
    }

    // Add chapter-based tags
    if (article.chapter) {
      const chapterKeywords = this.extractKeywords(article.chapter);
      chapterKeywords.forEach(keyword => tags.add(keyword));
    }

    // Add title-based tags
    if (article.title) {
      const titleKeywords = this.extractKeywords(article.title);
      titleKeywords.forEach(keyword => tags.add(keyword));
    }

    // Add content-based tags
    if (article.text) {
      const contentKeywords = this.extractKeywords(article.text);
      contentKeywords.forEach(keyword => tags.add(keyword));
    }

    // Add specific legal concept tags
    this.addLegalConceptTags(article, tags);

    return Array.from(tags);
  }

  private extractKeywords(text: string): string[] {
    const keywords: string[] = [];
    const lowerText = text.toLowerCase();

    // Common legal terms
    const legalTerms = [
      'constitution', 'law', 'rights', 'freedom', 'citizenship', 'government',
      'president', 'assembly', 'judiciary', 'executive', 'legislature',
      'justice', 'equality', 'education', 'health', 'property', 'privacy',
      'religion', 'expression', 'assembly', 'association', 'movement',
      'election', 'vote', 'democracy', 'security', 'defense', 'police',
      'court', 'trial', 'appeal', 'supreme', 'minister', 'governor',
      'state', 'local', 'federal', 'national', 'territory', 'boundary'
    ];

    legalTerms.forEach(term => {
      if (lowerText.includes(term)) {
        keywords.push(term);
      }
    });

    return keywords;
  }

  private addLegalConceptTags(article: Partial<LawArticle>, tags: Set<string>): void {
    const text = (article.text || '').toLowerCase();
    const title = (article.title || '').toLowerCase();

    // Bill of Rights
    if (text.includes('bill of rights') || text.includes('human rights') || text.includes('fundamental rights')) {
      tags.add('bill of rights');
      tags.add('human rights');
    }

    // Government structure
    if (text.includes('executive') || text.includes('president') || text.includes('minister')) {
      tags.add('executive');
    }
    if (text.includes('legislature') || text.includes('assembly') || text.includes('parliament')) {
      tags.add('legislature');
    }
    if (text.includes('judiciary') || text.includes('court') || text.includes('judge')) {
      tags.add('judiciary');
    }

    // Specific rights
    if (text.includes('freedom of expression') || text.includes('freedom of speech')) {
      tags.add('freedom of expression');
    }
    if (text.includes('freedom of assembly') || text.includes('right to assemble')) {
      tags.add('freedom of assembly');
    }
    if (text.includes('freedom of religion') || text.includes('religious rights')) {
      tags.add('freedom of religion');
    }
    if (text.includes('right to education') || text.includes('educational rights')) {
      tags.add('right to education');
    }
    if (text.includes('right to health') || text.includes('health care')) {
      tags.add('right to health');
    }
    if (text.includes('right to property') || text.includes('property rights')) {
      tags.add('property rights');
    }
    if (text.includes('right to privacy') || text.includes('privacy rights')) {
      tags.add('privacy rights');
    }

    // Legal procedures
    if (text.includes('fair trial') || text.includes('due process')) {
      tags.add('fair trial');
    }
    if (text.includes('arrest') || text.includes('detention')) {
      tags.add('arrest and detention');
    }
    if (text.includes('search') || text.includes('seizure')) {
      tags.add('search and seizure');
    }

    // Citizenship and nationality
    if (text.includes('citizenship') || text.includes('nationality')) {
      tags.add('citizenship');
    }

    // Elections and democracy
    if (text.includes('election') || text.includes('vote') || text.includes('democracy')) {
      tags.add('elections');
      tags.add('democracy');
    }

    // Security and defense
    if (text.includes('security') || text.includes('defense') || text.includes('armed forces')) {
      tags.add('security');
      tags.add('defense');
    }

    // Economic matters
    if (text.includes('economy') || text.includes('finance') || text.includes('revenue')) {
      tags.add('economy');
      tags.add('finance');
    }

    // Land and natural resources
    if (text.includes('land') || text.includes('natural resources') || text.includes('petroleum')) {
      tags.add('land');
      tags.add('natural resources');
    }
  }
}

// Specialized parser for Penal Code Act South Sudan 2008
export class PenalCodeParser {
  private content: string;

  constructor(content: string) {
    this.content = content;
  }

  parse(): LawArticle[] {
    const articles: LawArticle[] = [];
    const lines = this.content.split('\n');
    
    let currentChapter = '';
    let currentArticle: Partial<LawArticle> | null = null;
    let articleText = '';
    let inArticle = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip empty lines and page numbers
      if (!line || line.match(/^\d+\s*$/) || line.includes('**Act 9**') || line.includes('**LAWS OF SOUTHERN SUDAN**')) {
        continue;
      }

      // Detect chapters - look for "CHAPTER" followed by Roman numerals
      const chapterMatch = line.match(/^CHAPTER\s+([IVX]+)\s*$/);
      if (chapterMatch) {
        // Find the chapter title in the next few lines
        let chapterTitle = '';
        for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
          const nextLine = lines[j].trim();
          if (nextLine && !nextLine.match(/^\d+\./) && !nextLine.includes('**') && nextLine.length > 3) {
            chapterTitle = nextLine.replace(/\*\*/g, '').trim();
            break;
          }
        }
        currentChapter = chapterTitle || `Chapter ${chapterMatch[1]}`;
        continue;
      }

      // Detect articles - look for numbers followed by a period
      const articleMatch = line.match(/^(\d+)\.\s*(.+)$/);
      if (articleMatch) {
        // Save previous article if exists
        if (currentArticle && articleText.trim()) {
          currentArticle.text = articleText.trim();
          currentArticle.tags = this.generatePenalCodeTags(currentArticle);
          articles.push(currentArticle as LawArticle);
        }

        // Start new article
        currentArticle = {
          article: parseInt(articleMatch[1]),
          title: articleMatch[2].trim(),
          chapter: currentChapter,
          part: 'Penal Code Act South Sudan 2008',
          text: '',
          tags: [],
          lawSource: 'Penal Code Act South Sudan 2008'
        };
        articleText = '';
        inArticle = true;
        continue;
      }

      // Regular text content
      if (inArticle && line && !line.includes('**Act 9**')) {
        articleText += ' ' + line;
      }
    }

    // Save the last article
    if (currentArticle && articleText.trim()) {
      currentArticle.text = articleText.trim();
      currentArticle.tags = this.generatePenalCodeTags(currentArticle);
      articles.push(currentArticle as LawArticle);
    }

    return articles;
  }

  private generatePenalCodeTags(article: Partial<LawArticle>): string[] {
    const tags = new Set<string>();
    
    // Add law source tag
    tags.add('penal code');
    tags.add('criminal law');
    
    // Add chapter-based tags
    if (article.chapter) {
      const chapterKeywords = this.extractKeywords(article.chapter);
      chapterKeywords.forEach(keyword => tags.add(keyword));
    }

    // Add title-based tags
    if (article.title) {
      const titleKeywords = this.extractKeywords(article.title);
      titleKeywords.forEach(keyword => tags.add(keyword));
    }

    // Add content-based tags
    if (article.text) {
      const contentKeywords = this.extractKeywords(article.text);
      contentKeywords.forEach(keyword => tags.add(keyword));
    }

    // Add specific criminal law concept tags
    this.addCriminalLawTags(article, tags);

    return Array.from(tags);
  }

  private extractKeywords(text: string): string[] {
    const keywords: string[] = [];
    const lowerText = text.toLowerCase();

    // Criminal law terms
    const criminalTerms = [
      'offence', 'crime', 'criminal', 'penalty', 'punishment', 'sentence',
      'imprisonment', 'fine', 'death', 'murder', 'theft', 'robbery', 'fraud',
      'assault', 'rape', 'kidnapping', 'treason', 'terrorism', 'insurgency',
      'banditry', 'sabotage', 'conspiracy', 'abetment', 'attempt', 'defence',
      'public servant', 'corruption', 'bribery', 'forgery', 'counterfeiting',
      'drugs', 'weapons', 'violence', 'property', 'damage', 'injury', 'hurt',
      'grievous', 'culpable', 'homicide', 'suicide', 'miscarriage', 'abortion',
      'marriage', 'incest', 'adultery', 'prostitution', 'obscenity', 'religion',
      'contempt', 'evidence', 'witness', 'perjury', 'escape', 'arrest', 'custody'
    ];

    criminalTerms.forEach(term => {
      if (lowerText.includes(term)) {
        keywords.push(term);
      }
    });

    return keywords;
  }

  private addCriminalLawTags(article: Partial<LawArticle>, tags: Set<string>): void {
    const text = (article.text || '').toLowerCase();
    const title = (article.title || '').toLowerCase();

    // Offences against the state
    if (text.includes('treason') || text.includes('insurgency') || text.includes('terrorism')) {
      tags.add('offences against state');
    }

    // Offences against persons
    if (text.includes('murder') || text.includes('homicide') || text.includes('assault') || text.includes('rape')) {
      tags.add('offences against persons');
    }

    // Offences against property
    if (text.includes('theft') || text.includes('robbery') || text.includes('fraud') || text.includes('mischief')) {
      tags.add('offences against property');
    }

    // Public order offences
    if (text.includes('public violence') || text.includes('disorderly conduct') || text.includes('riot')) {
      tags.add('public order offences');
    }

    // Corruption and public servant offences
    if (text.includes('corruption') || text.includes('bribery') || text.includes('public servant')) {
      tags.add('corruption offences');
    }

    // Sexual offences
    if (text.includes('rape') || text.includes('sexual') || text.includes('prostitution') || text.includes('incest')) {
      tags.add('sexual offences');
    }

    // Drug offences
    if (text.includes('drug') || text.includes('narcotic') || text.includes('dangerous drug')) {
      tags.add('drug offences');
    }

    // Computer offences
    if (text.includes('computer') || text.includes('electronic') || text.includes('cyber')) {
      tags.add('computer offences');
    }
  }
}

// Utility function to parse the law document
export function parseLawDocument(content: string): LawArticle[] {
  const parser = new LawParser(content);
  return parser.parse();
}

// Utility function to parse the Penal Code Act
export function parsePenalCodeDocument(content: string): LawArticle[] {
  const parser = new PenalCodeParser(content);
  return parser.parse();
}
