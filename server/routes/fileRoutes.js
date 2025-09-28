const express = require('express');
const router = express.Router();
const multer = require('multer');
const { PutObjectCommand, DeleteObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const auth = require('../middleware/authMiddleware');
const File = require('../models/File');
const Folder = require('../models/Folder');
const s3Client = require('../config/s3Client');

// Configure multer to store files in memory
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// GET content of root folder
router.get('/content', auth, async (req, res) => {
  try {
    const folders = await Folder.find({ user: req.user.id, parentFolder: null });
    const files = await File.find({ user: req.user.id, parentFolder: null });
    res.json({ folders, files });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// GET content of a specific folder
router.get('/content/:folderId', auth, async (req, res) => {
  try {
    const parentFolder = req.params.folderId;
    const folders = await Folder.find({ user: req.user.id, parentFolder: parentFolder });
    const files = await File.find({ user: req.user.id, parentFolder: parentFolder });
    res.json({ folders, files });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// POST to create a new folder
router.post('/folder', auth, async (req, res) => {
    const { name, parentFolder } = req.body;
    try {
        const newFolder = new Folder({ name, parentFolder: parentFolder || null, user: req.user.id });
        const folder = await newFolder.save();
        res.status(201).json(folder);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// POST to upload a new file
router.post('/upload', [auth, upload.single('file')], async (req, res) => {
  if (!req.file) return res.status(400).json({ msg: 'No file uploaded.' });
  const { parentFolder } = req.body;
  const fileNameKey = `${Date.now()}-${req.file.originalname}`;
  const bucketName = process.env.B2_BUCKET_NAME;
  const params = { Bucket: bucketName, Key: fileNameKey, Body: req.file.buffer, ContentType: req.file.mimetype };
  try {
    await s3Client.send(new PutObjectCommand(params));
    const fileUrl = `https://${bucketName}.${process.env.B2_ENDPOINT_DOMAIN}/${fileNameKey}`;
    const newFile = new File({ user: req.user.id, filename: req.file.originalname, path: fileUrl, parentFolder: parentFolder || null });
    await newFile.save();
    res.status(201).json(newFile);
  } catch (err) {
    console.error('Error uploading file:', err);
    res.status(500).send('Server Error');
  }
});

// DELETE a file
router.delete('/:id', auth, async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file || file.user.toString() !== req.user.id) { return res.status(404).json({ msg: 'File not found' }); }
    const bucketName = process.env.B2_BUCKET_NAME;
    const fileNameKey = file.path.split('/').pop();
    const params = { Bucket: bucketName, Key: fileNameKey };
    await s3Client.send(new DeleteObjectCommand(params));
    await File.deleteOne({ _id: req.params.id });
    res.json({ msg: 'File deleted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// GET to download a file
router.get('/download/:id', auth, async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file || file.user.toString() !== req.user.id) { return res.status(404).json({ msg: 'File not found' }); }
    const bucketName = process.env.B2_BUCKET_NAME;
    const fileNameKey = file.path.split('/').pop();
    const command = new GetObjectCommand({ Bucket: bucketName, Key: fileNameKey });
    const { Body, ContentType } = await s3Client.send(command);
    res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
    res.setHeader('Content-Type', ContentType);
    Body.pipe(res);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// DELETE a folder and all its contents
router.delete('/folder/:folderId', auth, async (req, res) => {
  try {
    const folderId = req.params.folderId;
    const userId = req.user.id;
    const deleteFolderContents = async (currentFolderId) => {
      const files = await File.find({ user: userId, parentFolder: currentFolderId });
      for (const file of files) {
        const bucketName = process.env.B2_BUCKET_NAME;
        const fileNameKey = file.path.split('/').pop();
        await s3Client.send(new DeleteObjectCommand({ Bucket: bucketName, Key: fileNameKey }));
        await File.deleteOne({ _id: file._id });
      }
      const subFolders = await Folder.find({ user: userId, parentFolder: currentFolderId });
      for (const subFolder of subFolders) {
        await deleteFolderContents(subFolder._id);
      }
      await Folder.deleteOne({ _id: currentFolderId, user: userId });
    };
    await deleteFolderContents(folderId);
    res.json({ msg: 'Folder and its contents deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;