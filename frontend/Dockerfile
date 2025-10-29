FROM node:18-alpine AS build

WORKDIR /app

# Install deps
COPY frontend/package*.json ./
RUN npm ci || npm install

# Copy frontend source and PWA assets
COPY frontend/. .

# Copy icons from mobile/web into public/icons
RUN mkdir -p public/icons
COPY mobile/web/icons/Icon-192.png public/icons/Icon-192.png
COPY mobile/web/icons/Icon-512.png public/icons/Icon-512.png
COPY mobile/web/icons/Icon-maskable-192.png public/icons/Icon-maskable-192.png
COPY mobile/web/icons/Icon-maskable-512.png public/icons/Icon-maskable-512.png

# Build production assets
ENV CI=true
RUN npm run build

FROM node:18-alpine AS runtime
WORKDIR /app

# Install a small static server
RUN npm i -g serve@14.2.1

COPY --from=build /app/build ./build
EXPOSE 3000

CMD ["serve", "-s", "build", "-l", "3000"]
