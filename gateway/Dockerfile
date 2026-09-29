FROM node:20-bookworm-slim
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
COPY src/schema.graphql dist/
EXPOSE 3000
CMD ["node", "dist/main.js"]
