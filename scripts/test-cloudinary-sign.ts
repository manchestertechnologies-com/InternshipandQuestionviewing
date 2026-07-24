import 'dotenv/config';
import { v2 as cloudinary } from 'cloudinary';

const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim().replace(/^["']|["']$/g, '');
const apiKey = process.env.CLOUDINARY_API_KEY?.trim().replace(/^["']|["']$/g, '');
const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim().replace(/^["']|["']$/g, '');

console.log('Cloudinary Config Check:');
console.log('cloudName:', cloudName);
console.log('apiKey:', apiKey ? `${apiKey.substring(0, 4)}...` : 'MISSING');
console.log('apiSecret:', apiSecret ? 'PRESENT' : 'MISSING');

if (cloudName && apiKey && apiSecret) {
  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });

  const publicId = 'manchester-tech/uploads/1784929250026_umstp_NEET_Grand_test___1_.pdf';
  const signedRawUrl = cloudinary.url(publicId, { resource_type: 'raw', sign_url: true, secure: true });
  const signedImgUrl = cloudinary.url(publicId, { resource_type: 'image', sign_url: true, secure: true });
  const altImgUrl = `https://res.cloudinary.com/${cloudName}/image/upload/v1784929250/${publicId}`;

  console.log('\nSigned Raw URL:', signedRawUrl);
  console.log('Signed Image URL:', signedImgUrl);
  console.log('Alt Image URL:', altImgUrl);

  async function testAll() {
    for (const [label, u] of Object.entries({ signedRawUrl, signedImgUrl, altImgUrl })) {
      try {
        const res = await fetch(u);
        console.log(`\nFetch ${label} -> Status: ${res.status} ${res.statusText}`);
      } catch (err) {
        console.log(`Fetch ${label} failed:`, err);
      }
    }
  }

  testAll();
} else {
  console.error('\nCloudinary credentials missing in .env!');
}
