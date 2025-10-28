#!/bin/bash

# Generate self-signed SSL certificates for local development
# These certificates allow HTTPS access for microphone permissions

mkdir -p ssl

# Generate private key
openssl genrsa -out ssl/key.pem 2048

# Generate certificate signing request
openssl req -new -key ssl/key.pem -out ssl/cert.csr -subj "//C=US/ST=State/L=City/O=JournalAI/CN=localhost"

# Generate self-signed certificate (valid for 365 days)
openssl x509 -req -days 365 -in ssl/cert.csr -signkey ssl/key.pem -out ssl/cert.pem

# Remove the CSR file
rm ssl/cert.csr

echo "SSL certificates generated successfully!"
echo "Certificates are in nginx/ssl/ directory"
echo "Note: Browser will show security warning for self-signed certificate - this is expected"

