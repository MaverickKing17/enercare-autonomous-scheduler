# Step 1: Setup and Unzip
FROM node:20 AS builder
WORKDIR /app

# 1. Install the 'unzip' utility
RUN apt-get update && apt-get install -y unzip && rm -rf /var/lib/apt/lists/*

# 2. Copy your zip file into the container
# Replace 'project.zip' with the actual name of your zip file
COPY project.zip .

# 3. Unzip the file into the current directory
RUN unzip project.zip && rm project.zip

# Step 2: Build the Enercare App
# Note: Ensure package.json is now in the /app folder after unzipping
RUN npm install
RUN npm run build

# Step 3: Serve the App on Hugging Face
FROM node:20-slim
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./\nRUN npm install --omit=dev

# Hugging Face uses port 7860
EXPOSE 7860

# Start the Enercare Voice service
CMD ["npm", "run", "start"]
