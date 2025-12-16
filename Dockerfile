FROM node:lts

WORKDIR /app

# Copy package.json backend
COPY backend/package*.json ./

RUN npm install --production

# Copy semua source code backend
COPY backend/. .

ENV PORT=3000
EXPOSE 3000

CMD ["npm", "run", "start"]
