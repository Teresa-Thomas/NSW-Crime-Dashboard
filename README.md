# NSW Crime Dashboard

An interactive data dashboard for a community resource centre, visualising NSW crime statistics from the Bureau of Crime Statistics and Research (BOCSAR).

## Features

### KPI Cards
- **Total Incidents** - Aggregate count of all crime incidents
- **Most Common Offence** - Top offence category by incident count
- **Highest Incident Area** - NSW Statistical Area with most incidents
- **Latest Reporting Month** - Most recent month with data

### Visualisations
1. **Crime Incidents Over Time** - Line/area chart showing monthly trends
2. **Incidents by Offence Category** - Horizontal bar chart
3. **Incidents by Geographic Area** - Horizontal bar chart
4. **Top Areas by Incident Count** - Doughnut chart

### Interactive Filters
- Year (all available years)
- Month (Jan-Dec)
- NSW Statistical Area (28 regions)
- Offence Category (21 categories)
- Offence Subcategory (40+ subcategories)

All visualisations and KPIs update instantly when filters change.

### Rankings
- Top 10 Offence Categories
- Top 10 Areas
- Top 10 Subcategories

## Data Source

Data is fetched dynamically from the published Google Sheets CSV:
```
https://docs.google.com/spreadsheets/d/e/2PACX-1vQd6pc1N-v66OBtnvaFNoXCY9KK3P9GytpLuOKu8oNDGn5dceVLfjuePRVfVdF65W9FZsynahA_TQCS/pub?output=csv
```

**Source:** NSW Bureau of Crime Statistics and Research (BOCSAR)
**Coverage:** January 1995 to present
**Format:** Wide format (months as columns) transformed to long format for analysis

## Technical Stack

- **HTML5** - Semantic markup
- **CSS3** - Modern responsive design with CSS Grid/Flexbox, CSS Variables
- **Vanilla JavaScript (ES6+)** - No framework dependencies
- **Chart.js v4** - Data visualisations via CDN
- **Inter Font** - Professional typography via Google Fonts

## Project Structure

```
NSW Crime Dashboard/
├── index.html      # Main HTML structure
├── styles.css      # Styling and responsive layout
├── app.js          # Data fetching, processing, charts
├── data.csv        # Local copy of data (auto-downloaded)
└── README.md       # This file
```

## Getting Started

### Option 1: Direct Open
Simply open `index.html` in a modern browser. The dashboard will fetch data from the Google Sheets URL automatically.

### Option 2: Local Server (Recommended)
For best performance and to avoid CORS issues:

```bash
# Python 3
python -m http.server 8000

# Node.js
npx serve .

# PHP
php -S localhost:8000
```

Then navigate to `http://localhost:8000`

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Design Features

- **Clean Modern UI** - Minimal, professional aesthetic
- **Responsive Layout** - Works on desktop, tablet, mobile
- **Professional Typography** - Inter font family
- **Clear Visual Hierarchy** - KPI cards, charts, rankings
- **Interactive Tooltips** - Detailed values on hover
- **Loading & Error States** - User feedback for data fetching
- **Accessible** - Semantic HTML, proper contrast, keyboard navigation

## Data Processing

The CSV data comes in wide format with months as columns (Jan 1995, Feb 1995, etc.). The JavaScript:

1. Fetches CSV via `fetch()` API
2. Parses with custom CSV parser (handles quoted fields)
3. Transforms to long format (one row per area/category/month)
4. Filters in-memory for instant updates
5. Aggregates for KPIs and charts

## Error Handling

- Network failure detection
- CSV parsing validation
- User-friendly error overlay with retry button
- Loading indicator during fetch
- Graceful degradation for missing data

## Customisation

### Colours
Modify CSS variables in `styles.css`:
```css
:root {
    --color-primary: #2563eb;
    --color-accent: #f59e0b;
    --color-success: #10b981;
    --color-danger: #ef4444;
}
```

### Chart Types
Change chart types in `app.js` by modifying the `type` property in Chart.js config.

### Data Source
Update `CSV_URL` constant in `app.js` to point to a different CSV endpoint.

## Performance Notes

- Dataset: ~1,700 rows × ~360 months = ~600K data points
- In-memory filtering: <50ms typical
- Chart rendering: ~100-200ms per chart
- Initial load: 2-5 seconds depending on connection

## License

This project is for educational/community use. Data © NSW Bureau of Crime Statistics and Research.

## Acknowledgments

- NSW BOCSAR for publishing crime statistics
- Chart.js team for the visualisation library
- Google Fonts for Inter typeface