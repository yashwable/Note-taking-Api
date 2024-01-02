const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;


// MongoDB Connection Retry Function
function connectWithRetry() {
  return mongoose.connect('mongodb://127.0.0.1:27017/notesdb', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
      console.log('MongoDB connected successfully');
    })
    .catch((err) => {
      console.error('MongoDB connection error:', err.message);
      console.log('Retrying MongoDB connection in 5 seconds...');
      setTimeout(connectWithRetry, 5000);
    });
};

// Connect to MongoDB
connectWithRetry();

// Define Note Schema
const noteSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Note = mongoose.model('Note', noteSchema);

// Middleware
app.use(bodyParser.json());

// Create Note
app.post('/notes', async (req, res) => {
  try {
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required.' });
    }
    if (title.length > 255 || content.length > 1000) {
      return res.status(400).json({ error: 'Title and content should be within specified length limits.' });
    }

    const newNote = new Note({ title, content });
    await newNote.save();

    res.status(201).json(newNote);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Retrieve Notes
app.get('/notes', async (req, res) => {
  try {
    const notes = await Note.find();
    res.json(notes);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Retrieve Single Note by ID
app.get('/notes/:id', async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    res.json(note);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Update Note
app.put('/notes/:id', async (req, res) => {
  try {
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required.' });
    }

    const updatedNote = await Note.findByIdAndUpdate(req.params.id, { title, content, updatedAt: Date.now() }, { new: true });

    if (!updatedNote) {
      return res.status(404).json({ error: 'Note not found' });
    }

    res.json(updatedNote);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Delete Note
app.delete('/notes/:id', async (req, res) => {
  try {
    const deletedNote = await Note.findByIdAndDelete(req.params.id);

    if (!deletedNote) {
      return res.status(404).json({ error: 'Note not found' });
    }

    res.json(deletedNote);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
