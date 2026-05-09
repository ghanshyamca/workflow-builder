# Use pre-built dist from local build
FROM node:18-alpine

WORKDIR /app

# Install simple http server to serve static files
RUN npm install -g serve

# Copy pre-built dist folder
COPY dist ./dist

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3001/index.html || exit 1

# Expose port
EXPOSE 3001

# Start application
CMD ["serve", "-s", "dist", "-l", "3001"]
