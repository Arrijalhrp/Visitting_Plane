# Pakai image resmi Node LTS
FROM node:lts

# Set working directory di dalam container
WORKDIR /app

# Copy file package terlebih dulu (biar cache build kepakai)
COPY package*.json ./

# Install dependency (production saja kalau mau lebih ringan)
RUN npm install --production

# Copy semua source code
COPY . .

# Railway akan inject PORT, jadi pakai env PORT
ENV PORT=3000

# Expose port (opsional untuk Railway tapi bagus untuk dokumentasi)
EXPOSE 3000

# Command untuk menjalankan app
CMD ["npm", "run", "start"]
