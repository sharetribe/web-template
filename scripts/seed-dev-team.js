/**
 * Seed a demo team into the (dev) marketplace so NextRep team dashboards have data.
 *
 * Creates (idempotently):
 *  - a Team account ("Seattle Little League") with a fixed team code
 *  - an Individual member who has joined that team
 *  - two published gear listings (one team-posted, one member-posted), stamped with the team code
 *
 * Users are created via Marketplace API signup (the Integration API cannot create users); their
 * team data and the listings are written via the Integration API.
 *
 * Usage: node scripts/seed-dev-team.js   (reads creds from .env — runs against whatever marketplace
 * the SHARETRIBE_INTEGRATION_* creds point at, which should be a DEV environment).
 */
require('dotenv').config();
const marketplaceSdkLib = require('sharetribe-flex-sdk');
const integrationSdkLib = require('sharetribe-flex-integration-sdk');

const CLIENT_ID = process.env.REACT_APP_SHARETRIBE_SDK_CLIENT_ID;
const I_ID = process.env.SHARETRIBE_INTEGRATION_CLIENT_ID;
const I_SECRET = process.env.SHARETRIBE_INTEGRATION_CLIENT_SECRET;
const CURRENCY = process.env.SEED_CURRENCY || 'USD';

if (!CLIENT_ID || !I_ID || !I_SECRET) {
  console.error('Missing creds in .env (REACT_APP_SHARETRIBE_SDK_CLIENT_ID + SHARETRIBE_INTEGRATION_*).');
  process.exit(1);
}

const { Money } = integrationSdkLib.types;
const integrationSdk = integrationSdkLib.createInstance({ clientId: I_ID, clientSecret: I_SECRET });

const TEAM_CODE = 'NRDEMOAB2'; // valid format: NR + 7 chars from the unambiguous alphabet
const PASSWORD = 'NextRepDemo123!';

const errInfo = e => `${e.status || ''} ${JSON.stringify(e.data || e.message || {}).slice(0, 300)}`;

// Create a user via signup, then set its team-related publicData via the Integration API.
// Idempotent: if a user already matches `markerQuery`, reuse it.
const ensureUser = async ({ email, firstName, lastName, publicData, markerQuery }) => {
  const existing = await integrationSdk.users.query(markerQuery);
  if (existing.data.data.length) {
    const id = existing.data.data[0].id;
    console.log(`✓ user exists: ${email} (${id.uuid})`);
    return id;
  }
  const mSdk = marketplaceSdkLib.createInstance({ clientId: CLIENT_ID });
  const created = await mSdk.currentUser.create({ email, password: PASSWORD, firstName, lastName });
  const id = created.data.data.id;
  await integrationSdk.users.updateProfile({ id, publicData });
  console.log(`+ created user: ${email} (${id.uuid})`);
  return id;
};

// Create a published listing for the given author, unless one with the same title already exists.
const ensureListing = async ({ authorId, title, publicData, priceAmount }, existingTitles) => {
  if (existingTitles.has(title)) {
    console.log(`✓ listing exists: "${title}"`);
    return;
  }
  await integrationSdk.listings.create({
    authorId,
    title,
    state: 'published',
    price: new Money(priceAmount, CURRENCY),
    publicData: {
      listingType: 'sell_gear',
      transactionProcessAlias: 'default-purchase/release-1',
      unitType: 'item',
      teamCodes: [TEAM_CODE],
      ...publicData,
    },
  });
  console.log(`+ created listing: "${title}"`);
};

(async () => {
  try {
    const teamId = await ensureUser({
      email: 'seed-team@nextrep.test',
      firstName: 'Seattle',
      lastName: 'Little League',
      publicData: { userType: 'teamname', teamCode: TEAM_CODE, teamnamecustom: 'Seattle Little League' },
      markerQuery: { pub_teamCode: TEAM_CODE },
    });

    const memberId = await ensureUser({
      email: 'seed-member@nextrep.test',
      firstName: 'Alex',
      lastName: 'Parent',
      publicData: { userType: 'individual', teamCodes: [TEAM_CODE], sport: ['baseball'] },
      markerQuery: { pub_teamCodes: TEAM_CODE, pub_userType: 'individual' },
    });

    const existing = await integrationSdk.listings.query({ pub_teamCodes: TEAM_CODE });
    const existingTitles = new Set(existing.data.data.map(l => l.attributes.title));

    await ensureListing(
      {
        authorId: teamId,
        title: 'Team baseball bats (set of 6)',
        priceAmount: 12000,
        publicData: { condition_listing: 'good_listing', sport_listing: ['baseball_listing'] },
      },
      existingTitles
    );
    await ensureListing(
      {
        authorId: memberId,
        title: "Kids' baseball glove (youth)",
        priceAmount: 2500,
        publicData: { condition_listing: 'likenew_listing', sport_listing: ['baseball_listing'] },
      },
      existingTitles
    );

    console.log(`\nDone. Team code: ${TEAM_CODE}  |  team login: seed-team@nextrep.test / ${PASSWORD}`);
    console.log(`Member login: seed-member@nextrep.test / ${PASSWORD}`);
  } catch (e) {
    console.error('Seed failed:', errInfo(e));
    process.exit(1);
  }
})();
