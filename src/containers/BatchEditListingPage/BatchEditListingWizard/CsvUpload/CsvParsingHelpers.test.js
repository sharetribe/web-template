import { normalizeCategory } from './CsvParsingHelpers';

const categories = [
  { value: 'nature-wildlife', label: 'Nature & Wildlife' },
  { value: 'people-lifestyle', label: 'People & Lifestyle' },
  { value: 'biz-tech', label: 'Business & Technology' },
  { value: 'travel-places', label: 'Travel & Places' },
  { value: 'food-drink', label: 'Food & Drink' },
  { value: 'health-wellness', label: 'Health & Wellness' },
  { value: 'arts-culture', label: 'Arts & Culture' },
  { value: 'sports-rec', label: 'Sports & Recreation' },
  { value: 'science-edu', label: 'Science & Education' },
  { value: 'fashion-beauty', label: 'Fashion & Beauty' },
  { value: 'interiors', label: 'Interiors' },
  { value: 'abstract-conceptual', label: 'Abstract & Conceptual' },
];

describe('normalizeCategory', () => {
  test('should normalize "Nature, Travel" to ["nature-wildlife", "travel-places"]', () => {
    const result = normalizeCategory('Nature, Travel', categories, []);
    expect(result).toEqual(['nature-wildlife', 'travel-places']);
  });

  test('should normalize "Arts, Interiors" to ["arts-culture", "interiors"]', () => {
    const result = normalizeCategory('Arts, Interiors', categories, []);
    expect(result).toEqual(['arts-culture', 'interiors']);
  });

  test('should normalize "Abstract, Arts" to ["abstract-conceptual", "arts-culture"]', () => {
    const result = normalizeCategory('Abstract, Arts', categories, []);
    expect(result).toEqual(['abstract-conceptual', 'arts-culture']);
  });

  test('should normalize "Food & Drink, Health Wellness" to ["food-drink", "health-wellness"]', () => {
    const result = normalizeCategory('Food & Drink, Health Wellness', categories, []);
    expect(result).toEqual(['food-drink', 'health-wellness']);
  });

  test('should merge with current categories, limiting to 5 categories', () => {
    const result = normalizeCategory('Nature, Travel', categories, ['people-lifestyle']);
    expect(result).toEqual(['people-lifestyle', 'nature-wildlife', 'travel-places']);
  });

  test('should not exceed the max categories limit', () => {
    const result = normalizeCategory(
      'Nature, Travel, Arts, Interiors, Science, Food',
      categories,
      []
    );
    expect(result.length).toBe(5);
  });

  test('should handle empty input gracefully', () => {
    const result = normalizeCategory('', categories, ['people-lifestyle']);
    expect(result).toEqual(['people-lifestyle']);
  });

  test('should ignore unmatched categories', () => {
    const result = normalizeCategory('Unmatched Category, Nature', categories, []);
    expect(result).toEqual(['nature-wildlife']);
  });

  test('should normalize input with various casing and special characters', () => {
    const result = normalizeCategory(
      'nature, NATURE & WILDLIFE, travel, travel places',
      categories,
      []
    );
    expect(result).toEqual(['nature-wildlife', 'travel-places']);
  });

  test('should handle duplicates gracefully', () => {
    const result = normalizeCategory('Nature, nature, NATURE', categories, []);
    expect(result).toEqual(['nature-wildlife']);
  });
});
