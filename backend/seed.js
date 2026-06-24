const mongoose = require('mongoose');
require('dotenv').config();

const mongoURI = process.env.MONGO_URI;
if (!mongoURI) {
  console.error("Provide MONGO_URI in a .env file to seed data.");
  process.exit(1);
}

const EventSchema = new mongoose.Schema({
  sessionId: String,
  eventType: String,
  url: String,
  timestamp: Date,
  clickX: Number,
  clickY: Number,
  screenSize: String
});
const Event = mongoose.model('Event', EventSchema);

async function seed() {
  await mongoose.connect(mongoURI);
  await Event.deleteMany({});

  const urls = ['https://demo-shop.com/', 'https://demo-shop.com/products', 'https://demo-shop.com/cart'];
  const sessions = ['sess_98231a', 'sess_44123b', 'sess_11094c', 'sess_77341d'];

  const events = [];

  sessions.forEach((sess, idx) => {
    let baseTime = Date.now() - (idx * 3600000);
    
    // Page View
    events.push({
      sessionId: sess,
      eventType: 'page_view',
      url: urls[0],
      timestamp: new Date(baseTime),
      screenSize: '1440x900'
    });

    // Clicks on Landing Page
    events.push({
      sessionId: sess,
      eventType: 'click',
      url: urls[0],
      timestamp: new Date(baseTime + 15000),
      clickX: 25 + Math.random() * 10,
      clickY: 40 + Math.random() * 15,
      screenSize: '1440x900'
    });

    events.push({
      sessionId: sess,
      eventType: 'click',
      url: urls[0],
      timestamp: new Date(baseTime + 30000),
      clickX: 70 + Math.random() * 10,
      clickY: 15 + Math.random() * 10,
      screenSize: '1440x900'
    });

    // Navigate to Products
    events.push({
      sessionId: sess,
      eventType: 'page_view',
      url: urls[1],
      timestamp: new Date(baseTime + 45000),
      screenSize: '1440x900'
    });

    events.push({
      sessionId: sess,
      eventType: 'click',
      url: urls[1],
      timestamp: new Date(baseTime + 80000),
      clickX: 45 + Math.random() * 10,
      clickY: 65 + Math.random() * 15,
      screenSize: '1440x900'
    });
  });

  await Event.insertMany(events);
  console.log('Database seeded with beautiful mock user tracks!');
  process.exit();
}

seed();
