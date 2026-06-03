import { createCurrentUser } from '../util/testData';
import * as log from '../util/log';
import { markVendedorOnboarded, setCurrentUser } from './user.duck';

describe('markVendedorOnboarded', () => {
  const payload = { publicData: { onboardingCompleted: true } };

  it('persists onboardingCompleted and syncs the current user in state', async () => {
    const updatedUser = createCurrentUser('user-1');
    const sdk = {
      currentUser: {
        updateProfile: jest.fn(() => Promise.resolve({ data: { data: updatedUser } })),
      },
    };
    const dispatch = jest.fn();

    await markVendedorOnboarded()(dispatch, () => ({}), sdk);

    expect(sdk.currentUser.updateProfile).toHaveBeenCalledWith(payload, { expand: true });
    // The denormalised user is pushed into state.user.currentUser via setCurrentUser.
    const dispatched = dispatch.mock.calls.map(([action]) => action);
    expect(dispatched).toContainEqual(expect.objectContaining({ type: setCurrentUser.type }));
  });

  it('swallows persistence errors and logs them (popup stays dismissed for the session)', async () => {
    const logSpy = jest.spyOn(log, 'error').mockImplementation(() => {});
    const error = new Error('network down');
    const sdk = { currentUser: { updateProfile: jest.fn(() => Promise.reject(error)) } };
    const dispatch = jest.fn();

    // Should resolve, not reject — no unhandled rejection.
    await expect(markVendedorOnboarded()(dispatch, () => ({}), sdk)).resolves.toBeUndefined();
    expect(logSpy).toHaveBeenCalledWith(error, 'mark-vendedor-onboarded-failed');
    expect(dispatch).not.toHaveBeenCalled();

    logSpy.mockRestore();
  });
});
