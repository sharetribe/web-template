import { types as sdkTypes } from '../../util/sdkLoader';
import {
  listingImageApiId,
  listingImageIdString,
  listingImageIdentifierStrings,
  uniqueListingImageApiIds,
} from './EditListingPage.shared';

const { UUID } = sdkTypes;
const uuid = '11111111-1111-1111-1111-111111111111';

describe('EditListingPage.shared', () => {
  describe('listingImageIdString', () => {
    it('returns string ids as-is', () => {
      expect(listingImageIdString('temp_123')).toBe('temp_123');
    });

    it('returns uuid from SDK UUID instances', () => {
      expect(listingImageIdString(new UUID(uuid))).toBe(uuid);
    });
  });

  describe('listingImageIdentifierStrings', () => {
    it('returns both temp id and image uuid when present', () => {
      const image = { id: 'temp_123', imageId: new UUID(uuid) };
      expect(listingImageIdentifierStrings(image)).toEqual(['temp_123', uuid]);
    });
  });

  describe('listingImageApiId', () => {
    it('prefers imageId over id', () => {
      const imageId = new UUID(uuid);
      const image = { id: 'temp_123', imageId };
      expect(listingImageApiId(image)).toBe(imageId);
    });
  });

  describe('uniqueListingImageApiIds', () => {
    it('removes duplicate API ids that differ only by UUID object reference', () => {
      const listingImage = { id: new UUID(uuid), type: 'image' };
      const uploadedImage = { id: 'temp_123', imageId: new UUID(uuid), type: 'image' };

      const result = uniqueListingImageApiIds([listingImage, uploadedImage]);

      expect(result).toHaveLength(1);
      expect(listingImageIdString(result[0])).toBe(uuid);
    });

    it('preserves order for unique images', () => {
      const idA = new UUID('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');
      const idB = new UUID('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');
      const images = [{ id: idA }, { id: idB }];

      const result = uniqueListingImageApiIds(images);

      expect(result).toEqual([idA, idB]);
    });

    it('returns null for nullish input', () => {
      expect(uniqueListingImageApiIds(null)).toBeNull();
      expect(uniqueListingImageApiIds(undefined)).toBeNull();
    });
  });
});
