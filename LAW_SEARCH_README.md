# South Sudan Laws Finder

This application provides instant search functionality across South Sudanese legal documents, including the **Transitional Constitution of the Republic of South Sudan, 2011** and the **Penal Code Act South Sudan 2008**.

## Features

- **Comprehensive Search**: Search across 248+ legal articles from multiple law sources
- **Smart Filtering**: Filter by legal concepts, parts, chapters, and law sources
- **Article Navigation**: Direct links to specific articles
- **Export Options**: Copy text, copy links, and print articles
- **No Login Required**: Instant access to all legal provisions
- **Multi-Source Support**: Search across Constitution and Penal Code Act

## Data Sources

The application includes two comprehensive legal documents:

### 1. Transitional Constitution of the Republic of South Sudan, 2011 (144 articles)

- **Part One**: South Sudan and the Constitution
- **Part Two**: Bill of Rights
- **Part Three**: Fundamental Objectives and Guiding Principles
- **Part Four**: The National Government
- **Part Five**: The National Legislature
- **Part Six**: The National Executive
- **Part Seven**: The Judiciary
- **Part Eight**: Public Attorneys and Advocacy
- **Part Nine**: The Civil Service, Independent Institutions and Commissions
- **Part Ten**: Armed Forces, Law Enforcement Agencies and Security
- **Part Eleven**: The States, Local Government and Traditional Authority
- **Part Twelve**: Finance and Economic Matters
- **Part Thirteen**: State of Emergency and Declaration of War
- **Part Fourteen**: Census, Referenda and Elections
- **Part Fifteen**: Miscellaneous Provisions
- **Part Sixteen**: Transitional Provisions and the Permanent Constitution Process

### 2. Penal Code Act South Sudan 2008 (104 articles)

- **Chapter I**: Preliminary Provisions
- **Chapter II**: Application of Law, Conviction and Compensation
- **Chapter III**: Criminal Responsibility and Defences
- **Chapter IV**: Joint Acts, Abetment, Conspiracy and Attempt
- **Chapter V**: Offences Against Southern Sudan
- **Chapter VI**: Offences Relating to the Defence Forces and Other Organized Forces
- **Chapter VII**: Offences Against Public Order
- **Chapter VIII**: Offences by or Relating to Public Servants
- **Chapter IX**: Contempt of the Lawful Authority of a Public Servant
- **Chapter X**: Offences Relating to the Administration of Justice
- **Chapter XI**: Offences Relating to Counterfeiting Notes, Coins and Revenue Stamps
- **Chapter XII**: Offences Relating to Weights and Measures
- **Chapter XIII**: Offences Affecting the Public Health, Safety and Convenience
- **Chapter XIV**: Provisions Relating to Animals
- **Chapter XV**: Offences Relating to Religion
- **Chapter XVI**: Offences Related to Death
- **Chapter XVII**: Offences Relating to Bodily Injury and Intimidation
- **Chapter XVIII**: Rape, Other Sexual Offences and Offences Against Morality
- **Chapter XIX**: Offences Relating to Marriage and Incest
- **Chapter XX**: Offences Involving Infringement of Liberty, Dignity, Privacy or Reputation
- **Chapter XXI**: Offences Relating to Acquisition of Property
- **Chapter XXII**: Offences Relating to the Damage or Destruction of Property
- **Chapter XXIII**: Offences Involving Premises
- **Chapter XXIV**: Cheating, Criminal Misappropriation, Breach of Trust, Offences Involving Cheques, Fraud and Forgery
- **Chapter XXV**: Drunkenness, Idle Person and Vagabond
- **Chapter XXVI**: Offences Involving Dangerous Drugs
- **Chapter XXVII**: Computer and Electronic Related Offences
- **Chapter XXVIII**: Sexual Harassment
- **Chapter XXIX**: Miscellaneous Provisions

## Search Capabilities

### Keyword Search
- **Constitutional Law**: "freedom", "citizenship", "education", "justice", "human rights", "bill of rights"
- **Government Structure**: "executive", "legislature", "judiciary", "president", "assembly"
- **Criminal Law**: "murder", "theft", "fraud", "assault", "rape", "treason", "terrorism", "corruption"
- **Legal Procedures**: "arrest", "trial", "evidence", "witness", "sentencing", "imprisonment"

### Article Number Search
- Direct article lookup: "Article 23", "23", "Art 23"
- Exact article matching with context

### Filter Options
- **Law Sources**: Filter by Constitution or Penal Code Act
- **Bill of Rights**: Fundamental human rights and freedoms
- **Criminal Law**: Offences, penalties, and criminal procedures
- **Human Rights**: Comprehensive human rights provisions
- **Citizenship**: Citizenship and nationality laws
- **Government**: Government structure and powers
- **Executive**: Executive branch provisions
- **Legislature**: Legislative branch provisions
- **Judiciary**: Judicial system and courts
- **Freedom of Expression**: Media and speech rights
- **Education**: Educational rights and provisions
- **Security**: Security and defense matters

## Technical Implementation

### Data Processing
- **Source**: `law.md` - Complete Transitional Constitution
- **Parser**: Custom JavaScript parser extracts structured data
- **Output**: `public/law.json` - Structured JSON with articles, tags, and metadata

### Search Engine
- **Fuse.js**: Fuzzy search with configurable weights
- **Weighted Search**: Title (30%), Text (40%), Tags (20%), Chapter (5%), Part (5%)
- **Smart Matching**: Handles typos and partial matches

### User Interface
- **React + TypeScript**: Modern, type-safe frontend
- **Tailwind CSS**: Responsive, accessible design
- **Real-time Search**: Instant results as you type
- **Deep Linking**: Shareable URLs for specific articles

## Usage Examples

### Basic Searches
- `freedom` - Find all articles about freedom and rights
- `citizenship` - Find citizenship and nationality provisions
- `Article 23` - Direct access to Article 23
- `education` - Find educational rights and provisions

### Advanced Searches
- `freedom of expression` - Specific right to freedom of expression
- `executive power` - Government executive authority
- `judicial independence` - Judiciary and court system
- `human rights` - Comprehensive human rights provisions

### Filter Combinations
- Filter by "Bill of Rights" + search "freedom"
- Filter by "Government" + search "president"
- Filter by "Judiciary" + search "court"

## File Structure

```
src/
├── lib/
│   ├── search.ts          # Search engine and data management
│   └── law-parser.ts      # Law document parser (TypeScript)
├── components/
│   ├── SearchBar.tsx      # Search interface with filters
│   └── ResultCard.tsx     # Article display component
├── pages/
│   └── Index.tsx          # Main application page
scripts/
└── parse-law-final.js     # Law document parser (JavaScript)
public/
└── law.json              # Structured law data
```

## Development

### Regenerating Law Data
If the `law.md` file is updated, regenerate the JSON data:

```bash
node scripts/parse-law-final.js
```

### Adding New Search Features
1. Update the parser in `scripts/parse-law-final.js`
2. Modify search weights in `src/lib/search.ts`
3. Add new filter options in `src/components/SearchBar.tsx`

### Customizing Search
- Adjust search weights in `fuseOptions`
- Add new tag categories in the parser
- Modify filter options in the UI components

## Legal Notice

This application provides access to the official **Transitional Constitution of the Republic of South Sudan, 2011**. The content is provided for informational purposes and should not be considered as legal advice. For official legal matters, consult qualified legal professionals and official government sources.
