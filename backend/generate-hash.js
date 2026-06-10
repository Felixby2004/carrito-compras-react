
const bcrypt = require('bcrypt');
async function main() {
  const hash = await bcrypt.hash('Admin123!', 10);
  console.log('Password: Admin123!');
  console.log('Hash:', hash);
}
main();
