FROM rekka/tectonic:latest

# Install Node.js for API
RUN apk add --no-cache nodejs npm

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 8080
CMD ["node", "server.js"]
