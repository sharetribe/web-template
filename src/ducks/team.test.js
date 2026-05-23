import { createCurrentUser } from '../util/testData';
import { createFakeDispatch, dispatchedActions } from '../util/testHelpers';
import { isValidTeamCodeFormat } from '../util/teams';
import { lookupTeam, fetchTeamNames } from '../util/api';
import reducer, { ensureTeamCode, joinTeam, leaveTeam, loadTeamNames } from './team.duck';

// joinTeam verifies codes via the server lookup; loadTeamNames resolves names. Mock both.
jest.mock('../util/api', () => ({ lookupTeam: jest.fn(), fetchTeamNames: jest.fn() }));

const TEAM = 'teamname';
const INDIVIDUAL = 'individual';

// Fake sdk whose updateProfile echoes the written publicData back as a currentUser entity,
// so denormalisedResponseEntities() in the duck resolves to a single user.
const makeSdk = () => ({
  currentUser: {
    updateProfile: jest.fn(params =>
      Promise.resolve({
        data: { data: createCurrentUser('user', { profile: { publicData: params.publicData } }) },
      })
    ),
  },
  // joinTeam backfills existing listings; default to none.
  ownListings: {
    query: jest.fn(() => Promise.resolve({ data: { data: [] } })),
    update: jest.fn(() => Promise.resolve({ data: { data: {} } })),
  },
});

const stateWithUser = currentUser => () => ({ user: { currentUser } });

const teamUser = (publicData = {}) =>
  createCurrentUser('team-1', { profile: { publicData: { userType: TEAM, ...publicData } } });
const individualUser = (publicData = {}) =>
  createCurrentUser('ind-1', { profile: { publicData: { userType: INDIVIDUAL, ...publicData } } });

describe('team duck', () => {
  // resetMocks:true clears the implementation before each test, so set it here.
  beforeEach(() => {
    lookupTeam.mockResolvedValue({ verified: true, found: true, teamName: 'Test Team' });
  });

  describe('reducer', () => {
    it('has sensible defaults', () => {
      const state = reducer(undefined, { type: '@@INIT' });
      expect(state).toEqual({
        ensureCodeInProgress: false,
        ensureCodeError: null,
        joinInProgress: false,
        joinError: null,
        teamNames: {},
      });
    });
  });

  describe('ensureTeamCode', () => {
    it('is a no-op for non-team accounts', async () => {
      const sdk = makeSdk();
      const dispatch = createFakeDispatch(stateWithUser(individualUser()), sdk);
      const result = await dispatch(ensureTeamCode());
      expect(result).toBeNull();
      expect(sdk.currentUser.updateProfile).not.toHaveBeenCalled();
    });

    it('returns the existing code without writing', async () => {
      const sdk = makeSdk();
      const dispatch = createFakeDispatch(stateWithUser(teamUser({ teamCode: 'NRK7MQ9P2' })), sdk);
      const result = await dispatch(ensureTeamCode());
      expect(result).toEqual('NRK7MQ9P2');
      expect(sdk.currentUser.updateProfile).not.toHaveBeenCalled();
    });

    it('generates and persists a valid code for a team without one', async () => {
      const sdk = makeSdk();
      const dispatch = createFakeDispatch(stateWithUser(teamUser()), sdk);
      const result = await dispatch(ensureTeamCode());

      expect(isValidTeamCodeFormat(result)).toBe(true);
      expect(sdk.currentUser.updateProfile).toHaveBeenCalledTimes(1);
      const writtenParams = sdk.currentUser.updateProfile.mock.calls[0][0];
      expect(writtenParams.publicData.teamCode).toEqual(result);
    });
  });

  describe('joinTeam', () => {
    it('rejects an invalid code without calling the API', async () => {
      const sdk = makeSdk();
      const dispatch = createFakeDispatch(stateWithUser(individualUser()), sdk);
      await expect(dispatch(joinTeam('not-valid'))).rejects.toBeDefined();
      expect(sdk.currentUser.updateProfile).not.toHaveBeenCalled();
      const actionTypes = dispatchedActions(dispatch).map(a => a.type);
      expect(actionTypes).toContain('team/joinError');
    });

    it('adds a normalized code to the joined list', async () => {
      const sdk = makeSdk();
      const dispatch = createFakeDispatch(stateWithUser(individualUser()), sdk);
      const result = await dispatch(joinTeam('nr-aaaaaa2'));
      expect(result).toEqual(['NRAAAAAA2']);
      expect(sdk.currentUser.updateProfile.mock.calls[0][0].publicData.teamCodes).toEqual([
        'NRAAAAAA2',
      ]);
    });

    it('does not re-add a code already joined', async () => {
      const sdk = makeSdk();
      const dispatch = createFakeDispatch(
        stateWithUser(individualUser({ teamCodes: ['NRAAAAAA2'] })),
        sdk
      );
      const result = await dispatch(joinTeam('NRAAAAAA2'));
      expect(result).toEqual(['NRAAAAAA2']);
      expect(sdk.currentUser.updateProfile).not.toHaveBeenCalled();
      expect(lookupTeam).not.toHaveBeenCalled();
    });

    it('rejects when the server verifies no team exists for the code', async () => {
      lookupTeam.mockResolvedValueOnce({ verified: true, found: false, teamName: null });
      const sdk = makeSdk();
      const dispatch = createFakeDispatch(stateWithUser(individualUser()), sdk);
      await expect(dispatch(joinTeam('NRZZZZZZ9'))).rejects.toBeDefined();
      expect(sdk.currentUser.updateProfile).not.toHaveBeenCalled();
      const actionTypes = dispatchedActions(dispatch).map(a => a.type);
      expect(actionTypes).toContain('team/joinError');
    });

    it('backfills the new code onto existing listings that lack it', async () => {
      const sdk = makeSdk();
      sdk.ownListings.query.mockResolvedValueOnce({
        data: {
          data: [
            { id: { uuid: 'l1' }, attributes: { publicData: { teamCodes: [] } } },
            { id: { uuid: 'l2' }, attributes: { publicData: { teamCodes: ['NRAAAAAA2'] } } },
          ],
        },
      });
      const dispatch = createFakeDispatch(stateWithUser(individualUser()), sdk);
      await dispatch(joinTeam('nr-aaaaaa2'));
      // l1 lacked the code -> updated; l2 already had it -> skipped.
      expect(sdk.ownListings.update).toHaveBeenCalledTimes(1);
      expect(sdk.ownListings.update.mock.calls[0][0]).toEqual({
        id: { uuid: 'l1' },
        publicData: { teamCodes: ['NRAAAAAA2'] },
      });
    });

    it('stores the code unverified when the server cannot verify', async () => {
      lookupTeam.mockResolvedValueOnce({ verified: false, found: null, teamName: null });
      const sdk = makeSdk();
      const dispatch = createFakeDispatch(stateWithUser(individualUser()), sdk);
      const result = await dispatch(joinTeam('NRZZZZZZ9'));
      expect(result).toEqual(['NRZZZZZZ9']);
      expect(sdk.currentUser.updateProfile).toHaveBeenCalledTimes(1);
    });
  });

  describe('loadTeamNames', () => {
    it('resolves names and caches them in state', async () => {
      fetchTeamNames.mockResolvedValueOnce({ names: { NRDEMOAB2: 'Seattle Little League' } });
      const dispatch = createFakeDispatch(stateWithUser(individualUser()), makeSdk());
      const result = await dispatch(loadTeamNames(['NRDEMOAB2']));
      expect(result).toEqual({ NRDEMOAB2: 'Seattle Little League' });
      const setAction = dispatchedActions(dispatch).find(a => a.type === 'team/setTeamNames');
      expect(setAction.payload).toEqual({ NRDEMOAB2: 'Seattle Little League' });
    });

    it('is a no-op for an empty list', async () => {
      const dispatch = createFakeDispatch(stateWithUser(individualUser()), makeSdk());
      const result = await dispatch(loadTeamNames([]));
      expect(result).toEqual({});
      expect(fetchTeamNames).not.toHaveBeenCalled();
    });
  });

  describe('leaveTeam', () => {
    it('removes the code from the joined list', async () => {
      const sdk = makeSdk();
      const dispatch = createFakeDispatch(
        stateWithUser(individualUser({ teamCodes: ['NRAAAAAA2', 'NRBBBBBB3'] })),
        sdk
      );
      const result = await dispatch(leaveTeam('nr-aaaaaa2'));
      expect(result).toEqual(['NRBBBBBB3']);
      expect(sdk.currentUser.updateProfile.mock.calls[0][0].publicData.teamCodes).toEqual([
        'NRBBBBBB3',
      ]);
    });
  });
});
