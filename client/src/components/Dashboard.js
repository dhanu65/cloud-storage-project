import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import './Dashboard.css';

const Dashboard = ({ onLogout }) => {
  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [currentFolder, setCurrentFolder] = useState(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const navigate = useNavigate();

  const fetchContent = useCallback(async (folderId = null) => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/auth'); return; }
    try {
      const url = folderId ? `http://localhost:5000/api/files/content/${folderId}` : 'http://localhost:5000/api/files/content';
      const config = { headers: { 'x-auth-token': token } };
      const res = await axios.get(url, config);
      setFolders(res.data.folders);
      setFiles(res.data.files);
      setCurrentFolder(folderId);
    } catch (err) {
      localStorage.removeItem('token');
      navigate('/auth');
    }
  }, [navigate]);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  const handleCreateFolder = async () => {
    if (!newFolderName) return toast.error('Please enter a folder name.');
    const token = localStorage.getItem('token');
    try {
      const config = { headers: { 'x-auth-token': token } };
      const body = { name: newFolderName, parentFolder: currentFolder };
      await axios.post('http://localhost:5000/api/files/folder', body, config);
      toast.success(`Folder "${newFolderName}" created!`);
      setNewFolderName('');
      fetchContent(currentFolder);
    } catch (err) {
      toast.error('Error creating folder.');
    }
  };

  const handleFileChange = (e) => setSelectedFile(e.target.files[0]);

  const handleUpload = async () => {
    if (!selectedFile) return toast.error('Please select a file first.');
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('file', selectedFile);
    if (currentFolder) { formData.append('parentFolder', currentFolder); }
    try {
      const config = { headers: { 'Content-Type': 'multipart/form-data', 'x-auth-token': token } };
      await axios.post('http://localhost:5000/api/files/upload', formData, config);
      toast.success('File uploaded successfully!');
      document.querySelector('input[type="file"]').value = '';
      setSelectedFile(null);
      fetchContent(currentFolder);
    } catch (err) {
      toast.error('Error uploading file.');
    }
  };
  
  const handleDelete = async (fileId) => {
    if (window.confirm('Are you sure you want to delete this file?')) {
      const token = localStorage.getItem('token');
      try {
        const config = { headers: { 'x-auth-token': token } };
        await axios.delete(`http://localhost:5000/api/files/${fileId}`, config);
        toast.success('File deleted successfully!');
        fetchContent(currentFolder);
      } catch (err) {
        toast.error('Error deleting file.');
      }
    }
  };

  const handleDeleteFolder = async (folderId) => {
    if (window.confirm('DELETE FOLDER? This deletes all contents inside it forever.')) {
      const token = localStorage.getItem('token');
      try {
        const config = { headers: { 'x-auth-token': token } };
        await axios.delete(`http://localhost:5000/api/files/folder/${folderId}`, config);
        toast.success('Folder deleted successfully!');
        fetchContent(currentFolder);
      } catch (err) {
        toast.error('Error deleting folder.');
      }
    }
  };

  const handleDownload = async (fileId, filename) => {
    const token = localStorage.getItem('token');
    try {
      const config = { headers: { 'x-auth-token': token }, responseType: 'blob' };
      const res = await axios.get(`http://localhost:5000/api/files/download/${fileId}`, config);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error('Could not download file.');
    }
  };

  const handleLogout = () => {
    onLogout();
    navigate('/auth');
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Dashboard</h2>
        <button onClick={handleLogout} className="btn btn-logout">Logout</button>
      </div>

      {currentFolder && <button onClick={() => fetchContent(null)} className="btn">Back to Home</button>}

      <div className="upload-section">
        <h3>Create New Folder</h3>
        <input type="text" placeholder="Folder Name" value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} />
        <button onClick={handleCreateFolder} className="btn btn-upload">Create Folder</button>
      </div>

      <div className="upload-section">
        <h3>Upload New File</h3>
        <input type="file" onChange={handleFileChange} />
        <button onClick={handleUpload} className="btn btn-upload">
          {currentFolder ? 'Upload to Current Folder' : 'Upload File'}
        </button>
      </div>
      
      <h3>Folders:</h3>
      {folders.length === 0 ? <p>No folders here.</p> : (
        <ul className="file-list">
          {folders.map(folder => (
            <li key={folder._id} className="file-item">
              <div className="folder-item" onClick={() => fetchContent(folder._id)} style={{ flexGrow: 1 }}>
                <span className="file-name">📁 {folder.name}</span>
              </div>
              <button onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folder._id); }} className="btn btn-delete">Delete</button>
            </li>
          ))}
        </ul>
      )}

      <h3>Files:</h3>
      {files.length === 0 ? <p>No files here.</p> : (
        <ul className="file-list">
          {files.map(file => (
            <li key={file._id} className="file-item">
              <span className="file-name">{file.filename}</span>
              <div>
                <button onClick={() => handleDownload(file._id, file.filename)} className="btn btn-download">Download</button>
                <button onClick={() => handleDelete(file._id)} className="btn btn-delete">Delete</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Dashboard;