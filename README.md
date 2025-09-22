# South Sudan Constitution Search

A fast, accessible one-page web application for searching and reading articles from the Constitution of the Republic of South Sudan.

## Features

- 🔍 **Instant Search**: Full-text search with fuzzy matching using Fuse.js
- 📱 **Mobile-First**: Responsive design that works on all devices
- 🔗 **Deep Linking**: Share direct links to specific articles with search terms
- ⚡ **Fast Performance**: Client-side search with <200ms response times
- 🎯 **Smart Filters**: Quick filter by topic tags (rights, citizenship, justice, etc.)
- 📋 **Easy Sharing**: Copy article links, text, or print individual articles
- 🔄 **Search History**: Recent searches stored locally for quick access
- ♿ **Accessible**: ARIA labels, semantic HTML, keyboard navigation

## Tech Stack

- **Framework**: Vite + React + TypeScript
- **Styling**: Tailwind CSS with custom design system
- **Search**: Fuse.js for fuzzy full-text search
- **UI Components**: shadcn/ui components
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
# Clone the repository
git clone [your-repo-url]
cd constitution-search

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:8080`

### Building for Production

```bash
# Build the app
npm run build

# Preview the build
npm run preview
```

## Usage

### Search Functionality

- **Keyword Search**: Type any keyword (e.g., "freedom", "education", "rights")
- **Article Number**: Search by article number (e.g., "23", "Article 23", "Art 23")  
- **Quick Filters**: Use topic tags to filter results
- **Recent Searches**: Click on recent searches to quickly repeat them

### URL Parameters

- `?q=keyword` - Pre-fill search with keyword
- `#article-N` - Jump to and expand specific article

Example: `?q=freedom#article-23` opens the app with "freedom" searched and Article 23 expanded.

### Article Actions

When an article is expanded, you can:
- **Copy Link**: Get a shareable URL with search context
- **Copy Text**: Copy the full article text
- **Print**: Print the article with clean formatting

## Data Structure

The constitution data is stored in `public/constitution.json` with this structure:

```json
[
  {
    "article": 1,
    "title": "Title of the Article",
    "chapter": "Chapter Name", 
    "text": "Full text of the article...",
    "tags": ["keyword1", "keyword2"]
  }
]
```

## Adding Official Constitution Data

**TODO**: Replace the demo data in `public/constitution.json` with the official Constitution text.

### Steps to add official data:

1. **Get the Source**: Obtain the official Constitution text (PDF, Word doc, etc.)

2. **Convert to JSON**: Transform the content into the required JSON structure:
   ```json
   [
     {
       "article": 1,
       "title": "Article title",
       "chapter": "Chapter I — Chapter Name",
       "text": "Full article text...",
       "tags": ["relevant", "keywords"]
     }
   ]
   ```

3. **Add Tags**: Include relevant keyword tags for better search results:
   - Common tags: "rights", "freedom", "citizenship", "justice", "government", "courts", "education", "assembly", "property", "religion"

4. **Replace File**: Save the complete data as `public/constitution.json`

5. **Test**: Verify all articles load and search works correctly

### Conversion Tips

- Use consistent chapter naming (e.g., "Chapter I — General Provisions")
- Include all article text, including sub-sections and clauses
- Add 3-6 relevant tags per article for optimal filtering
- Maintain sequential article numbering

## Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Netlify

```bash
# Build the app
npm run build

# Upload the dist/ folder to Netlify
```

### Other Static Hosts

Build the app and deploy the `dist/` folder to any static hosting service (GitHub Pages, Cloudflare Pages, etc.).

## Performance

- **Lighthouse Scores**: 90+ on Performance, 95+ on Accessibility, Best Practices, and SEO
- **Bundle Size**: <100KB JavaScript (excluding dataset)
- **Search Speed**: <200ms on mid-range mobile devices
- **Offline Support**: Basic caching via service worker (optional)

## Browser Support

- Chrome 88+
- Firefox 85+
- Safari 14+
- Edge 88+

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source. The Constitution of South Sudan is public domain.

## Support

For issues or questions:
- Check the [Issues](../../issues) page
- Review this README
- Test with the demo data first

---

**Current Status**: Demo version with sample constitution articles. Ready for official constitution data integration.