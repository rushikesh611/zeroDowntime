### Deployment Steps

1. Provision Infrastructure using Terraform
2. SSH into the instance
3. Clone the repository
4. Add the .env file for server and client
5. Make the deploy.sh and setup_ssl.sh executable 
```bash
chmod +x deploy.sh
chmod +x setup_ssl.sh
```
6. Run the deploy.sh and setup_ssl.sh
```bash
./deploy.sh
./setup_ssl.sh
```
7. Once deployment and ssl setup is complete, add dns host records on namecheap.com dashboard as follows:
    - Type: A Record
    - Host: @
    - Value: <instance_public_ip>
    - TTL: Auto

    - Type: A Record
    - Host: www
    - Value: <instance_public_ip>
    - TTL: Auto

8. The application should be accessible at https://beacn.online