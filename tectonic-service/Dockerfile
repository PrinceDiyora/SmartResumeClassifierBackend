FROM rekka/tectonic

# Install Node.js + npm on Debian/Ubuntu
RUN apt-get update && \
    apt-get install -y nodejs npm && \
    apt-get clean

WORKDIR /app

# Copy service files
COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 8080

CMD ["npm", "start"]
