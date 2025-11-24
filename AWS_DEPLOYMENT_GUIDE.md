# 🚀 AWS Deployment Guide for NM2BibleAI PWA

## Option 1: AWS Amplify (Recommended - Easiest)

AWS Amplify is the easiest way to host your PWA on AWS. It automatically handles:
- ✅ HTTPS/SSL certificates
- ✅ CDN distribution
- ✅ CI/CD (automatic deployments from GitHub)
- ✅ PWA support
- ✅ Custom domains

### Step 1: Build Your App Locally (Test First)

```bash
npm run build:web
```

This creates a `web-build` folder with your production-ready PWA.

### Step 2: Deploy to AWS Amplify

#### Method A: Connect GitHub Repository (Recommended)

1. **Go to AWS Amplify Console**
   - Visit: https://console.aws.amazon.com/amplify
   - Click "New app" → "Host web app"
   - Select "GitHub" and authorize

2. **Connect Your Repository**
   - Select your repository: `perplex_bibleai`
   - Select branch: `main`
   - Amplify will auto-detect the build settings from `amplify.yml`

3. **Review Build Settings**
   - Build command: `npm run build:web`
   - Output directory: `web-build`
   - Click "Save and deploy"

4. **Wait for Deployment**
   - First deployment takes 5-10 minutes
   - You'll get a URL like: `https://main.xxxxx.amplifyapp.com`

#### Method B: Deploy from Local Build

1. **Build your app:**
   ```bash
   npm run build:web
   ```

2. **Go to AWS Amplify Console**
   - Visit: https://console.aws.amazon.com/amplify
   - Click "New app" → "Deploy without Git provider"
   - Drag and drop the `web-build` folder
   - Click "Save and deploy"

### Step 3: Configure Custom Domain (Optional)

1. In Amplify Console, go to "Domain management"
2. Click "Add domain"
3. Enter your domain name
4. Follow DNS setup instructions
5. SSL certificate is automatically provisioned

---

## Option 2: S3 + CloudFront (More Control)

This gives you more control but requires manual setup.

### Step 1: Build Your App

```bash
npm run build:web
```

### Step 2: Create S3 Bucket

1. **Go to S3 Console**
   - Visit: https://console.aws.amazon.com/s3
   - Click "Create bucket"
   - Name: `nm2bibleai-pwa` (must be globally unique)
   - Region: Choose closest to your users
   - Uncheck "Block all public access" (needed for web hosting)
   - Enable "Static website hosting"
   - Index document: `index.html`
   - Error document: `index.html` (for React Router)

### Step 3: Upload Files

```bash
# Install AWS CLI if not installed
# https://aws.amazon.com/cli/

# Configure AWS CLI
aws configure

# Upload files
aws s3 sync web-build/ s3://nm2bibleai-pwa --delete
```

### Step 4: Set Up CloudFront (CDN)

1. **Go to CloudFront Console**
   - Visit: https://console.aws.amazon.com/cloudfront
   - Click "Create distribution"
   - Origin domain: Select your S3 bucket
   - Viewer protocol policy: "Redirect HTTP to HTTPS"
   - Default root object: `index.html`
   - Click "Create distribution"

2. **Wait for Deployment** (15-20 minutes)
   - You'll get a CloudFront URL: `https://xxxxx.cloudfront.net`

### Step 5: Configure Custom Domain

1. In CloudFront, go to your distribution
2. Click "Alternate domain names (CNAMEs)"
3. Add your domain
4. Request SSL certificate in AWS Certificate Manager
5. Update DNS records

---

## Option 3: AWS App Runner (Container-based)

For more advanced deployments with Docker support.

---

## Environment Variables

If you have environment variables (like API keys), set them in:

**AWS Amplify:**
- Go to your app → "Environment variables"
- Add: `EXPO_PUBLIC_*` variables

**S3 + CloudFront:**
- Use AWS Systems Manager Parameter Store
- Or inject during build process

---

## Cost Estimate

- **AWS Amplify**: ~$0.15/GB served + $0.01/GB stored
- **S3 + CloudFront**: ~$0.023/GB (S3) + $0.085/GB (CloudFront)
- **Free Tier**: Both have generous free tiers

For a small app, expect **$0-5/month**.

---

## Testing Your PWA

After deployment:

1. **Open your app URL**
2. **Check PWA features:**
   - Open Chrome DevTools (F12)
   - Go to "Application" tab
   - Check "Manifest" and "Service Workers"
3. **Test installation:**
   - Look for install prompt in browser
   - Install on phone/desktop
   - Verify it works offline

---

## Troubleshooting

### Build Fails
- Check `amplify.yml` configuration
- Verify Node.js version (use 18+)
- Check build logs in Amplify Console

### PWA Not Working
- Ensure HTTPS is enabled (required for PWA)
- Check manifest.json is accessible
- Verify service worker is registered

### CORS Issues
- Configure CORS in S3 bucket policy
- Or use CloudFront with proper headers

---

## Quick Start Commands

```bash
# Build for production
npm run build:web

# Test locally
npx serve web-build

# Deploy to Amplify (after connecting GitHub)
# Just push to GitHub - Amplify auto-deploys!

# Deploy to S3
aws s3 sync web-build/ s3://nm2bibleai-pwa --delete
```

---

## Next Steps

1. ✅ Build your app: `npm run build:web`
2. ✅ Choose deployment method (Amplify recommended)
3. ✅ Deploy to AWS
4. ✅ Test PWA features
5. ✅ Configure custom domain (optional)

Your PWA will be live on AWS! 🎉

