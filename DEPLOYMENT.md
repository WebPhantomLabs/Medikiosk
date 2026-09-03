# MediKiosk Deployment Guide

This guide covers deploying the MediKiosk frontend to production.

## Prerequisites

- ✅ FastAPI backend deployed and accessible
- ✅ PostgreSQL database (Supabase or managed instance)
- ✅ Environment variables configured
- ✅ Domain name (optional but recommended)

---

## Deployment Options

### Option 1: Vercel (Recommended for Next.js)

#### Steps:

1. **Push to GitHub/GitLab**
   ```bash
   git init
   git add .
   git commit -m "Initial MediKiosk commit"
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Import Project"
   - Select your GitHub repository
   - Configure environment variables:
     - `DATABASE_URL`
     - `NEXT_PUBLIC_API_URL`
     - `BACKEND_URL`

3. **Deploy**
   - Vercel automatically builds and deploys
   - Preview URL provided instantly
   - Production domain: `your-project.vercel.app`

#### Custom Domain (Optional)
- Add custom domain in Vercel dashboard
- Update DNS records as instructed
- SSL automatically provisioned

---

### Option 2: AWS Amplify

1. **Connect Repository**
   - Go to AWS Amplify Console
   - Connect your GitHub/GitLab repository
   
2. **Build Settings**
   Amplify auto-detects Next.js. If needed, use:
   ```yaml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - npm ci
       build:
         commands:
           - npm run build
     artifacts:
       baseDirectory: .next
       files:
         - '**/*'
     cache:
       paths:
         - node_modules/**/*
   ```

3. **Environment Variables**
   Add in Amplify Console > App Settings > Environment Variables

4. **Deploy**
   - Amplify builds and deploys automatically
   - CloudFront CDN enabled by default

---

### Option 3: Docker + Cloud Run / ECS

#### Dockerfile
```dockerfile
# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
```

#### Update next.config.ts
```typescript
const nextConfig = {
  output: 'standalone',
};
export default nextConfig;
```

#### Build and Deploy
```bash
# Build Docker image
docker build -t medikiosk-frontend .

# Test locally
docker run -p 3000:3000 --env-file .env.local medikiosk-frontend

# Push to registry
docker tag medikiosk-frontend gcr.io/YOUR_PROJECT/medikiosk-frontend
docker push gcr.io/YOUR_PROJECT/medikiosk-frontend

# Deploy to Cloud Run
gcloud run deploy medikiosk-frontend \
  --image gcr.io/YOUR_PROJECT/medikiosk-frontend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

---

### Option 4: Self-Hosted (VPS/EC2)

#### Install Node.js
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

#### Clone and Build
```bash
git clone <your-repo-url>
cd medikiosk-frontend
npm ci
npm run build
```

#### Run with PM2
```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start npm --name "medikiosk" -- start

# Save PM2 configuration
pm2 save
pm2 startup
```

#### Nginx Reverse Proxy
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### SSL with Let's Encrypt
```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## Environment Configuration

### Production Environment Variables

```bash
# Database (must be publicly accessible or within same VPC)
DATABASE_URL=postgresql://user:password@production-db:5432/medikiosk

# Backend API
NEXT_PUBLIC_API_URL=https://api.your-domain.com/api/v1
BACKEND_URL=https://api.your-domain.com/api/v1

# Application
NEXT_PUBLIC_APP_NAME=MediKiosk
NODE_ENV=production

# Security (generate strong secrets)
NEXTAUTH_SECRET=$(openssl rand -base64 32)
NEXTAUTH_URL=https://your-domain.com
```

### Secrets Management

**Vercel/Netlify:**
- Use platform environment variables UI
- Mark sensitive vars as "secret"

**AWS:**
- Use AWS Secrets Manager or SSM Parameter Store
- Reference in Amplify/ECS task definition

**Docker:**
- Use Docker secrets or Kubernetes secrets
- Never commit `.env` files to git

---

## Post-Deployment Checklist

### Verification
- [ ] Home page loads correctly
- [ ] Kiosk flow works end-to-end
- [ ] Doctor login and dashboard functional
- [ ] Admin panel accessible
- [ ] API calls to backend successful
- [ ] Database connections working
- [ ] SSL/HTTPS enabled
- [ ] No console errors in browser

### Performance
- [ ] Lighthouse score > 90
- [ ] First Contentful Paint < 1.5s
- [ ] Time to Interactive < 3s
- [ ] Enable caching headers
- [ ] Compress static assets

### Security
- [ ] All environment variables set correctly
- [ ] No secrets in client-side code
- [ ] CORS configured properly on backend
- [ ] Rate limiting enabled
- [ ] CSP headers configured
- [ ] HTTPS enforced

### Monitoring
- [ ] Setup error tracking (Sentry, LogRocket, etc.)
- [ ] Configure uptime monitoring
- [ ] Setup analytics (optional)
- [ ] Log aggregation configured
- [ ] Performance monitoring active

---

## Scaling Considerations

### Database
- Use connection pooling (PgBouncer)
- Read replicas for heavy read loads
- Regular backups and point-in-time recovery

### Application
- Horizontal scaling via load balancer
- CDN for static assets (Cloudflare, AWS CloudFront)
- Redis for session management (if needed)

### Caching
- Enable Next.js static optimization where possible
- API response caching
- CDN edge caching

---

## Rollback Strategy

### Vercel
- Click "Redeploy" on previous successful deployment
- Instant rollback

### Docker/Kubernetes
```bash
# Tag previous working image as latest
docker tag medikiosk-frontend:v1.0 medikiosk-frontend:latest

# Restart pods/containers
kubectl rollout undo deployment/medikiosk-frontend
```

### Git-based
```bash
git revert <bad-commit-hash>
git push origin main
# Trigger redeploy
```

---

## Troubleshooting

### Build Fails
- Check Node.js version (should be 18+)
- Clear `.next` folder and rebuild
- Verify all dependencies installed

### Database Connection Errors
- Check `DATABASE_URL` format
- Verify database is accessible from deployment environment
- Check firewall rules

### API Errors
- Verify `NEXT_PUBLIC_API_URL` is correct
- Check CORS settings on backend
- Ensure backend is deployed and healthy

### 404 on Refresh
- Configure server to serve index.html for all routes
- In Nginx: `try_files $uri $uri/ /index.html;`
- In Vercel/Netlify: handled automatically

---

## Support

For deployment issues:
- Check build logs
- Review environment variables
- Test API endpoints manually
- Check browser console for errors
- Review backend logs

---

**Last Updated:** 2026  
**Version:** 1.0
