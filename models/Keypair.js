const mongoose = require('mongoose');

const keypairSchema = new mongoose.Schema({
  name: String,
  keyD: Boolean
}, { timestamps: true });


const Keypair = mongoose.model('Keypair', keypairSchema);

module.exports = Keypair;
