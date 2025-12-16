FROM node:lts

WORKDIR /app

# Copy package.json dari backend
COPY backend/package*.json ./

# Install semua dependency (termasuk dev, supaya ada prisma)
RUN npm install

# Copy seluruh source backend
COPY backend/. .

# Generate Prisma Client
RUN npx prisma generate

ENV PORT=3000
EXPOSE 3000

CMD ["npm", "run", "start"]
