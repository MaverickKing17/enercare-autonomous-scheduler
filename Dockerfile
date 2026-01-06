# Step 1: Setup and Unzip
FROM node:20 AS builder
WORKDIR /app

# 1. Install the 'unzip' utility needed for the build
RUN apt-get update && apt-get install -y unzip && rm -rf /var/lib/apt/lists/*

# 2. Copy your zip file from the Space into the build container
# REPLACE 'project.zip' with the exact name from your screenshot
COPY project.zip .

# 3. Unzip the file and remove the zip to save space
RUN unzip project.zip && rm project.zip

# Step 2: Build the Enercare App
# Note: package.json must be in the top level of your zip
RUN npm install
RUN npm run build

# Step 3: Serve the App on Hugging Face
FROM node:20-slim
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
RUN npm install --omit=dev

# Hugging Face requires port 7860
EXPOSE 7860

# Start the Enercare Voice service
CMD ["npm", "run", "start"]
