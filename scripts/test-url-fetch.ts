async function testFetch() {
  const url = 'https://res.cloudinary.com/x5gin721/raw/upload/v1784929250/manchester-tech/uploads/1784929250026_umstp_NEET_Grand_test___1_.pdf';
  console.log('Testing fetch to Cloudinary URL:', url);
  const res = await fetch(url);
  console.log('Status:', res.status, res.statusText);
  const text = await res.text();
  console.log('Response body snippet:', text.substring(0, 300));
}

testFetch();
