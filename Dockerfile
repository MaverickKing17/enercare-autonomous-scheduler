# Step 1: Build the Enercare App
FROM node:20 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Step 2: Serve the App on Hugging Face
FROM node:20-slim
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
RUN npm install --omit=dev

# Hugging Face uses port 7860
EXPOSE 7860

# Start the Enercare Voice service
CMD ["npm", "run", "start"]
