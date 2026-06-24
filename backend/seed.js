const mongoose = require('mongoose');
require('dotenv').config();

const mongoURI = process.env.MONGO_URI;
if (!mongoURI) {
  console.error("Provide MONGO_URI in environment or .env configuration.");
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

// Helper function to generate Gaussian distributed cluster patterns for authentic heatmaps
function generateClusterPoint(baseX, baseY, variance) {
  const u1 = Math.random() || 0.0001; 
  const u2 = Math.random() || 0.0001;
  const standardNormal = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  return {
    x: parseFloat(Math.min(100, Math.max(0, baseX + standardNormal * variance)).toFixed(2)),
    y: parseFloat(Math.min(100, Math.max(0, baseY + standardNormal * variance)).toFixed(2))
  };
}

async function injectDataset() {
  console.log('Connecting to database cluster...');
  await mongoose.connect(mongoURI);
  
  // Wipe previous traces to ensure clean dashboard evaluation
  await Event.deleteMany({});
  console.log('Flushed existing collections. Re-building live dataset parameters...');

  const baseDomain = window?.location?.origin || 'http://localhost:5173';
  const targetRoutes = [
    `${baseDomain}/demo.html?page=home`,
    `${baseDomain}/demo.html?page=products`,
    `${baseDomain}/demo.html?page=cart`
  ];

  const devices = ['1440x900', '1920x1080', '375x812'];
  const generatedRecords = [];

  // Generate 25 distinct simulated multi-step user sessions
  for (let i = 0; i < 25; i++) {
    const sessionToken = `sess_usr_${Math.random().toString(36).substring(2, 9)}`;
    const sessionDevice = devices[Math.floor(Math.random() * devices.length)];
    let dynamicTimelineCursor = Date.now() - (Math.random() * 5 * 24 * 3600 * 1000); // Distributed over the last 5 days

    // Scenario A: User accesses homepage, checks a product, then drops or converts
    const visitedRoute = targetRoutes[0];
    
    // Step 1: Record Page Access
    generatedRecords.push({
      sessionId: sessionToken,
      eventType: 'page_view',
      url: visitedRoute,
      timestamp: new Date(dynamicTimelineCursor),
      screenSize: sessionDevice
    });

    // Step 2: Simulate concentrated clicks on the primary Call-To-Action (e.g., center buttons)
    const interactionCount = Math.floor(Math.random() * 4) + 2; 
    for(let j = 0; j < interactionCount; j++) {
      dynamicTimelineCursor += (Math.random() * 45000) + 10000; // incremental actions
      
      // Cluster coordinates around a specific UI zone (e.g., coordinates 22%, 16% matching navbar/buttons)
      const hotspot = generateClusterPoint(22.45, 16.20, 3.5);
      
      generatedRecords.push({
        sessionId: sessionToken,
        eventType: 'click',
        url: visitedRoute,
        timestamp: new Date(dynamicTimelineCursor),
        clickX: hotspot.x,
        clickY: hotspot.y,
        screenSize: sessionDevice
      });
    }

    // Step 3: Branch tracking into sub-routes (Simulating deep page conversions)
    if (Math.random() > 0.3) {
      const secondaryRoute = targetRoutes[1];
      dynamicTimelineCursor += 30000;
      
      generatedRecords.push({
        sessionId: sessionToken,
        eventType: 'page_view',
        url: secondaryRoute,
        timestamp: new Date(dynamicTimelineCursor),
        screenSize: sessionDevice
      });

      // Cluster clicks around item purchase buttons (e.g., coordinates 75%, 45%)
      const purchaseHotspot = generateClusterPoint(75.10, 45.80, 2.0);
      generatedRecords.push({
        sessionId: sessionToken,
        eventType: 'click',
        url: secondaryRoute,
        timestamp: new Date(dynamicTimelineCursor + 15000),
        clickX: purchaseHotspot.x,
        clickY: purchaseHotspot.y,
        screenSize: sessionDevice
      });
    }
  }

  await Event.insertMany(generatedRecords);
  console.log(`Database populated with ${generatedRecords.length} structured behavioral clickstream entries.`);
  process.exit(0);
}

injectDataset().catch(err => {
  console.error("Critical injection crash:", err);
  process.exit(1);
});
