
### Build image example
```bash
docker build -t zerodowntime-api:1.0.0 .
```


### Run container example
```bash
docker run -d \
  --name zerodowntime \
  -p 3001:3001 \
  --env-file .env.docker \
  zerodowntime-api:1.0.0
```

### .env.docker file
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
```