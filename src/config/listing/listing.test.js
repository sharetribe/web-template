import {
  listingConfig,
  hasClashWithBuiltInPublicDataKey,
  isReservedListingFieldKey,
  isValidListingFieldKey,
  isValidListingTypeId,
  isValidListingTypeLabel,
  isValidTransactionFieldKey,
} from './listing';
import { buildAppConfig } from '../buildAppConfig';
import { configHandlers } from '../configRegistry';

describe('listing config', () => {
  const sampleListingType = {
    id: 'sell-bicycles',
    label: 'Sell bicycles',
    transactionProcess: {
      name: 'default-purchase',
      alias: 'default-purchase/release-1',
    },
    unitType: 'item',
  };

  const sampleListingField = {
    key: 'bikeType',
    scope: 'public',
    schemaType: 'enum',
    label: 'Bike type',
    enumOptions: [{ option: 'city', label: 'City' }, { option: 'mtb', label: 'MTB' }],
    filterConfig: { showFilter: true, group: 'primary' },
    showConfig: { label: 'Bike type' },
    saveConfig: { label: 'Bike type', required: true },
  };

  const brandingHosted = {
    logo: { type: 'imageAsset', id: 'logo' },
    favicon: { type: 'imageAsset' },
  };

  describe('helpers', () => {
    it('detects clash with built-in and reserved public data keys', () => {
      expect(hasClashWithBuiltInPublicDataKey([{ key: 'bikeType' }])).toBe(false);
      expect(hasClashWithBuiltInPublicDataKey([{ key: 'listingType' }])).toBe(true);
      expect(hasClashWithBuiltInPublicDataKey([{ key: 'categoryLevel1' }])).toBe(true);
      expect(hasClashWithBuiltInPublicDataKey([{ key: 'priceVariantName' }])).toBe(true);
      expect(isReservedListingFieldKey('priceVariant')).toBe(true);
      expect(isReservedListingFieldKey('priceVariants')).toBe(true);
      expect(isReservedListingFieldKey('bikeType')).toBe(false);
    });

    it('validates listing type id pattern', () => {
      expect(isValidListingTypeId('sell-bicycles')).toBe(true);
      expect(isValidListingTypeId('Level_1')).toBe(true);
      expect(isValidListingTypeId('bad id')).toBe(false);
      expect(isValidListingTypeId('bad/id')).toBe(false);
      expect(isValidListingTypeId('')).toBe(false);
      expect(isValidListingTypeId(undefined)).toBe(false);
    });

    it('requires a non-empty listing type label', () => {
      expect(isValidListingTypeLabel('Sell bicycles')).toBe(true);
      expect(isValidListingTypeLabel('  Rentals  ')).toBe(true);
      expect(isValidListingTypeLabel('')).toBe(false);
      expect(isValidListingTypeLabel('   ')).toBe(false);
      expect(isValidListingTypeLabel(undefined)).toBe(false);
    });

    it('validates listing field key pattern', () => {
      expect(isValidListingFieldKey('bikeType')).toBe(true);
      expect(isValidListingFieldKey('Level_1')).toBe(true);
      expect(isValidListingFieldKey('bike-type')).toBe(false);
      expect(isValidListingFieldKey('1startsWithNumber')).toBe(false);
      expect(isValidListingFieldKey('has space')).toBe(false);
      expect(isValidListingFieldKey('')).toBe(false);
      expect(isValidListingFieldKey(undefined)).toBe(false);
    });

    it('validates transaction field key pattern', () => {
      expect(isValidTransactionFieldKey('requests')).toBe(true);
      expect(isValidTransactionFieldKey('extra-notes')).toBe(true);
      expect(isValidTransactionFieldKey('Level_1')).toBe(true);
      expect(isValidTransactionFieldKey('1startsWithNumber')).toBe(true);
      expect(isValidTransactionFieldKey('has space')).toBe(false);
      expect(isValidTransactionFieldKey('has/slash')).toBe(false);
      expect(isValidTransactionFieldKey('')).toBe(false);
      expect(isValidTransactionFieldKey(undefined)).toBe(false);
    });
  });

  describe('listingConfig contract', () => {
    it('declares app-config id and hosted asset keys', () => {
      expect(listingConfig.id).toBe('listing');
      expect(listingConfig.assetKeys).toEqual(['listingTypes', 'listingFields']);
      expect(listingConfig.mandatory).toBe(true);
    });

    it('normalizes hosted listingTypes and listingFields', () => {
      const normalized = listingConfig.normalize({
        listingTypes: { listingTypes: [sampleListingType] },
        listingFields: { listingFields: [sampleListingField] },
      });
      expect(normalized.hasListingTypesAsset).toBe(true);
      expect(normalized.hasNonEmptyListingTypes).toBe(true);
      expect(normalized.hasListingFieldsAsset).toBe(true);
      expect(normalized.listingTypes[0].listingType).toBe('sell-bicycles');
      expect(normalized.listingTypes[0].transactionType).toEqual({
        process: 'default-purchase',
        alias: 'default-purchase/release-1',
        unitType: 'item',
      });
      expect(normalized.listingFields[0].key).toBe('bikeType');
      expect(normalized.listingFields[0].saveConfig.isRequired).toBe(true);
    });

    it('omits missing hosted assets from normalize', () => {
      expect(listingConfig.normalize({})).toEqual({});
      expect(listingConfig.normalize({ listingTypes: null, listingFields: null })).toEqual({});
    });

    it('errors when listing types are missing', () => {
      const { issues } = listingConfig.validate({
        hasListingFieldsAsset: true,
        listingFields: [],
      });
      expect(issues.map(i => i.code)).toContain('LISTING_MISSING_TYPES');
      expect(issues.find(i => i.code === 'LISTING_MISSING_TYPES').level).toBe('error');
    });

    it('errors when listing fields asset is missing', () => {
      const { issues } = listingConfig.validate({
        hasListingTypesAsset: true,
        hasNonEmptyListingTypes: true,
        listingTypes: [
          {
            listingType: 'sell-bicycles',
            label: 'Sell',
            transactionType: {
              process: 'default-purchase',
              alias: 'default-purchase/release-1',
              unitType: 'item',
            },
          },
        ],
      });
      expect(issues.map(i => i.code)).toContain('LISTING_MISSING_FIELDS');
    });

    it('allows empty listing fields array without LISTING_MISSING_FIELDS', () => {
      const { issues } = listingConfig.validate({
        hasListingTypesAsset: true,
        hasNonEmptyListingTypes: true,
        hasListingFieldsAsset: true,
        listingTypes: [
          {
            listingType: 'sell-bicycles',
            label: 'Sell',
            transactionType: {
              process: 'default-purchase',
              alias: 'default-purchase/release-1',
              unitType: 'item',
            },
          },
        ],
        listingFields: [],
      });
      expect(issues.map(i => i.code)).not.toContain('LISTING_MISSING_FIELDS');
    });

    it('errors on public data key clash including priceVariant prefix', () => {
      const base = {
        hasListingTypesAsset: true,
        hasNonEmptyListingTypes: true,
        hasListingFieldsAsset: true,
        listingTypes: [
          {
            listingType: 'sell-bicycles',
            label: 'Sell',
            transactionType: {
              process: 'default-purchase',
              alias: 'default-purchase/release-1',
              unitType: 'item',
            },
          },
        ],
      };
      expect(
        listingConfig
          .validate({
            ...base,
            listingFields: [
              { key: 'listingType', label: 'Clash', scope: 'public', schemaType: 'text' },
            ],
          })
          .issues.map(i => i.code)
      ).toContain('LISTING_PUBLIC_DATA_KEY_CLASH');
      expect(
        listingConfig
          .validate({
            ...base,
            listingFields: [
              { key: 'priceVariantName', label: 'Variant', scope: 'public', schemaType: 'text' },
            ],
          })
          .issues.map(i => i.code)
      ).toContain('LISTING_PUBLIC_DATA_KEY_CLASH');
    });

    it('clears category limits when no categories are in use', () => {
      const normalized = listingConfig.normalize({
        listingTypes: { listingTypes: [sampleListingType] },
        listingFields: {
          listingFields: [
            {
              ...sampleListingField,
              categoryConfig: { limitToCategoryIds: true, categoryIds: ['sneakers'] },
            },
          ],
        },
      });
      const { value, issues } = listingConfig.validate(normalized, {
        resolved: { categoryConfiguration: { categories: [] } },
      });
      expect(issues.filter(i => i.code === 'LISTING_FIELD_UNSUPPORTED')).toEqual([]);
      expect(value.listingFields[0].categoryConfig).toEqual({ limitToCategoryIds: false });
    });

    it('keeps category limits when category ids exist', () => {
      const normalized = listingConfig.normalize({
        listingTypes: { listingTypes: [sampleListingType] },
        listingFields: {
          listingFields: [
            {
              ...sampleListingField,
              categoryConfig: { limitToCategoryIds: true, categoryIds: ['sneakers'] },
            },
          ],
        },
      });
      const { value } = listingConfig.validate(normalized, {
        resolved: {
          categoryConfiguration: {
            categories: [{ id: 'sneakers', name: 'Sneakers', subcategories: [] }],
          },
        },
      });
      expect(value.listingFields[0].categoryConfig).toEqual({
        limitToCategoryIds: true,
        categoryIds: ['sneakers'],
      });
    });

    it('warns and drops listing fields with invalid key, empty label, missing schemaType, or duplicates', () => {
      const { value, issues } = listingConfig.validate({
        hasListingTypesAsset: true,
        hasNonEmptyListingTypes: true,
        hasListingFieldsAsset: true,
        listingTypes: [
          {
            listingType: 'sell-bicycles',
            label: 'Sell',
            transactionType: {
              process: 'default-purchase',
              alias: 'default-purchase/release-1',
              unitType: 'item',
            },
          },
        ],
        listingFields: [
          {
            key: 'bikeType',
            label: 'Bike type',
            scope: 'public',
            schemaType: 'enum',
            enumOptions: [{ option: 'city', label: 'City' }, { option: 'mtb', label: 'MTB' }],
          },
          { key: 'bad-key', label: 'Bad key', scope: 'public', schemaType: 'text' },
          { key: 'bikeType', label: 'Duplicate', scope: 'public', schemaType: 'text' },
          { key: 'noLabel', label: '', scope: 'public', schemaType: 'text' },
          { key: 'noSchema', label: 'No schema', scope: 'public' },
          { key: 'goodTwo', label: 'Good two', scope: 'public', schemaType: 'text' },
        ],
      });
      expect(value.listingFields.map(f => f.key)).toEqual(['bikeType', 'goodTwo']);
      expect(issues.map(i => i.code)).toEqual([
        'LISTING_FIELD_INVALID_KEY',
        'LISTING_FIELD_DUPLICATE_KEY',
        'LISTING_FIELD_MISSING_OR_EMPTY_LABEL',
        'LISTING_FIELD_MISSING_OR_INVALID_SCHEMA_TYPE',
      ]);
    });

    it('warns and drops listing types with invalid ids or empty labels', () => {
      const purchaseTx = {
        process: 'default-purchase',
        alias: 'default-purchase/release-1',
        unitType: 'item',
      };
      const { value, issues } = listingConfig.validate({
        hasListingTypesAsset: true,
        hasNonEmptyListingTypes: true,
        hasListingFieldsAsset: true,
        listingTypes: [
          { listingType: 'good', label: 'Good', transactionType: purchaseTx },
          { listingType: 'bad id', label: 'Bad id', transactionType: purchaseTx },
          { listingType: 'empty-label', label: '', transactionType: purchaseTx },
          { listingType: 'blank-label', label: '   ', transactionType: purchaseTx },
          { listingType: 'missing-label', transactionType: purchaseTx },
        ],
        listingFields: [],
      });
      expect(value.listingTypes.map(lt => lt.listingType)).toEqual(['good']);
      expect(issues.map(i => i.code)).toEqual([
        'LISTING_TYPE_INVALID_ID',
        'LISTING_TYPE_MISSING_OR_EMPTY_LABEL',
        'LISTING_TYPE_MISSING_OR_EMPTY_LABEL',
        'LISTING_TYPE_MISSING_OR_EMPTY_LABEL',
      ]);
    });

    it('warns and drops duplicate listing type ids (keeps first)', () => {
      const purchaseTx = {
        process: 'default-purchase',
        alias: 'default-purchase/release-1',
        unitType: 'item',
      };
      const { value, issues } = listingConfig.validate({
        hasListingTypesAsset: true,
        hasNonEmptyListingTypes: true,
        hasListingFieldsAsset: true,
        listingTypes: [
          { listingType: 'dup', label: 'First', transactionType: purchaseTx },
          { listingType: 'dup', label: 'Second', transactionType: purchaseTx },
          { listingType: 'unique', label: 'Unique', transactionType: purchaseTx },
        ],
        listingFields: [],
      });
      expect(value.listingTypes.map(lt => lt.label)).toEqual(['First', 'Unique']);
      expect(issues.map(i => i.code)).toEqual(['LISTING_TYPE_DUPLICATE_ID']);
    });

    it('errors when listingTypes array is empty (minItems: 1)', () => {
      const { issues } = listingConfig.validate({
        hasListingTypesAsset: true,
        hasNonEmptyListingTypes: false,
        hasListingFieldsAsset: true,
        listingTypes: [],
        listingFields: [],
      });
      expect(issues.map(i => i.code)).toContain('LISTING_MISSING_TYPES');
      expect(issues.find(i => i.code === 'LISTING_MISSING_TYPES').level).toBe('error');
    });

    it('warns and drops invalid transaction fields (required props, key pattern, duplicates)', () => {
      const purchaseTx = {
        process: 'default-purchase',
        alias: 'default-purchase/release-1',
        unitType: 'item',
      };
      const { value, issues } = listingConfig.validate({
        hasListingTypesAsset: true,
        hasNonEmptyListingTypes: true,
        hasListingFieldsAsset: true,
        listingTypes: [
          {
            listingType: 'sell-bicycles',
            label: 'Sell bicycles',
            transactionType: purchaseTx,
            transactionFields: [
              { key: 'requests', label: 'Requests', schemaType: 'text' },
              { key: 'bad key', label: 'Bad key', schemaType: 'text' },
              { key: 'requests', label: 'Duplicate', schemaType: 'text' },
              { key: 'noLabel', label: '', schemaType: 'text' },
              { key: 'noSchema', label: 'No schema' },
              {
                key: 'extra-notes',
                label: 'Extra notes',
                schemaType: 'text',
              },
              {
                key: 'goodTwo',
                label: 'Good two',
                schemaType: 'enum',
                enumOptions: [{ option: 'a', label: 'A' }, { option: 'b', label: 'B' }],
              },
            ],
          },
        ],
        listingFields: [],
      });
      expect(value.listingTypes[0].transactionFields.map(f => f.key)).toEqual([
        'requests',
        'extra-notes',
        'goodTwo',
      ]);
      expect(issues.map(i => i.code)).toEqual([
        'LISTING_TRANSACTION_FIELD_INVALID_KEY',
        'LISTING_TRANSACTION_FIELD_DUPLICATE_KEY',
        'LISTING_TRANSACTION_FIELD_MISSING_OR_EMPTY_LABEL',
        'LISTING_TRANSACTION_FIELD_MISSING_OR_INVALID_SCHEMA_TYPE',
      ]);
    });

    it('warns and drops unsupported listing types', () => {
      const { value, issues } = listingConfig.validate({
        hasListingTypesAsset: true,
        hasNonEmptyListingTypes: true,
        hasListingFieldsAsset: true,
        listingTypes: [
          {
            listingType: 'bad',
            label: 'Bad',
            transactionType: {
              process: 'not-a-process',
              alias: 'not-a-process/release-1',
              unitType: 'item',
            },
          },
        ],
        listingFields: [],
      });
      expect(value.listingTypes).toEqual([]);
      expect(issues.map(i => i.code)).toContain('LISTING_TYPE_UNSUPPORTED');
    });

    it('strips process-specific leftovers after a process change', () => {
      const { value } = listingConfig.validate({
        hasListingTypesAsset: true,
        hasNonEmptyListingTypes: true,
        hasListingFieldsAsset: true,
        listingTypes: [
          {
            listingType: 'sell-bicycles',
            label: 'Sell bicycles',
            transactionType: {
              process: 'default-purchase',
              alias: 'default-purchase/release-1',
              unitType: 'item',
            },
            // Leftovers from a previous booking configuration
            availabilityType: 'multipleSeats',
            priceVariations: { enabled: true },
            negotiationOptions: { customerCounterOffer: true },
            stockType: 'multipleItems',
            defaultListingFields: { price: true },
            messagingOptions: { fileAttachments: true },
            imageSettings: { limitImages: true, maxImages: 9 },
          },
        ],
        listingFields: [],
      });
      expect(value.listingTypes).toEqual([
        {
          listingType: 'sell-bicycles',
          label: 'Sell bicycles',
          transactionType: {
            process: 'default-purchase',
            alias: 'default-purchase/release-1',
            unitType: 'item',
          },
          defaultListingFields: { price: true },
          messagingOptions: { fileAttachments: true },
          imageSettings: { limitImages: true, maxImages: 9 },
          stockType: 'multipleItems',
        },
      ]);
    });

    it('keeps imageSettings across processes (shared listing-type property)', () => {
      const imageSettings = { limitImages: true, maxImages: 5 };
      const { value } = listingConfig.validate({
        hasListingTypesAsset: true,
        hasNonEmptyListingTypes: true,
        hasListingFieldsAsset: true,
        listingTypes: [
          {
            listingType: 'daily-booking',
            label: 'Daily booking',
            transactionType: {
              process: 'default-booking',
              alias: 'default-booking/release-1',
              unitType: 'day',
            },
            imageSettings,
          },
        ],
        listingFields: [],
      });
      expect(value.listingTypes[0].imageSettings).toEqual(imageSettings);
    });

    it('keeps booking-only props for booking and drops purchase leftovers', () => {
      const { value } = listingConfig.validate({
        hasListingTypesAsset: true,
        hasNonEmptyListingTypes: true,
        hasListingFieldsAsset: true,
        listingTypes: [
          {
            listingType: 'daily-booking',
            label: 'Daily booking',
            transactionType: {
              process: 'default-booking',
              alias: 'default-booking/release-1',
              unitType: 'day',
            },
            availabilityType: 'oneSeat',
            priceVariations: { enabled: true },
            stockType: 'multipleItems',
          },
        ],
        listingFields: [],
      });
      expect(value.listingTypes[0]).toEqual({
        listingType: 'daily-booking',
        label: 'Daily booking',
        transactionType: {
          process: 'default-booking',
          alias: 'default-booking/release-1',
          unitType: 'day',
        },
        availabilityType: 'oneSeat',
        priceVariations: { enabled: true },
      });
      expect(value.listingTypes[0].stockType).toBeUndefined();
    });

    it('drops listing types whose unitType is not valid for the current process', () => {
      const { value, issues } = listingConfig.validate({
        hasListingTypesAsset: true,
        hasNonEmptyListingTypes: true,
        hasListingFieldsAsset: true,
        listingTypes: [
          {
            listingType: 'stale-unit',
            label: 'Stale unit',
            // Purchase process with a leftover booking unitType
            transactionType: {
              process: 'default-purchase',
              alias: 'default-purchase/release-1',
              unitType: 'day',
            },
          },
        ],
        listingFields: [],
      });
      expect(value.listingTypes).toEqual([]);
      expect(issues.map(i => i.code)).toContain('LISTING_TYPE_UNSUPPORTED');
    });

    it('resolves via buildAppConfig from registry', () => {
      const { resolved, configIssues } = buildAppConfig({
        hosted: {
          branding: brandingHosted,
          listingTypes: { listingTypes: [sampleListingType] },
          listingFields: { listingFields: [sampleListingField] },
        },
        defaults: {
          listing: { listingTypes: [], listingFields: [], enforceValidListingType: false },
        },
        handlers: configHandlers,
      });
      expect(resolved.listing.listingTypes[0].listingType).toBe('sell-bicycles');
      expect(resolved.listing.listingFields[0].key).toBe('bikeType');
      expect(resolved.listing.enforceValidListingType).toBe(false);
      expect(configIssues.filter(i => i.configId === 'listing' && i.level === 'error')).toEqual([]);
    });

    it('preserves hosted imageSettings through normalize → validate → resolve', () => {
      const { resolved, configIssues } = applyConfigHandlers({
        hosted: {
          branding: brandingHosted,
          listingTypes: {
            listingTypes: [
              {
                ...sampleListingType,
                imageSettings: { limitImages: true, maxImages: 12 },
              },
            ],
          },
          listingFields: { listingFields: [sampleListingField] },
        },
        defaults: {
          listing: { listingTypes: [], listingFields: [], enforceValidListingType: false },
        },
        handlers: configHandlers,
      });

      expect(configIssues.filter(i => i.configId === 'listing' && i.level === 'error')).toEqual([]);
      expect(resolved.listing.listingTypes[0].imageSettings).toEqual({
        limitImages: true,
        maxImages: 12,
      });
    });

    it('emits mandatory listing errors through applyConfigHandlers', () => {
      const { configIssues } = applyConfigHandlers({
        hosted: { branding: brandingHosted },
        defaults: {
          listing: { listingTypes: [], listingFields: [], enforceValidListingType: false },
        },
        handlers: configHandlers,
      });
      const listingCodes = configIssues.filter(i => i.configId === 'listing').map(i => i.code);
      expect(listingCodes).toEqual(
        expect.arrayContaining(['LISTING_MISSING_TYPES', 'LISTING_MISSING_FIELDS'])
      );
    });
  });
});
