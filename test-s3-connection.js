// Test S3 connection and bucket access
import { S3Client, HeadBucketCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('🔍 All environment variables:');
console.log('Process env keys:', Object.keys(process.env).filter(key => key.includes('AWS') || key.includes('S3')));

// Manually set credentials from .env file values
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
const AWS_REGION = process.env.AWS_REGION || 'ap-south-1';
const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || 'victure-backup';

console.log('\n🔧 AWS Configuration:');
console.log('- Access Key ID:', AWS_ACCESS_KEY_ID ? `${AWS_ACCESS_KEY_ID.substring(0, 8)}...` : 'NOT SET');
console.log('- Secret Access Key:', AWS_SECRET_ACCESS_KEY ? 'SET' : 'NOT SET');
console.log('- Region:', AWS_REGION);
console.log('- Bucket Name:', S3_BUCKET_NAME);

if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) {
  console.error('❌ AWS credentials not found in .env file');
  process.exit(1);
}

const s3Client = new S3Client({
  region: AWS_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  },
});

async function testS3Connection() {
  try {
    console.log('\n🧪 Testing S3 connection...');
    
    // Test bucket access
    console.log('📦 Checking bucket access...');
    await s3Client.send(new HeadBucketCommand({ Bucket: S3_BUCKET_NAME }));
    console.log('✅ Bucket access successful!');
    
    // Test file upload
    console.log('📤 Testing file upload...');
    const testData = JSON.stringify({
      test: 'connection test',
      timestamp: new Date().toISOString(),
      source: 'local-test'
    });
    
    const uploadParams = {
      Bucket: S3_BUCKET_NAME,
      Key: `test-uploads/connection-test-${Date.now()}.json`,
      Body: testData,
      ContentType: 'application/json',
    };
    
    const result = await s3Client.send(new PutObjectCommand(uploadParams));
    console.log('✅ File upload successful!');
    console.log('📁 Upload result:', {
      ETag: result.ETag,
      Location: `s3://${S3_BUCKET_NAME}/${uploadParams.Key}`
    });
    
    console.log('\n🎉 All S3 tests passed! Your AWS configuration is working correctly.');
    
  } catch (error) {
    console.error('❌ S3 test failed:', error.message);
    console.error('Error name:', error.name);
    console.error('Error code:', error.code);
    console.error('Full error:', error);
    
    if (error.name === 'NoSuchBucket') {
      console.log('\n💡 Solution: Create the S3 bucket:');
      console.log(`   1. Go to AWS S3 Console: https://s3.console.aws.amazon.com/`);
      console.log(`   2. Create bucket named: ${S3_BUCKET_NAME}`);
      console.log(`   3. Set region to: ${AWS_REGION}`);
    } else if (error.name === 'AccessDenied') {
      console.log('\n💡 Solution: Check IAM permissions for your AWS user');
    } else if (error.name === 'InvalidAccessKeyId') {
      console.log('\n💡 Solution: Verify your AWS_ACCESS_KEY_ID is correct');
    } else if (error.name === 'SignatureDoesNotMatch') {
      console.log('\n💡 Solution: Verify your AWS_SECRET_ACCESS_KEY is correct');
    }
    
    process.exit(1);
  }
}

testS3Connection();