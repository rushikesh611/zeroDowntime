# Install NGINX Ingress Controller
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.1/deploy/static/provider/cloud/deploy.yaml

# Install cert-manager
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml


kubectl apply -f cert-issuer.yaml
kubectl apply -f frontend.yaml
kubectl apply -f backend.yaml
kubectl apply -f ingress.yaml

Remember to:

Replace yourdomain.com with your actual domain name in all files
Replace your-email@example.com in the cert-issuer with your actual email
Update your GitHub OAuth callback URL to https://yourdomain.com/api/auth/github/callback