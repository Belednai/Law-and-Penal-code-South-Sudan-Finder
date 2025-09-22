import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the law.md file
const lawContent = fs.readFileSync(path.join(__dirname, '../law.md'), 'utf8');

// Final accurate parser for the law document
function parseLawDocument(content) {
  const articles = [];
  const lines = content.split('\n');
  
  let currentPart = '';
  let currentChapter = '';
  let currentArticle = null;
  let articleText = '';
  let inArticle = false;
  let skipUntilContent = true;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines and table separators
    if (!line || line === '|' || line.startsWith('|') || line === ':---:') {
      continue;
    }

    // Skip everything until we reach the actual content
    if (skipUntilContent) {
      if (line.includes('**The Republic of South Sudan and its Territory**')) {
        skipUntilContent = false;
      }
      continue;
    }

    // Detect parts
    if (line.startsWith('**PART') && line.includes('**')) {
      currentPart = line.replace(/\*\*/g, '').replace(/PART\s+\w+\s*/, '').trim();
      continue;
    }

    // Detect chapters
    if (line.startsWith('***CHAPTER') && line.includes('***')) {
      currentChapter = line.replace(/\*/g, '').replace(/CHAPTER\s+\w+\s*/, '').trim();
      continue;
    }

    // Detect article titles (bold text that's not a part or chapter)
    if (line.startsWith('**') && line.endsWith('**') && !line.includes('PART') && !line.includes('CHAPTER')) {
      // Save previous article if exists
      if (currentArticle && articleText.trim()) {
        currentArticle.text = articleText.trim();
        currentArticle.tags = generateTags(currentArticle);
        articles.push(currentArticle);
      }

      // Start new article with the title
      const title = line.replace(/\*\*/g, '').trim();
      currentArticle = {
        article: articles.length + 1, // We'll assign proper numbers later
        title: title,
        chapter: currentChapter,
        part: currentPart,
        text: '',
        tags: []
      };
      articleText = '';
      inArticle = true;
      continue;
    }

    // Detect articles - look for patterns like "1\. (1) South Sudan is a sovereign..."
    const articleMatch = line.match(/^(\d+)\\.?\s*(.+)$/);
    if (articleMatch) {
      // Save previous article if exists
      if (currentArticle && articleText.trim()) {
        currentArticle.text = articleText.trim();
        currentArticle.tags = generateTags(currentArticle);
        articles.push(currentArticle);
      }

      // Start new article
      currentArticle = {
        article: parseInt(articleMatch[1]),
        title: articleMatch[2].trim(),
        chapter: currentChapter,
        part: currentPart,
        text: '',
        tags: []
      };
      articleText = '';
      inArticle = true;
      continue;
    }

    // Regular text content
    if (inArticle && line && !line.startsWith('**') && !line.startsWith('***') && !line.match(/^(\d+)\\.?\s*/)) {
      articleText += ' ' + line;
    }
  }

  // Save the last article
  if (currentArticle && articleText.trim()) {
    currentArticle.text = articleText.trim();
    currentArticle.tags = generateTags(currentArticle);
    articles.push(currentArticle);
  }

  return articles;
}

function generateTags(article) {
  const tags = new Set();
  
  // Add part-based tags
  if (article.part) {
    const partKeywords = extractKeywords(article.part);
    partKeywords.forEach(keyword => tags.add(keyword));
  }

  // Add chapter-based tags
  if (article.chapter) {
    const chapterKeywords = extractKeywords(article.chapter);
    chapterKeywords.forEach(keyword => tags.add(keyword));
  }

  // Add title-based tags
  if (article.title) {
    const titleKeywords = extractKeywords(article.title);
    titleKeywords.forEach(keyword => tags.add(keyword));
  }

  // Add content-based tags
  if (article.text) {
    const contentKeywords = extractKeywords(article.text);
    contentKeywords.forEach(keyword => tags.add(keyword));
  }

  // Add specific legal concept tags
  addLegalConceptTags(article, tags);

  return Array.from(tags);
}

function extractKeywords(text) {
  const keywords = [];
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

function addLegalConceptTags(article, tags) {
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

// Parse the law document
const articles = parseLawDocument(lawContent);

// Write to JSON file
const outputPath = path.join(__dirname, '../public/law.json');
fs.writeFileSync(outputPath, JSON.stringify(articles, null, 2));

console.log(`Parsed ${articles.length} articles from law.md`);
console.log(`Output written to ${outputPath}`);

// Print some statistics
const parts = [...new Set(articles.map(a => a.part))];
const chapters = [...new Set(articles.map(a => a.chapter))];
const allTags = [...new Set(articles.flatMap(a => a.tags))];

console.log(`\nStatistics:`);
console.log(`- Parts: ${parts.length}`);
console.log(`- Chapters: ${chapters.length}`);
console.log(`- Articles: ${articles.length}`);
console.log(`- Unique tags: ${allTags.length}`);

// Print first few articles for verification
console.log(`\nFirst 5 articles:`);
articles.slice(0, 5).forEach(article => {
  console.log(`Article ${article.article}: ${article.title}`);
  console.log(`  Part: ${article.part}`);
  console.log(`  Chapter: ${article.chapter}`);
  console.log(`  Text preview: ${article.text.substring(0, 100)}...`);
  console.log(`  Tags: ${article.tags.slice(0, 5).join(', ')}`);
  console.log('');
});
