const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const mongoURI = process.env.MONGO_URI;
if (!mongoURI) {
  console.error("CRITICAL ERROR: MONGO_URI environment variable is missing!");
  process.exit(1);
}

mongoose.connect(mongoURI)
  .then(() => console.log('Successfully connected to MongoDB Atlas.'))
  .catch(err => console.error('MongoDB connection error:', err));

// Event Schema & Model
const EventSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, index: true },
  eventType: { type: String, required: true },
  url: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  clickX: { type: Number }, // Percentage value (0 - 100)
  clickY: { type: Number }, // Percentage value (0 - 100)
  screenSize: { type: String }
});

const Event = mongoose.model('Event', EventSchema);

// 1. Ingest Event Endpoint
app.post('/api/events', async (req, res) => {
  try {
    const { sessionId, eventType, url, timestamp, clickX, clickY, screenSize } = req.body;
    
    if (!sessionId || !eventType || !url) {
      return res.status(400).json({ error: 'Missing required tracking fields.' });
    }

    const newEvent = new Event({
      sessionId,
      eventType,
      url,
      timestamp: timestamp ? new Date(timestamp) : new Date(),
      clickX,
      clickY,
      screenSize
    });

    await newEvent.save();
    res.status(201).json({ success: true, event: newEvent });
  } catch (err) {
    console.error('Error saving event:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 2. Fetch all unique sessions with aggregate event counts
app.get('/api/sessions', async (req, res) => {
  try {
    const sessions = await Event.aggregate([
      {
        $group: {
          _id: "$sessionId",
          totalEvents: { $sum: 1 },
          startedAt: { $min: "$timestamp" },
          lastActive: { $max: "$timestamp" },
          entryPage: { $first: "$url" }
        }
      },
      { $sort: { lastActive: -1 } }
    ]);
    res.json(sessions);
  } catch (err) {
    console.error('Error aggregate sessions:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 3. Fetch all timeline events for a specific session
app.get('/api/sessions/:sessionId', async (req, res) => {
  try {
    const events = await Event.find({ sessionId: req.params.sessionId })
      .sort({ timestamp: 1 });
    res.json(events);
  } catch (err) {
    console.error('Error fetching session details:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 4. Fetch click data specifically filtered by URL for visual mapping
app.get('/api/heatmap', async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) {
      return res.status(400).json({ error: 'URL parameter is required for heatmap query.' });
    }
    const clicks = await Event.find({ url, eventType: 'click' })
      .select('clickX clickY timestamp');
    res.json(clicks);
  } catch (err) {
    console.error('Error fetching heatmap data:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Base Route for Deployment Verification
app.get('/', (req, res) => {
  res.send('CausalFunnel Analytics API running smoothly.');
});

app.listen(PORT, () => {
  console.log(`Backend production server running on port ${PORT}`);
});
