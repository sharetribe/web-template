import { createListing } from '../util/testData';
import reducer, { addMarketplaceEntities } from './marketplaceData.duck';

describe('marketplaceData duck', () => {
  describe('reducer', () => {
    it('should have empty object for entities by default', () => {
      const state = reducer();
      expect(state.entities).toEqual({});
    });

    it('should add listings with addMarketplaceEntities()', () => {
      const initialState = reducer();
      const listing = createListing('test-id');
      const response = { data: { data: listing } };
      const sanitizeConfig = {};
      const expected = { marketplaceData: { entities: { listing: { ['test-id']: listing } } } };
      const updatedState = reducer(initialState, addMarketplaceEntities(response, sanitizeConfig));
      expect({ marketplaceData: updatedState }).toEqual(expected);
    });
  });
});
