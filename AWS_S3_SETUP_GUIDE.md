# AWS S3 Setup Guide for Wallpaper Website

This guide will help you set up Amazon S3 for storing wallpaper images and configure the necessary AWS credentials.

## Prerequisites

- AWS Account
- AWS CLI installed (optional but recommended)
- Node.js application with AWS SDK installed

## Step 1: Create S3 Bucket

1. **Login to AWS Console**
   - Go to [AWS Console](https://console.aws.amazon.com/)
   - Navigate to S3 service

2. **Create New Bucket**
   - Click "Create bucket"
   - Choose a unique bucket name (e.g., `wallpaper-plus-web-images`)
   - Select your preferred region (e.g., `ap-south-1`)
   - Configure settings:
     - Block Public Access: **Uncheck** "Block all public access" (for public image serving)
     - Bucket Versioning: Enable (optional)
     - Default encryption: Enable with S3-managed keys

3. **Configure Bucket Policy** (for public read access to images)
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Sid": "PublicReadGetObject",
         "Effect": "Allow",
         "Principal": "*",
         "Action": "s3:GetObject",
         "Resource": "arn:aws:s3:::your-bucket-name/*"
       }
     ]
   }
   ```

4. **Configure CORS** (for web uploads)
   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
       "AllowedOrigins": ["*"],
       "ExposeHeaders": ["ETag"]
     }
   ]
   ```

## Step 2: Create IAM User and Credentials

1. **Navigate to IAM Service**
   - Go to AWS Console > IAM > Users
   - Click "Create user"

2. **Create User**
   - Username: `wallpaper-app-user`
   - Access type: **Programmatic access**

3. **Attach Policies**
   - Create custom policy for S3 access:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "s3:GetObject",
           "s3:PutObject",
           "s3:DeleteObject",
           "s3:ListBucket"
         ],
         "Resource": [
           "arn:aws:s3:::your-bucket-name",
           "arn:aws:s3:::your-bucket-name/*"
         ]
       }
     ]
   }
   ```

4. **Download Credentials**
   - Save Access Key ID and Secret Access Key securely

## Step 3: Configure Environment Variables

Create a `.env.local` file in your project root:

```env
# AWS Configuration
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=your_access_key_id_here
AWS_SECRET_ACCESS_KEY=your_secret_access_key_here
AWS_S3_BUCKET_NAME=your_s3_bucket_name_here

# Optional: Custom S3 endpoint (for local development with LocalStack)
# AWS_S3_ENDPOINT=http://localhost:4566
```

**Important**: Add `.env.local` to your `.gitignore` file to keep credentials secure.

## Step 4: Update Next.js Configuration

Update your `next.config.ts` to allow images from your S3 bucket:

```typescript
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'your-bucket-name.s3.amazonaws.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'your-bucket-name.s3.ap-south-1.amazonaws.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};
```

## Step 5: Test the Setup

1. **Start your development server**
   ```bash
   npm run dev
   ```

2. **Test image upload**
   - Login to your application
   - Navigate to "My Wallpapers"
   - Try uploading an image
   - Check if the image appears in your S3 bucket

## Available Upload Methods

### 1. Presigned URL Upload (Recommended)
- **Pros**: Direct client-to-S3 upload, reduces server load
- **Cons**: Requires proper CORS configuration
- **Usage**: Default method in the application

### 2. Direct Server Upload
- **Pros**: More control, easier debugging
- **Cons**: Uses server resources, slower for large files
- **Usage**: Fallback method

## File Organization

Files are organized in S3 with the following structure:
```
wallpapers/
├── user-id-1/
│   ├── timestamp_uuid.jpg
│   ├── timestamp_uuid.png
│   └── ...
├── user-id-2/
│   └── ...
```

## Security Best Practices

1. **Bucket Permissions**
   - Only allow public read access to uploaded images
   - Restrict write access to authenticated users only

2. **File Validation**
   - Validate file types on both client and server
   - Limit file sizes (current limit: 10MB)
   - Scan for malicious content if needed

3. **Access Keys**
   - Use IAM roles in production instead of access keys
   - Rotate access keys regularly
   - Use least privilege principle

4. **Monitoring**
   - Enable CloudTrail for API logging
   - Set up CloudWatch for monitoring usage
   - Configure billing alerts

## Cost Optimization

1. **Storage Classes**
   - Use S3 Standard for frequently accessed images
   - Consider S3 IA for older images
   - Use lifecycle policies for automatic transitions

2. **CDN Integration**
   - Consider using CloudFront for faster image delivery
   - Reduces S3 request costs
   - Improves global performance

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Check bucket CORS configuration
   - Verify allowed origins include your domain

2. **Permission Denied**
   - Verify IAM user has correct permissions
   - Check bucket policy allows required actions

3. **Environment Variables Not Loading**
   - Ensure `.env.local` is in project root
   - Restart development server after changes
   - Check variable names match exactly

### Debug Tips

1. **Enable Debug Logging**
   ```javascript
   // Add to your AWS configuration
   AWS.config.logger = console;
   ```

2. **Test Credentials**
   ```bash
   aws s3 ls s3://your-bucket-name --profile your-profile
   ```

3. **Check Network**
   - Verify firewall settings
   - Test from different networks

## Production Deployment

1. **Environment Variables**
   - Set environment variables in your hosting platform
   - Use different buckets for staging/production

2. **Domain Configuration**
   - Update CORS to allow your production domain
   - Update Next.js image domains configuration

3. **Monitoring**
   - Set up error tracking
   - Monitor S3 costs and usage
   - Configure alerts for unusual activity

## Alternative Solutions

If AWS S3 doesn't meet your needs, consider:

1. **Google Cloud Storage**
2. **Azure Blob Storage**
3. **DigitalOcean Spaces**
4. **Cloudinary** (with built-in image optimization)
5. **Local storage** (for development only)

## Support

- [AWS S3 Documentation](https://docs.aws.amazon.com/s3/)
- [AWS SDK for JavaScript Documentation](https://docs.aws.amazon.com/sdk-for-javascript/)
- [Next.js Image Optimization Documentation](https://nextjs.org/docs/app/building-your-application/optimizing/images)
