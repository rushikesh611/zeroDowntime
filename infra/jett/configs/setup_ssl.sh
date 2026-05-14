#!/bin/bash

# Exit on error
set -e

echo "Starting SSL Configuration for beacn.online..."

# 1. Install Certbot and Nginx plugin
echo "Installing Certbot..."
sudo apt update
sudo apt install -y certbot python3-certbot-nginx

# 2. Run Certbot
# This command configures Nginx automatically and sets up auto-renewal
# --nginx: Use the Nginx plugin
# -d: Domains to secure
# --non-interactive: Don't ask for input (assumes TOS agreement if you add --agree-tos)
# --agree-tos: Agree to Terms of Service
# -m: Email for renewal warnings (REPLACE THIS WITH YOUR EMAIL)

echo "Obtaining certificates..."
# We use --register-unsafely-without-email to avoid prompts in strict automation, 
# but for a real user script, it's better to ask or just run interactively.
# Here we will simply run it interactively so the user can enter their email on the server.

sudo certbot --nginx -d beacn.online -d www.beacn.online

echo "SSL Setup Complete!"
echo "Certbot has updated your Nginx configuration."
echo "You can test your configuration with: sudo nginx -t"
echo "Auto-renewal is enabled by default."
