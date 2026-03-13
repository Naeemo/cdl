# @cdl/templates

CDL Chart Templates - Ready-to-use chart templates for common business scenarios.

## Template Categories

### 📊 Sales (<code>sales/</code>)
- Monthly revenue trends
- Product sales comparison
- Regional sales distribution
- Sales target vs actual

### 👥 Users (<code>user/</code>)
- User growth trends
- User distribution by segment
- Traffic sources breakdown
- Active users over time

### 🎯 KPI (<code>kpi/</code>)
- Executive dashboard
- Performance metrics
- Goal tracking
- Metric cards with trends

### 💰 Financial (<code>financial/</code>)
- Profit & loss statement
- Cash flow chart
- Expense breakdown
- Revenue by category

### 📦 Inventory (<code>inventory/</code>)
- Stock levels by product
- Inventory turnover
- Supply chain overview
- Warehouse capacity

## Usage

### CLI

```bash
# Use a template
cdl template sales/monthly-revenue

# List available templates
cdl template --list

# List by category
cdl template --list --category kpi
```

### Programmatic

```javascript
import templates from '@cdl/templates';

// List all templates
const all = templates.listTemplates();

// Get specific template
const template = templates.getTemplate('sales', 'monthly-revenue');
```

## Creating Custom Templates

1. Create a new <code>.cdl</code> file in the appropriate category folder
2. Add a <code>.json</code> metadata file with description and tags
3. Submit a PR!

## License

MIT
