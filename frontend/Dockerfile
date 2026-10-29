FROM node:20-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci
# .dockerignore excludes node_modules/.next/.git so this COPY does not clash with install
COPY . .
EXPOSE 3010
CMD ["npm", "run", "dev"]
