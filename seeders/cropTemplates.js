const { CropTemplate } = require('../src/models');

const cropTemplatesData = [
  // Vegetables
  { name: 'Tomatoes', category: 'Vegetables', spoilage_sensitivity: 8, typical_shelf_life_days: 7, storage_recommendations: { temperature: 'cool', humidity: 'moderate' }},
  { name: 'Spinach', category: 'Vegetables', spoilage_sensitivity: 9, typical_shelf_life_days: 5, storage_recommendations: { temperature: 'cold', humidity: 'high' }},
  { name: 'Onions', category: 'Vegetables', spoilage_sensitivity: 3, typical_shelf_life_days: 30, storage_recommendations: { temperature: 'room', humidity: 'low' }},
  { name: 'Carrots', category: 'Vegetables', spoilage_sensitivity: 4, typical_shelf_life_days: 21, storage_recommendations: { temperature: 'cold', humidity: 'high' }},
  
  // Fruits
  { name: 'Bananas', category: 'Fruits', spoilage_sensitivity: 7, typical_shelf_life_days: 6, storage_recommendations: { temperature: 'room', humidity: 'moderate' }},
  { name: 'Mangoes', category: 'Fruits', spoilage_sensitivity: 6, typical_shelf_life_days: 8, storage_recommendations: { temperature: 'room', humidity: 'moderate' }},
  { name: 'Avocados', category: 'Fruits', spoilage_sensitivity: 5, typical_shelf_life_days: 10, storage_recommendations: { temperature: 'room', humidity: 'moderate' }},
  
  // Grains
  { name: 'Maize', category: 'Grains', spoilage_sensitivity: 2, typical_shelf_life_days: 180, storage_recommendations: { temperature: 'room', humidity: 'low' }},
  { name: 'Rice', category: 'Grains', spoilage_sensitivity: 1, typical_shelf_life_days: 365, storage_recommendations: { temperature: 'room', humidity: 'low' }},
  
  // Legumes
  { name: 'Beans', category: 'Legumes', spoilage_sensitivity: 2, typical_shelf_life_days: 90, storage_recommendations: { temperature: 'room', humidity: 'low' }}
];

const seedCropTemplates = async () => {
  try {
    for (const cropData of cropTemplatesData) {
      await CropTemplate.findOrCreate({
        where: { name: cropData.name },
        defaults: cropData
      });
    }
    console.log('✅ Crop templates seeded successfully');
  } catch (error) {
    console.error('❌ Error seeding crop templates:', error);
  }
};

module.exports = seedCropTemplates;