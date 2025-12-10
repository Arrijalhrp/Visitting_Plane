// Buat file hash.js lalu jalankan dengan node hash.js
const bcrypt = require('bcrypt');
bcrypt.hash('admin123', 10, function(err, hash) {
  if (err) throw err;
  console.log(hash);
});
