const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// ─── Middleware ───────────────────────────────────────────────
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Routes ───────────────────────────────────────────────────
const db = require('./config/db');
const smsRoute = require('./routes/SmsRoutes');
const userRoutes = require('./routes/UserRoutes');
const barnRoutes = require('./routes/BarnRoutes');
const harvestRoutes = require('./routes/HarvestRoutes');
const batchRoutes = require('./routes/BatchRoutes');
const mortalityRoutes = require('./routes/MortalityRoutes');
const dailylogsRoutes = require('./routes/DailyLogsRoutes');
const growthTrackingRoutes = require('./routes/GrowthTrackingRoutes');
const harvestDataRoutes = require('./routes/HarvestDataRoutes');
const mortalityDataRoutes = require('./routes/MortalityDataRoutes');
const monthlyForecastRoutes = require('./routes/ForecastRoutes');
const sensorRoutes = require('./routes/SensorRoutes');
const reportRoutes = require('./routes/ReportRoutes');

app.use('/api/sms', smsRoute);
app.use('/api/user', userRoutes);
app.use('/api/barn', barnRoutes);
app.use('/api/harvest', harvestRoutes);
app.use('/api/batch', batchRoutes);
app.use('/api/mortality', mortalityRoutes);
app.use('/api/daily_logs', dailylogsRoutes);
app.use('/api/growth_tracking', growthTrackingRoutes);
app.use('/api/harvest_data', harvestDataRoutes);
app.use('/api/mortality_data', mortalityDataRoutes);
app.use('/api/monthly_forecast', monthlyForecastRoutes);
app.use('/api/sensor', sensorRoutes);
app.use('/api/reports', reportRoutes);

app.get('/', (req, res) => res.json("Starting Node Server.."));

// ─── Start Server ─────────────────────────────────────────────
const PORT = process.env.PORT || 8081;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));