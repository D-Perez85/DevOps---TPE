
const app = require('./app');
const PORT = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`CRUD en http://localhost:${PORT}`);
  });
}
module.exports = app; 
