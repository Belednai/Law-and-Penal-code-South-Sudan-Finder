import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import the parser functions (we'll need to adapt this for Node.js)
// For now, let's create a simplified version that works in Node.js

function parsePenalCodeDocument(content) {
  const articles = [];
  const lines = content.split('\n');
  
  let currentChapter = '';
  let currentArticle = null;
  let articleText = '';
  let inArticle = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines and page numbers
    if (!line || line.match(/^\d+\s*$/) || line.includes('**Act 9**') || line.includes('**LAWS OF SOUTHERN SUDAN**')) {
      continue;
    }


    // Detect chapters - look for "**CHAPTER" followed by Roman numerals
    const chapterMatch = line.match(/^\*\*CHAPTER\s+([IVX]+)\s*\*\*$/);
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

    // Detect articles - look for **number\. Title** format
    const articleMatch = line.match(/^\*\*(\d+)\\.\s*(.+)\*\*\.?\s*$/);
    if (articleMatch) {
      // Save previous article if exists
      if (currentArticle && articleText.trim()) {
        currentArticle.text = articleText.trim();
        currentArticle.tags = generatePenalCodeTags(currentArticle);
        articles.push(currentArticle);
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
    currentArticle.tags = generatePenalCodeTags(currentArticle);
    articles.push(currentArticle);
  }

  return articles;
}

function generatePenalCodeTags(article) {
  const tags = new Set();
  
  // Add law source tag
  tags.add('penal code');
  tags.add('criminal law');
  
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

  // Add specific criminal law concept tags
  addCriminalLawTags(article, tags);

  return Array.from(tags);
}

function extractKeywords(text) {
  const keywords = [];
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

function addCriminalLawTags(article, tags) {
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

// Main execution
async function main() {
  try {
    console.log('Parsing Penal Code Act South Sudan 2008...');
    
    // Read the Penal Code Act markdown file
    const penalCodePath = path.join(__dirname, '..', 'Penal-Code-Act-South-Sudan-2008.md');
    const penalCodeContent = fs.readFileSync(penalCodePath, 'utf8');
    
    // Parse the Penal Code Act
    const penalCodeArticles = parsePenalCodeDocument(penalCodeContent);
    console.log(`Parsed ${penalCodeArticles.length} articles from Penal Code Act`);
    
    // Read existing law data
    const lawJsonPath = path.join(__dirname, '..', 'public', 'law.json');
    let existingArticles = [];
    
    if (fs.existsSync(lawJsonPath)) {
      const existingContent = fs.readFileSync(lawJsonPath, 'utf8');
      existingArticles = JSON.parse(existingContent);
      console.log(`Found ${existingArticles.length} existing articles`);
    }
    
    // Add lawSource to existing articles if not present
    existingArticles = existingArticles.map(article => ({
      ...article,
      lawSource: article.lawSource || 'Laws of South Sudan'
    }));
    
    // Merge the articles
    const allArticles = [...existingArticles, ...penalCodeArticles];
    console.log(`Total articles after merge: ${allArticles.length}`);
    
    // Write the merged data
    fs.writeFileSync(lawJsonPath, JSON.stringify(allArticles, null, 2));
    console.log('Successfully merged and saved law data');
    
    // Print some statistics
    const constitutionCount = allArticles.filter(a => a.lawSource === 'Laws of South Sudan').length;
    const penalCodeCount = allArticles.filter(a => a.lawSource === 'Penal Code Act South Sudan 2008').length;
    
    console.log('\nStatistics:');
    console.log(`- Laws of South Sudan: ${constitutionCount} articles`);
    console.log(`- Penal Code Act South Sudan 2008: ${penalCodeCount} articles`);
    
  } catch (error) {
    console.error('Error parsing and merging law data:', error);
    process.exit(1);
  }
}

main();
