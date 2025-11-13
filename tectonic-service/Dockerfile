# -----------------------------------
# Stage 1: Build Node.js service
# -----------------------------------
FROM node:18-slim AS node-build

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# -----------------------------------
# Stage 2: Download Tectonic binary
# -----------------------------------
FROM debian:bullseye-slim AS tectonic-build

RUN apt-get update && apt-get install -y curl xz-utils

# Download latest Tectonic bundle
RUN curl -L https://github.com/tectonic-typesetting/tectonic/releases/download/tectonic%400.13.0/tectonic-0.13.0-x86_64-unknown-linux-gnu.tar.xz \
    -o tectonic.tar.xz \
    && tar -xf tectonic.tar.xz \
    && mv tectonic /usr/local/bin/tectonic

# -----------------------------------
# Stage 3: Final Runtime
# -----------------------------------
FROM node:18-slim

WORKDIR /app

# Copy Node.js build
COPY --from=node-build /app /app

# Copy tectonic binary
COPY --from=tectonic-build /usr/local/bin/tectonic /usr/local/bin/tectonic

# Make sure tectonic is executable
RUN chmod +x /usr/local/bin/tectonic

EXPOSE 8080

CMD ["npm", "start"]
