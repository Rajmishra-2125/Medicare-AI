FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy application source
COPY . .

# Expose the API port
EXPOSE 8001

# Healthcheck to verify server is active and responding correctly
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8001/api/v1/healthcheck || exit 1

# Start the application using Node (or PM2 if installed globally in the container)
CMD ["npm", "run", "start"]
