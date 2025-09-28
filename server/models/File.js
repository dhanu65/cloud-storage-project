const mongoose = require('mongoose');
const FileSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  filename: { type: String, required: true },
  path: { type: String, required: true },
  parentFolder: { type: mongoose.Schema.Types.ObjectId, ref: 'Folder', default: null },
  uploadDate: { type: Date, default: Date.now },
});
module.exports = mongoose.model('File', FileSchema);