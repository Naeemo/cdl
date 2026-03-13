// @cdl/templates - CDL Chart Templates
// Ready-to-use chart templates for common business scenarios

module.exports = {
  categories: {
    sales: 'Sales & Revenue Analytics',
    user: 'User & Traffic Analytics', 
    kpi: 'KPI Dashboards',
    financial: 'Financial Reports',
    inventory: 'Inventory & Operations',
  },
  
  getTemplate(category: string, name: string) {
    // Dynamic import of template files
    try {
      return require(`./${category}/${name}.cdl`);
    } catch (e) {
      return null;
    }
  },
  
  listTemplates(category?: string) {
    if (category) {
      return Object.keys(this.categories)
        .filter(c => c === category)
        .map(c => ({
          category: c,
          name: this.categories[c as keyof typeof this.categories],
        }));
    }
    return Object.entries(this.categories).map(([key, name]) => ({
      category: key,
      name,
    }));
  }
};
