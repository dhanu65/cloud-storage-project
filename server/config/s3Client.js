const { S3Client } = require('@aws-sdk/client-s3');

const s3Client = new S3Client({
  // The region from your endpoint URL
  region: 'eu-central-003',
  
  // Your specific endpoint URL
  endpoint: 'https://s3.eu-central-003.backblazeb2.com', 
  
  credentials: {
    accessKeyId: process.env.B2_KEY_ID,
    secretAccessKey: process.env.B2_APPLICATION_KEY,
  },
});

module.exports = s3Client;