# -----------------------------------
# Stage 1: Node.js app
# -----------------------------------
FROM node:18-slim AS node-build

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# -----------------------------------
# Stage 2: Download Tectonic
# -----------------------------------
FROM debian:bullseye-slim AS tectonic-build

RUN apt-get update && apt-get install -y curl tar gzip

# Download Tectonic .tar.gz
RUN curl -L \
  https://github.com/tectonic-typesetting/tectonic/releases/download/tectonic%400.15.0/tectonic-0.15.0-x86_64-unknown-linux-gnu.tar.gz \
  -o tectonic.tar.gz

# Extract
RUN tar -xzf tectonic.tar.gz && \
    mv tectonic-0.15.0-x86_64-unknown-linux-gnu/tectonic /usr/local/bin/tectonic

# -----------------------------------
# Stage 3: Final Runtime
# -----------------------------------
FROM node:18-slim

WORKDIR /app

COPY --from=node-build /app /app
COPY --from=tectonic-build /usr/local/bin/tectonic /usr/local/bin/tectonic

RUN chmod +x /usr/local/bin/tectonic

EXPOSE 8080
CMD ["npm", "start"]
