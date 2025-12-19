# zd-server

### Install and run locally
```bash
pnpm install
npx prisma generate
pnpm run dev
```

## Docker
### Build image example
```bash
docker build -t zd-server:v1 .
```


### Run container example
```bash 
docker volume create zd-logs
docker run -d -p 3001:3001 --name zd-server --env-file .env -v zd-logs:/app/logs zd-server:v1
```

### .env file
```bash
PORT=3001
SESSION_SECRET=your_session_secret
DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/dbname
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_secret
GITHUB_CALLBACK_URL=http://localhost:3001/api/auth/github/callback
JWT_SECRET=your_jwt_secret
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
EMAIL_SOURCE=your_email@domain.com
RESEND_API_KEY=your_resend_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback

```

### Logs
```bash
docker logs -f zd-server
docker exec zd-server ls /app/logs
```
### Clean up
```bash 
docker stop zd-server
docker rm zd-server
docker volume rm zd-logs
```