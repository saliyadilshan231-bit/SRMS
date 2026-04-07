/**
 * One-time setup script — creates all required attributes on the "sessionpolls" collection
 * Run with: node scripts/setupSessionPollsCollection.js
 */

const APPWRITE_ENDPOINT = 'https://sgp.cloud.appwrite.io/v1';
const PROJECT_ID = '69aa65950030a8c889da';
const DATABASE_ID = '69aa65950030a8c889da';
const COLLECTION_ID = 'sessionpolls';

const API_KEY = ''; // Add your Appwrite server API key here (recommended)

const headers = {
  'Content-Type': 'application/json',
  'X-Appwrite-Project': PROJECT_ID,
};
if (API_KEY) {
  headers['X-Appwrite-Key'] = API_KEY;
}

const BASE = `${APPWRITE_ENDPOINT}/databases/${DATABASE_ID}/collections/${COLLECTION_ID}/attributes`;

async function createAttr(type, body) {
  const url = `${BASE}/${type}`;
  console.log(`Creating ${type} attribute: ${body.key}`);

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (res.ok || res.status === 201) {
    console.log(`  ✓ ${body.key} created successfully`);
  } else if (res.status === 409) {
    console.log(`  ⓘ ${body.key} already exists`);
  } else {
    console.error(`  ✗ ${body.key} FAILED (${res.status}):`, data?.message || JSON.stringify(data));
  }
}

async function main() {
  console.log('Starting sessionpolls collection setup...\n');

  // String attributes
  await createAttr('string', { key: 'title', size: 255, required: true, default: null, array: false });
  await createAttr('string', { key: 'moduleId', size: 50, required: true, default: null, array: false });
  await createAttr('string', { key: 'moduleTitle', size: 255, required: true, default: null, array: false });
  await createAttr('string', { key: 'slotLabels', size: 150, required: true, default: null, array: true });
  await createAttr('string', { key: 'votingEndsAt', size: 50, required: false, default: null, array: false });
  await createAttr('string', { key: 'zoomLink', size: 512, required: false, default: null, array: false });
  await createAttr('string', { key: 'options', size: 10000, required: false, default: null, array: false });
  await createAttr('string', { key: 'kuppiSession', size: 5000, required: false, default: null, array: false });

  // Integer attribute
  await createAttr('integer', {
    key: 'votingDurationMinutes',
    required: true,
    default: 60,
    min: 1,
    max: 10080,
    array: false
  });

  console.log('\n✅ Setup completed! Wait 10-15 seconds for Appwrite indexing.');
  console.log('Then refresh your collection in the Appwrite dashboard.');
}

main().catch(console.error);