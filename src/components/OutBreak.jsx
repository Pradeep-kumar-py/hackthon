import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import GeminiAnalyzer from './GemeniAnalyser';

export default function OutbreakOraclePage() {
  const [airQuality, setAirQuality] = useState(null);
  const [weather, setWeather] = useState(null);
  const [newsArticles, setNewsArticles] = useState([]);
  const [city, setCity] = useState('Delhi');
  const [region, setRegion] = useState('India');
  const [loading, setLoading] = useState(false);
  const [geminiAnalysis, setGeminiAnalysis] = useState(null);

  useEffect(() => {
    fetchAllData();
  }, [city, region]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      // Fetch weather data
      const geoRes = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=70afb6c6dcb6ddc2254e9cb765341486&units=metric`
      );
      setWeather(geoRes.data);

      // Fetch air quality data
      const airRes = await axios.get(
        `https://api.openweathermap.org/data/2.5/air_pollution?lat=${geoRes.data.coord.lat}&lon=${geoRes.data.coord.lon}&appid=70afb6c6dcb6ddc2254e9cb765341486`
      );
      setAirQuality(airRes.data.list[0]);

      // Fetch health-related news
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - 7);
      const formattedDate = fromDate.toISOString().split('T')[0];

      const query = `(dengue OR malaria OR flu OR fever OR outbreak OR disease OR epidemic) AND (${city} OR ${region})`;
      const newsRes = await axios.get(
        `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&from=${formattedDate}&sortBy=publishedAt&language=en&apiKey=15e51a0232514381b95372913e7fddd2`
      );
      
      const articles = newsRes.data.articles.slice(0, 10); // Get more articles for better analysis
      setNewsArticles(articles);
      setGeminiAnalysis(null); // Reset analysis when new data is fetched
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAlertLevel = () => {
    const aqi = airQuality?.main.aqi || 1;
    const analysisText = geminiAnalysis?.toLowerCase() || '';
    
    // Check Gemini analysis for risk indicators
    if (analysisText.includes('high risk') || analysisText.includes('risk level: high')) return 'High';
    if (analysisText.includes('moderate risk') || analysisText.includes('risk level: moderate')) return 'Moderate';
    
    // Check air quality
    if (aqi >= 4) return 'High';
    if (aqi >= 2) return 'Moderate';
    
    return 'Low';
  };

  const alertLevel = getAlertLevel();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 p-6">
      <h1 className="text-4xl font-bold text-center mb-8">🧠 Outbreak Oracle</h1>

      {/* City/Region Input */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-center mb-6">
        <input
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Enter City"
          className="px-4 py-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="text"
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          placeholder="Enter Region (e.g., India)"
          className="px-4 py-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={fetchAllData}
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Update'}
        </button>
      </div>

      {/* Environmental Data Cards */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="grid md:grid-cols-2 gap-6 max-w-6xl mx-auto mb-8"
      >
        <div className="bg-white rounded-xl shadow-xl p-6 border-l-8 border-purple-500">
          <h2 className="text-xl font-semibold text-purple-600 mb-2">Air Quality</h2>
          <p className="text-gray-600">
            AQI: {airQuality?.main.aqi || 'Loading...'} (1 = Good, 5 = Hazardous)
          </p>
          <div className="mt-2">
            <div className="text-sm text-gray-500">
              CO: {airQuality?.components.co || 'N/A'} μg/m³
            </div>
            <div className="text-sm text-gray-500">
              PM2.5: {airQuality?.components.pm2_5 || 'N/A'} μg/m³
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-xl p-6 border-l-8 border-blue-500">
          <h2 className="text-xl font-semibold text-blue-600 mb-2">Weather</h2>
          <p className="text-gray-600">
            {weather ? (
              <>
                Temp: {weather.main.temp}°C, {weather.weather[0].description}
                <div className="text-sm text-gray-500 mt-1">
                  Humidity: {weather.main.humidity}% | Pressure: {weather.main.pressure} hPa
                </div>
              </>
            ) : (
              'Loading...'
            )}
          </p>
        </div>
      </motion.div>

      {/* Alert Level */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className={`inline-block px-6 py-3 rounded-full text-white text-xl font-bold shadow-md ${
            alertLevel === 'High'
              ? 'bg-red-600'
              : alertLevel === 'Moderate'
              ? 'bg-yellow-500'
              : 'bg-green-500'
          }`}
        >
          Alert Level: {alertLevel}
        </motion.div>
      </div>

      {/* News Articles */}
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold mb-4">📰 Recent Health News in {city}</h2>
        
        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Fetching latest health information...</p>
          </div>
        )}

        {!loading && newsArticles.length === 0 && (
          <div className="bg-gray-50 rounded-lg p-6 text-center">
            <p className="text-gray-500">No recent health-related news found for {city}.</p>
          </div>
        )}

        {!loading && newsArticles.length > 0 && (
          <div className="space-y-4 mb-8">
            {newsArticles.slice(0, 5).map((article, idx) => (
              <div
                key={idx}
                className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow"
              >
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-lg font-semibold text-blue-600 hover:underline block"
                >
                  {article.title}
                </a>
                <p className="text-gray-600 text-sm mt-1">
                  {article.source.name} - {new Date(article.publishedAt).toLocaleDateString()}
                </p>
                <p className="text-gray-700 mt-2">{article.description}</p>
              </div>
            ))}
          </div>
        )}

        {/* Gemini Analysis */}
        {!loading && newsArticles.length > 0 && (
          <GeminiAnalyzer
            articles={newsArticles}
            city={city}
            onAnalysisComplete={setGeminiAnalysis}
          />
        )}
      </div>
    </div>
  );
}
