#!/bin/bash

# Exit on error
set -e

echo "Starting ZeroDowntime Deployment..."

# 1. Update System
echo "Updating system..."
sudo apt update -y
sudo apt upgrade -y
sudo apt install -y curl git unzip build-essential

# 2. Install Node.js 22
echo "Installing Node.js 22..."
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# 3. Install pnpm
echo "Installing pnpm..."
sudo npm install -g pnpm
sudo npm install -g pm2

# 4. Install Dependencies
echo "Installing root dependencies..."
pnpm install

echo "Installing client dependencies..."
cd client
pnpm install
cd ..

echo "Installing server dependencies..."
cd server
pnpm install
cd ..

# 5. Build Applications
echo "Building Server..."
cd server
npx prisma generate
pnpm build
cd ..

echo "Building Client..."
cd client
pnpm build
cd ..

# 6. Configure Nginx
echo "Configuring Nginx..."
sudo apt install -y nginx
sudo cp nginx.temp.conf /etc/nginx/sites-available/default
sudo nginx -t
sudo systemctl restart nginx

# 7. Start PM2
echo "Starting Application with PM2..."
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup | tail -n 1 | bash || true

echo "Deployment Complete!"
echo "Your app should be live on port 80 (Nginx Proxy)."
