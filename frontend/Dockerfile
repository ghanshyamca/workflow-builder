FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

ARG VITE_API_BASE_URL=http://localhost:3000/api
ARG VITE_WS_URL=ws://localhost:3000
ARG VITE_APP_NAME=Workflow Builder

ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_WS_URL=${VITE_WS_URL}
ENV VITE_APP_NAME=${VITE_APP_NAME}

RUN npm run build

FROM node:18-alpine

WORKDIR /app

RUN npm install -g serve && apk add --no-cache dumb-init

COPY --from=builder /app/dist ./dist

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3001/index.html || exit 1

EXPOSE 3001

ENTRYPOINT ["dumb-init", "--"]

CMD ["serve", "-s", "dist", "-l", "3001"]
