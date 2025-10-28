FROM nginx:alpine

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy SSL certificates (will be generated if not present)
COPY ssl /etc/nginx/ssl/

# Create log directory
RUN mkdir -p /var/log/nginx

# Expose HTTPS port
EXPOSE 443

CMD ["nginx", "-g", "daemon off;"]

