import { mergeAccessControlConfig, accessControlConfig } from './accessControl';
import { applyConfigHandlers, configHandlers } from '../mergeConfig';

describe('accessControl config', () => {
  const defaults = {
    marketplace: { private: false, fileUploadAndDownloadDisabled: false },
  };

  const validUsers = {
    requireApprovalToJoin: true,
    requireApprovalToJoinOptions: {
      callToAction: { type: 'internal', text: 'Get approved', href: '/help' },
    },
  };

  describe('mergeAccessControlConfig', () => {
    it('uses hosted marketplace flags when present', () => {
      expect(
        mergeAccessControlConfig(
          { marketplace: { private: true, fileUploadAndDownloadDisabled: true } },
          defaults
        )
      ).toEqual({
        marketplace: { private: true, fileUploadAndDownloadDisabled: true },
      });
    });

    it('fills gaps from built-in defaults', () => {
      expect(mergeAccessControlConfig({}, defaults)).toEqual(defaults);
      expect(mergeAccessControlConfig({ marketplace: { private: true } }, defaults)).toEqual({
        marketplace: { private: true, fileUploadAndDownloadDisabled: false },
      });
    });
  });

  describe('accessControlConfig contract', () => {
    it('declares accessControl id and asset key', () => {
      expect(accessControlConfig.id).toBe('accessControl');
      expect(accessControlConfig.assetKeys).toEqual(['accessControl']);
    });

    it('normalizes known marketplace / users / listings keys only', () => {
      expect(
        accessControlConfig.normalize({
          accessControl: {
            marketplace: { private: true, fileUploadAndDownloadDisabled: false, extra: 1 },
            users: {
              requireApprovalToJoin: true,
              requireApprovalToJoinOptions: { callToAction: { type: 'none' } },
              unknownUserKey: true,
            },
            listings: {
              requireApprovalToPublish: true,
              requireApprovalToPublishOptions: { callToAction: { type: 'none' } },
              unknownListingKey: true,
            },
            other: true,
          },
        })
      ).toEqual({
        marketplace: { private: true, fileUploadAndDownloadDisabled: false },
        users: {
          requireApprovalToJoin: true,
          requireApprovalToJoinOptions: { callToAction: { type: 'none' } },
        },
        listings: {
          requireApprovalToPublish: true,
          requireApprovalToPublishOptions: { callToAction: { type: 'none' } },
        },
      });
      expect(accessControlConfig.normalize({})).toEqual({});
      expect(
        accessControlConfig.normalize({
          accessControl: { marketplace: 'nope' },
        })
      ).toEqual({});
    });

    it('warns on non-boolean marketplace flags', () => {
      const { value, issues } = accessControlConfig.validate({
        marketplace: { private: 'yes', fileUploadAndDownloadDisabled: 1 },
      });
      expect(value).toEqual({});
      expect(issues.map(i => i.code)).toEqual(
        expect.arrayContaining([
          'ACCESS_CONTROL_INVALID_PRIVATE',
          'ACCESS_CONTROL_INVALID_FILE_UPLOAD',
        ])
      );
    });

    it('warns and drops invalid users/listings permission shape', () => {
      const { value, issues } = accessControlConfig.validate({
        users: {
          requireApprovalToJoin: 'yes',
          requirePermissionToPostListings: true,
          requireApprovalToJoinOptions: { callToAction: { type: 'link' } },
          requirePermissionToPostListingsOptions: {
            callToAction: { type: 'external', text: 'Apply' },
          },
        },
        listings: {
          requireApprovalToPublish: true,
          requireApprovalToPublishOptions: { callToAction: { type: 'none' } },
        },
      });

      expect(value).toEqual({
        users: {
          requirePermissionToPostListings: true,
        },
        listings: {
          requireApprovalToPublish: true,
          requireApprovalToPublishOptions: { callToAction: { type: 'none' } },
        },
      });
      expect(issues.map(i => i.code)).toEqual(
        expect.arrayContaining([
          'ACCESS_CONTROL_INVALID_PERMISSION_FLAG',
          'ACCESS_CONTROL_INVALID_CTA',
        ])
      );
      expect(issues.filter(i => i.code === 'ACCESS_CONTROL_INVALID_CTA')).toHaveLength(2);
    });

    it('is registered and resolves via applyConfigHandlers', () => {
      expect(configHandlers).toContain(accessControlConfig);

      const { resolved, configIssues } = applyConfigHandlers({
        hosted: {
          accessControl: {
            marketplace: { private: true },
            users: validUsers,
          },
        },
        defaults: { accessControl: defaults },
        handlers: [accessControlConfig],
      });

      expect(resolved.accessControl).toEqual({
        marketplace: { private: true, fileUploadAndDownloadDisabled: false },
        users: validUsers,
      });
      expect(configIssues).toEqual([]);
    });
  });
});
