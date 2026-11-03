import {
  userConfig,
  isValidUserTypeId,
  isValidUserTypeLabel,
  isValidUserFieldKey,
  isReservedUserFieldKey,
} from './user';
import { applyConfigHandlers, configHandlers } from '../mergeConfig';

describe('user config', () => {
  const sampleUserType = {
    id: 'seller',
    label: 'Seller',
  };

  const sampleUserField = {
    key: 'cuisine',
    scope: 'public',
    schemaType: 'enum',
    label: 'Favorite cuisine',
    enumOptions: [{ option: 'italian', label: 'Italian' }, { option: 'thai', label: 'Thai' }],
    showConfig: { label: 'Favorite cuisine' },
    saveConfig: { label: 'Favorite cuisine', required: true, displayInSignUp: true },
    userTypeConfig: { limitToUserTypeIds: false },
  };

  describe('helpers', () => {
    it('validates user type id pattern', () => {
      expect(isValidUserTypeId('seller')).toBe(true);
      expect(isValidUserTypeId('sell-bicycles')).toBe(true);
      expect(isValidUserTypeId('Level_1')).toBe(true);
      expect(isValidUserTypeId('bad id')).toBe(false);
      expect(isValidUserTypeId('bad/id')).toBe(false);
      expect(isValidUserTypeId('')).toBe(false);
      expect(isValidUserTypeId(undefined)).toBe(false);
    });

    it('requires a non-empty user type label', () => {
      expect(isValidUserTypeLabel('Seller')).toBe(true);
      expect(isValidUserTypeLabel('  Host  ')).toBe(true);
      expect(isValidUserTypeLabel('')).toBe(false);
      expect(isValidUserTypeLabel('   ')).toBe(false);
      expect(isValidUserTypeLabel(undefined)).toBe(false);
    });

    it('validates user field key pattern', () => {
      expect(isValidUserFieldKey('cuisine')).toBe(true);
      expect(isValidUserFieldKey('Level_1')).toBe(true);
      expect(isValidUserFieldKey('user-type')).toBe(false);
      expect(isValidUserFieldKey('1startsWithNumber')).toBe(false);
      expect(isValidUserFieldKey('has space')).toBe(false);
      expect(isValidUserFieldKey('')).toBe(false);
      expect(isValidUserFieldKey(undefined)).toBe(false);
    });

    it('detects reserved user field keys', () => {
      expect(isReservedUserFieldKey('userType')).toBe(true);
      expect(isReservedUserFieldKey('phoneNumber')).toBe(true);
      expect(isReservedUserFieldKey('terms')).toBe(true);
      expect(isReservedUserFieldKey('referralSource_partner')).toBe(true);
      expect(isReservedUserFieldKey('cuisine')).toBe(false);
      expect(isReservedUserFieldKey('referralSources')).toBe(false);
    });
  });

  describe('userConfig contract', () => {
    it('declares app-config id and hosted asset keys', () => {
      expect(userConfig.id).toBe('user');
      expect(userConfig.assetKeys).toEqual(['userTypes', 'userFields']);
    });

    it('is registered in configHandlers', () => {
      expect(configHandlers.map(h => h.id)).toContain('user');
    });

    it('normalizes hosted userTypes and userFields', () => {
      const normalized = userConfig.normalize({
        userTypes: { userTypes: [sampleUserType] },
        userFields: { userFields: [sampleUserField] },
      });
      expect(normalized.userTypes[0]).toEqual({ userType: 'seller', label: 'Seller' });
      expect(normalized.userFields[0].key).toBe('cuisine');
      expect(normalized.userFields[0].saveConfig.isRequired).toBe(true);
    });

    it('returns empty arrays when hosted assets are missing', () => {
      expect(userConfig.normalize({ userTypes: null, userFields: null })).toEqual({
        userTypes: [],
        userFields: [],
      });
    });

    it('validates and keeps well-formed types and fields', () => {
      const normalized = userConfig.normalize({
        userTypes: { userTypes: [sampleUserType] },
        userFields: { userFields: [sampleUserField] },
      });
      const { value, issues } = userConfig.validate(normalized);
      expect(issues).toEqual([]);
      expect(value.userTypes).toEqual([{ userType: 'seller', label: 'Seller' }]);
      expect(value.userFields[0].key).toBe('cuisine');
    });

    it('warns and drops user types with invalid ids, empty labels, or duplicates', () => {
      const { value, issues } = userConfig.validate({
        userTypes: [
          { userType: 'seller', label: 'Seller' },
          { userType: 'bad id', label: 'Bad id' },
          { userType: 'empty-label', label: '' },
          { userType: 'blank-label', label: '   ' },
          { userType: 'missing-label' },
          { userType: 'seller', label: 'Duplicate' },
          { userType: 'buyer', label: 'Buyer' },
        ],
        userFields: [],
      });
      expect(value.userTypes.map(ut => ut.userType)).toEqual(['seller', 'buyer']);
      expect(issues.map(i => i.code)).toEqual([
        'USER_TYPE_INVALID_ID',
        'USER_TYPE_MISSING_OR_EMPTY_LABEL',
        'USER_TYPE_MISSING_OR_EMPTY_LABEL',
        'USER_TYPE_MISSING_OR_EMPTY_LABEL',
        'USER_TYPE_DUPLICATE_ID',
      ]);
    });

    it('warns and drops user fields with invalid, reserved, or duplicate keys', () => {
      const { value, issues } = userConfig.validate({
        userTypes: [{ userType: 'seller', label: 'Seller' }],
        userFields: [
          {
            key: 'bad-key',
            scope: 'public',
            schemaType: 'text',
            showConfig: { label: 'Bad key' },
            saveConfig: { label: 'Bad key', isRequired: false },
            userTypeConfig: { limitToUserTypeIds: false },
          },
          {
            key: 'phoneNumber',
            scope: 'public',
            schemaType: 'text',
            showConfig: { label: 'Reserved' },
            saveConfig: { label: 'Reserved', isRequired: false },
            userTypeConfig: { limitToUserTypeIds: false },
          },
          {
            key: 'referralSource_partner',
            scope: 'private',
            schemaType: 'text',
            showConfig: { label: 'Reserved prefix' },
            saveConfig: { label: 'Reserved prefix', isRequired: false },
            userTypeConfig: { limitToUserTypeIds: false },
          },
          {
            key: 'cuisine',
            scope: 'public',
            schemaType: 'text',
            showConfig: { label: 'First' },
            saveConfig: { label: 'First', isRequired: false },
            userTypeConfig: { limitToUserTypeIds: false },
          },
          {
            key: 'cuisine',
            scope: 'public',
            schemaType: 'text',
            showConfig: { label: 'Duplicate' },
            saveConfig: { label: 'Duplicate', isRequired: false },
            userTypeConfig: { limitToUserTypeIds: false },
          },
          {
            key: 'bioExtra',
            scope: 'public',
            schemaType: 'text',
            showConfig: { label: 'Good' },
            saveConfig: { label: 'Good', isRequired: false },
            userTypeConfig: { limitToUserTypeIds: false },
          },
        ],
      });
      expect(value.userFields.map(f => f.key)).toEqual(['cuisine', 'bioExtra']);
      expect(issues.map(i => i.code)).toEqual([
        'USER_FIELD_INVALID_KEY',
        'USER_FIELD_RESERVED_KEY',
        'USER_FIELD_RESERVED_KEY',
        'USER_FIELD_DUPLICATE_KEY',
      ]);
    });

    it('warns and drops user fields with invalid schemaType', () => {
      const { value, issues } = userConfig.validate({
        userTypes: [{ userType: 'seller', label: 'Seller' }],
        userFields: [
          {
            key: 'bad',
            scope: 'public',
            schemaType: 'not-a-type',
            showConfig: { label: 'Bad' },
            saveConfig: { label: 'Bad', isRequired: false },
          },
          {
            key: 'good',
            scope: 'public',
            schemaType: 'text',
            showConfig: { label: 'Good' },
            saveConfig: { label: 'Good', isRequired: false },
            userTypeConfig: { limitToUserTypeIds: false },
          },
        ],
      });
      expect(value.userFields.map(f => f.key)).toEqual(['good']);
      expect(issues.map(i => i.code)).toContain('USER_FIELD_UNSUPPORTED');
    });

    it('warns with unknown user type ids when userTypeConfig limit has no matches', () => {
      const { value, issues } = userConfig.validate({
        userTypes: [{ userType: 'seller', label: 'Seller' }],
        userFields: [
          {
            key: 'cuisine',
            scope: 'public',
            schemaType: 'text',
            showConfig: { label: 'Cuisine' },
            saveConfig: { label: 'Cuisine', isRequired: false },
            userTypeConfig: {
              limitToUserTypeIds: true,
              userTypeIds: ['missing-one', 'missing-two'],
            },
          },
        ],
      });
      const unsupported = issues.filter(i => i.code === 'USER_FIELD_UNSUPPORTED');
      expect(unsupported).toHaveLength(1);
      expect(unsupported[0].message).toContain('userTypeConfig');
      expect(unsupported[0].message).toContain('"missing-one"');
      expect(unsupported[0].message).toContain('"missing-two"');
      expect(value.userFields).toEqual([]);
    });

    it('resolve prefers hosted and does not fall back to defaults', () => {
      const resolved = userConfig.resolve(
        { userTypes: [{ userType: 'seller', label: 'Seller' }], userFields: [] },
        {
          user: {
            userTypes: [{ userType: 'a', label: 'Built-in' }],
            userFields: [{ key: 'builtin', schemaType: 'text' }],
          },
        }
      );
      expect(resolved.userTypes).toEqual([{ userType: 'seller', label: 'Seller' }]);
      expect(resolved.userFields).toEqual([]);
    });

    it('applyConfigHandlers produces user from hosted assets', () => {
      const { resolved, configIssues } = applyConfigHandlers({
        hosted: {
          userTypes: { userTypes: [sampleUserType] },
          userFields: { userFields: [sampleUserField] },
        },
        defaults: {
          user: { userTypes: [], userFields: [] },
        },
        handlers: configHandlers.filter(h => h.id === 'user'),
      });
      expect(configIssues.filter(i => i.level === 'error')).toEqual([]);
      expect(resolved.user.userTypes[0].userType).toBe('seller');
      expect(resolved.user.userFields[0].key).toBe('cuisine');
    });
  });
});
