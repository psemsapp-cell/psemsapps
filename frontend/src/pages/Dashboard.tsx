import React, { useEffect, useState } from 'react';
import { Thermometer, Droplets, Wind, Activity, Bell } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import MetricCard from '../components/MetricCard';
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue } from "firebase/database";
import { createPortal } from 'react-dom';

const firebaseConfig = {
  databaseURL: "https://psemsapp-6ea85-default-rtdb.asia-southeast1.firebasedatabase.app",
};
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const Dashboard: React.FC = () => {

  const [harvestData, setHarvestData] = useState([]);
  const [mortalityData, setMortalityData] = useState([]);

  // ─── Fix 1: Notifications persisted in localStorage (7-day filter) ─────────
  const [notifications, setNotifications] = useState<{type: string, message: string, time: Date, isActive?: boolean}[]>(() => {
    const saved = localStorage.getItem('psems_notifications');
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return parsed
      .filter((n: any) => new Date(n.time).getTime() > sevenDaysAgo)
      .map((n: any) => ({ ...n, time: new Date(n.time) }));
  });

  const addNotification = (type: string, message: string) => {
  setNotifications(prev => {
    const newEntry = { type, message, time: new Date(), isActive: true };
    const updated = [newEntry, ...prev];
    localStorage.setItem('psems_notifications', JSON.stringify(updated));
    return updated;
  });
};

  const apiUrl = import.meta.env.VITE_API_URL;
  const currentUserId = localStorage.getItem('user_id');

  const sendSMSNotification = async (message: string) => {
    const phoneNumber = '+639941680185';
    const cooldownMinutes = 7;

    const lastSent = localStorage.getItem('last_sms_sent');
    const now = Date.now();

    if (lastSent) {
      const elapsedMinutes = (now - Number(lastSent)) / 1000 / 60;
      if (elapsedMinutes < cooldownMinutes) {
        console.log(`⏳ SMS blocked – wait ${Math.ceil(cooldownMinutes - elapsedMinutes)} more minutes.`);
        return;
      }
    }

    const professionalMessage = `
Good day from PSEMS!
Notification: ${message}

Please check your device or system promptly.
Thank you for using PSEMS.
    `.trim();

    try {
      const res = await fetch(`${apiUrl}/api/sms/send-sms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phoneNumber,
          message: professionalMessage,
          sender: 'PSEMS SMART BOT'
        })
      });
      const text = await res.text();
      try {
        const data = JSON.parse(text);
        console.log('SMS sent:', data);
      } catch {
        console.error('SMS server error (non-JSON response):', text.slice(0, 200));
      }
      localStorage.setItem('last_sms_sent', String(now));
    } catch (err) {
      console.error('Failed to send SMS:', err);
    }
  };

  // ─── Harvest Data ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!currentUserId) return;

    fetch(`${apiUrl}/api/harvest_data/${currentUserId}`)
      .then(res => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then(data => {
        const formatted = data
          .map((item: any) => ({
            batch:    item.batch_name ?? item.batch ?? item.batchName ?? null,
            barn:     item.barn_name  ?? item.barn  ?? item.barnName  ?? '',
            chickens: item.no_harvest ?? item.chickens ?? item.harvested_chickens ?? 0,
            boxes:    item.no_boxes   ?? item.boxes    ?? item.harvested_boxes    ?? 0,
          }))
          .filter((item: any) => item.batch !== null && item.batch !== '');

        setHarvestData(formatted);
      })
      .catch(err => console.error('Error fetching harvest data:', err));
  }, [apiUrl, currentUserId]);

  // ─── Mortality Data ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!currentUserId) return;

    fetch(`${apiUrl}/api/mortality_data/${currentUserId}`)
      .then(res => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then(data => {
        const formatted = data
          .map((item: any) => ({
            barn:      item.barn_name ?? item.barn ?? item.barnName ?? null,
            mortality: item.quantity  ?? item.mortality_count ?? item.mortality ?? 0,
            cause:     item.cause ?? '',
          }))
          .filter((item: any) => item.barn !== null && item.barn !== '');

        setMortalityData(formatted);
      })
      .catch(err => console.error('Error fetching mortality data:', err));
  }, [apiUrl, currentUserId]);

  // ─── Forecast Data ─────────────────────────────────────────────────────────
  const [forecastData, setForecastData] = useState([]);
  const [forecastFilters, setForecastFilters] = useState({
    startDate: '',
    endDate: '',
    batchId: '',
    breed: '',
  });

  useEffect(() => {
    const params = new URLSearchParams(
      Object.entries(forecastFilters).filter(([_, v]) => v !== '')
    ).toString();

    fetch(`${apiUrl}/api/monthly_forecast?${params}`)
      .then(res => res.json())
      .then(data => setForecastData(data))
      .catch(err => console.error('Error fetching forecast:', err));
  }, [apiUrl, forecastFilters]);

  // ─── Environment Data ──────────────────────────────────────────────────────
  const [envData, setEnvData] = useState({
    temperature: 0,
    humidity: 0,
    nh3: 0,
    co2: 0,
  });

  useEffect(() => {
    const envRef = ref(db, "environment");
    onValue(envRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setEnvData({
          temperature: data.temperature,
          humidity: data.humidity,
          nh3: data.nh3,
          co2: data.co2,
        });
      }
    });
  }, []);

  // ─── Sensor State ──────────────────────────────────────────────────────────
  type Sensor = {
    value: number;
    status: Status;
    updatedAt?: Date;
  };

  type SensorData = {
    temperature: Sensor;
    humidity: Sensor;
    ammonia: Sensor;
    carbon: Sensor;
  };

  const [sensorData, setSensorData] = useState<SensorData>({
    temperature: { value: 0, status: 'Normal - 18°C to 30°C', updatedAt: undefined },
    humidity:    { value: 0, status: 'Normal - 50% to 70%', updatedAt: undefined },
    ammonia:     { value: 0, status: 'Ideal (Safe) - Best condition. No harm to poultry or workers. Promotes healthy growth & respiration', updatedAt: undefined },
    carbon:      { value: 0, status: 'Safe - Normal ventilation', updatedAt: undefined },
  });

  type Status =
    | 'Normal - 18°C to 30°C'
    | 'Harmful - May cause stress or illness'
    | 'Harmful - Risk of heat stress or death'
    | 'Normal - 50% to 70%'
    | 'Warning - May cause dehydration, respiratory stress, poor air quality'
    | 'Warning - Increased risk of disease'
    | 'Safe - Normal ventilation'
    | 'Ventilation should be improved; Acceptable short-term - Mild stress'
    | 'Hazardous - Respiratory distress; immediate ventilation improvement is required'
    | 'Ideal (Safe) - Best condition. No harm to poultry or workers. Promotes healthy growth & respiration'
    | 'Acceptable (Not Ideal) - Prolonged exposure may cause mild stress or irritation. Improve litter/ventilation'
    | 'Harmful - Unsafe. Risk of respiratory disease, eye irritation, poor growth. Immediate action needed';

  const classifyStatus = (type: string, value: number): Status => {
    switch (type) {
      case 'temperature':
        if (value < 18) return 'Harmful - May cause stress or illness';
        if (value > 30) return 'Harmful - Risk of heat stress or death';
        return 'Normal - 18°C to 30°C';
      case 'humidity':
        if (value < 50) return 'Warning - May cause dehydration, respiratory stress, poor air quality';
        if (value > 70) return 'Warning - Increased risk of disease';
        return 'Normal - 50% to 70%';
      case 'co2':
        if (value >= 3000) return 'Hazardous - Respiratory distress; immediate ventilation improvement is required';
        if (value >= 2500) return 'Ventilation should be improved; Acceptable short-term - Mild stress';
        return 'Safe - Normal ventilation';
      case 'nh3':
        if (value > 25) return 'Harmful - Unsafe. Risk of respiratory disease, eye irritation, poor growth. Immediate action needed';
        if (value > 10) return 'Acceptable (Not Ideal) - Prolonged exposure may cause mild stress or irritation. Improve litter/ventilation';
        return 'Ideal (Safe) - Best condition. No harm to poultry or workers. Promotes healthy growth & respiration';
      default:
        return 'Normal - 18°C to 30°C';
    }
  };

  // ─── Firebase Listener ─────────────────────────────────────────────────────
  useEffect(() => {
    const envRef = ref(db, 'environment');
    const connectedRef = ref(db, '.info/connected');

    const unsubscribeEnv = onValue(envRef, snapshot => {
      const data = snapshot.val();
      if (!data) return;

      setEnvData(data);

      const sensors: (keyof SensorData)[] = ['temperature', 'humidity', 'ammonia', 'carbon'];
      const newSensorData: SensorData = { ...sensorData };

      sensors.forEach(sensor => {
        const key = sensor === 'ammonia' ? 'nh3' : sensor === 'carbon' ? 'co2' : sensor;
        const value = data[key];
        const status = classifyStatus(key, value);
        newSensorData[sensor] = {
          value,
          status,
          updatedAt: !status.includes('Normal') && !status.includes('Safe') && !status.includes('Ideal')
            ? new Date()
            : undefined
        };

        // ─── Fix 1: Also log to persistent notifications ───────────────────
        if (!status.includes('Normal') && !status.includes('Safe') && !status.includes('Ideal')) {
          sendSMSNotification(`${sensor.toUpperCase()} is ${status}! Value: ${value}`);
          addNotification(sensor, `${status} — Value: ${value}`);
        }
      });

      setSensorData(newSensorData);
    });

    const unsubscribeConnected = onValue(connectedRef, snapshot => {
      if (snapshot.val() === false) {
        sendSMSNotification('Device is offline!');
        addNotification('system', 'Device is offline!');
      }
    });

    return () => {
      unsubscribeEnv();
      unsubscribeConnected();
    };
  }, []);

const getAlertCount = (sensorData: any) => {
  return notifications.filter(n => n.isActive !== false).length;
};

  const [showNotifications, setShowNotifications] = useState(false);
  const toggleNotifications = () => setShowNotifications(prev => !prev);

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 px-4 md:px-6 lg:px-8">

      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Dashboard</h1>
        <div className="relative">
          <Bell className="h-6 w-6 text-gray-600 cursor-pointer" onClick={toggleNotifications} />
          {getAlertCount(sensorData) > 0 && (
            <>
              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full px-1.5">
                {getAlertCount(sensorData)}
              </span>
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
            </>
          )}
        </div>
      </div>

      {/* Fix 2: Notification Modal — full-screen backdrop with explicit positioning */}
      {showNotifications && createPortal(
  <div
    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    onClick={() => setShowNotifications(false)}
  >
    <div
      className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 flex flex-col"
      style={{ maxHeight: '80vh' }}
      onClick={e => e.stopPropagation()}
    >
      {/* Modal Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <h2 className="text-2xl font-bold text-gray-900">Notifications</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const cleared = notifications.map(n => ({ ...n, isActive: false }));
              setNotifications(cleared);
              localStorage.setItem('psems_notifications', JSON.stringify(cleared));
            }}
            className="text-sm text-red-500 hover:text-red-700 font-medium px-3 py-1 border border-red-300 rounded-lg"
          >Clear All</button>
          <button
            onClick={() => setShowNotifications(false)}
            className="bg-red-500 hover:bg-red-600 text-white rounded-lg w-9 h-9 flex items-center justify-center text-lg font-bold"
          >✕</button>
        </div>
      </div>

      {/* Tabs */}
      {(() => {
        const [activeTab, setActiveTab] = React.useState<'active' | 'history'>('active');
        const activeList = notifications.filter(n => n.isActive !== false);
        const historyList = notifications.filter(n => n.isActive === false);
        const displayed = activeTab === 'active' ? activeList : historyList;

        return (
          <>
            <div className="flex border-b border-gray-100 px-6">
              <button
                onClick={() => setActiveTab('active')}
                className={`py-3 px-4 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'active' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500'}`}
              >
                Active Notifications ({activeList.length})
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`py-3 px-4 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'history' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500'}`}
              >
                History ({historyList.length})
              </button>
            </div>

            <div className="overflow-y-auto flex-1 px-4 py-3 space-y-3">
              {displayed.length === 0 && (
                <p className="text-center text-gray-400 py-8">
                  {activeTab === 'active' ? 'No active alerts 🎉' : 'No history yet'}
                </p>
              )}
              {displayed.map((n, i) => {
                const borderColor = n.type === 'temperature' ? 'border-orange-400'
                  : n.type === 'humidity' ? 'border-blue-400'
                  : n.type === 'ammonia' ? 'border-yellow-400'
                  : 'border-green-400';
                const label = n.type === 'temperature' ? 'Temperature Alert'
                  : n.type === 'humidity' ? 'Humidity Alert'
                  : n.type === 'ammonia' ? 'Ammonia Alert'
                  : n.type === 'system' ? 'System Alert'
                  : 'CO₂ Alert';

                return (
                  <div key={i} className={`border-l-4 ${borderColor} pl-4 py-3 bg-gray-50 rounded-r-lg`}>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-800 text-sm">{label}</span>
                      <span className="text-xs text-gray-400">{new Date(n.time).toLocaleString()}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{n.message}</p>
                  </div>
                );
              })}
            </div>
          </>
        );
      })()}
    </div>
  </div>,
  document.body
)}

      {/* Environmental Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <MetricCard title="Temperature" value={envData.temperature ?? 0} unit="°C" status={sensorData.temperature.status} icon={Thermometer} color="red" trend={{ value: 2.1, isPositive: true }} />
        <MetricCard title="Humidity" value={envData.humidity ?? 0} unit="%" status={sensorData.humidity.status} icon={Droplets} color="blue" trend={{ value: 1.5, isPositive: false }} />
        <MetricCard title="Ammonia" value={envData.nh3 ?? 0} unit="ppm" status={sensorData.ammonia.status} icon={Wind} color="yellow" trend={{ value: 0.8, isPositive: false }} />
        <MetricCard title="CO₂" value={envData.co2 ?? 0} unit="ppm" status={sensorData.carbon.status} icon={Activity} color="green" trend={{ value: 3.2, isPositive: true }} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6 overflow-x-auto">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Harvest Data</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={harvestData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="batch" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="chickens" fill="#3B82F6" name="Chickens" />
              <Bar dataKey="boxes" fill="#10B981" name="Boxes" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6 overflow-x-auto">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Mortality Data by Batch</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={mortalityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="barn" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="mortality" fill="#EF4444" name="Mortality" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Forecast Filters */}
      <div className="bg-white rounded-lg border p-4 mb-4 grid grid-cols-1 md:grid-cols-4 gap-4">
        <input
          type="date"
          className="border rounded px-3 py-2"
          onChange={e => setForecastFilters({ ...forecastFilters, startDate: e.target.value })}
        />
        <input
          type="date"
          className="border rounded px-3 py-2"
          onChange={e => setForecastFilters({ ...forecastFilters, endDate: e.target.value })}
        />
        <select
          className="border rounded px-3 py-2"
          onChange={e => setForecastFilters({ ...forecastFilters, batchId: e.target.value })}
        >
          <option value="">All Batches</option>
         {Array.from(
  new Map(forecastData.map((f: any) => [f.batchId, f.batch])).entries()
).map(([id, name]) => (
  <option key={id} value={id}>{name}</option>
))}
        </select>
        <select
          className="border rounded px-3 py-2"
          onChange={e => setForecastFilters({ ...forecastFilters, breed: e.target.value })}
        >
          <option value="">All Breeds</option>
          {Array.from(new Set(forecastData.map((f: any) => f.breed))).map(breed => (
            <option key={breed} value={breed}>{breed}</option>
          ))}
        </select>
      </div>

      {/* Monthly Forecast Chart */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100 p-4 md:p-6 overflow-x-auto">
        <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">Monthly Forecast: Mortality & Harvest</h3>
        <p className="text-sm md:text-base text-gray-500 mb-6">Actual and predicted figures for each month</p>
        <ResponsiveContainer width="100%" height={420}>
          <LineChart data={forecastData} margin={{ top: 20, right: 30, left: 10, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 13, fill: '#4b5563', fontWeight: 500 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 13, fill: '#4b5563', fontWeight: 500 }} />
            <Tooltip
              formatter={(value, name, props: any) => [
                value,
                `${name} | ${props.payload.batch} (${props.payload.breed})`
              ]}
            />
            <Legend verticalAlign="top" align="center" iconType="circle" wrapperStyle={{ paddingBottom: 10 }} />
            <Line type="monotone" dataKey="actualMortality"    stroke="#dc2626" strokeWidth={1.5} dot={{ r: 3, fill: '#dc2626' }} />
            <Line type="monotone" dataKey="predictedMortality" stroke="#2563eb" strokeWidth={1.5} strokeDasharray="5 5" dot={{ r: 3, fill: '#2563eb' }} />
            <Line type="monotone" dataKey="actualHarvest"      stroke="#16a34a" strokeWidth={1.5} dot={{ r: 3, fill: '#16a34a' }} />
            <Line type="monotone" dataKey="predictedHarvest"   stroke="#facc15" strokeWidth={1.5} strokeDasharray="5 5" dot={{ r: 3, fill: '#facc15' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
};

export default Dashboard;