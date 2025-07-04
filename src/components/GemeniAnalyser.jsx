import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';

export default function OutbreakOraclePage() {
    const [airQuality, setAirQuality] = useState(null);
    const [weather, setWeather] = useState(null);
    const [city, setCity] = useState('Delhi');
    const [region, setRegion] = useState('India');
    const [analysisSummary, setAnalysisSummary] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchAllData();
    }, [city, region]);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const geoRes = await axios.get(
                `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=70afb6c6dcb6ddc2254e9cb765341486&units=metric`
            );
            setWeather(geoRes.data);

            const airRes = await axios.get(
                `https://api.openweathermap.org/data/2.5/air_pollution?lat=${geoRes.data.coord.lat}&lon=${geoRes.data.coord.lon}&appid=70afb6c6dcb6ddc2254e9cb765341486`
            );
            setAirQuality(airRes.data.list[0]);

            // Get current season and environmental data for better prediction
            const currentMonth = new Date().getMonth() + 1;
            const season = getSeason(currentMonth);

            const summaryPrompt = `You are a health expert and epidemiologist. Based on the following environmental and geographical data, predict potential disease outbreaks for ${city}, ${region}:

Environmental Data:
- Temperature: ${geoRes.data.main.temp}°C
- Humidity: ${geoRes.data.main.humidity}%
- Weather: ${geoRes.data.weather[0].description}
- Air Quality Index: ${airRes.data.list[0].main.aqi} (1=Good, 5=Hazardous)
- PM2.5: ${airRes.data.list[0].components.pm2_5} μg/m³
- Current Season: ${season}
- Location: ${city}, ${region}

Please provide a comprehensive analysis including:
1. Most likely diseases/health risks for this location and season
2. Risk level assessment (High, Moderate, Low) for each potential outbreak
3. Environmental factors contributing to disease risks
4. Preventive measures and health recommendations
5. Vulnerable populations to watch out for

Format your response clearly with proper headings and bullet points.`;

            const geminiRes = await axios.post(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=AIzaSyAssNcQzQyz4cqJBaP6Kr77dYo77x3FTJM`,
                {
                    contents: [{ parts: [{ text: summaryPrompt }] }]
                },
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            const result = geminiRes.data.candidates[0]?.content?.parts[0]?.text || 'No analysis returned';
            setAnalysisSummary(result);
        } catch (error) {
            console.error('Error:', error);
            setAnalysisSummary('Error fetching disease prediction. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const getSeason = (month) => {
        if (month >= 3 && month <= 5) return 'Spring';
        if (month >= 6 && month <= 8) return 'Summer';
        if (month >= 9 && month <= 11) return 'Autumn';
        return 'Winter';
    };

    const getAlertLevel = () => {
        const aqi = airQuality?.main.aqi || 1;
        const analysisText = analysisSummary?.toLowerCase() || '';

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
                    {loading ? 'Analyzing...' : 'Predict Outbreaks'}
                </button>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="grid md:grid-cols-2 gap-6 max-w-6xl mx-auto mb-8"
            >
                <div className="bg-white rounded-xl shadow-xl p-6 border-l-8 border-purple-500">
                    <h2 className="text-xl font-semibold text-purple-600 mb-2">Air Quality</h2>
                    <p className="text-gray-600">
                        AQI: {airQuality?.main.aqi || 'Loading'} (1 = Good, 5 = Hazardous)
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
                    <div className="text-gray-600">
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
                    </div>
                </div>
            </motion.div>

            <div className="text-center mb-8">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className={`inline-block px-6 py-3 rounded-full text-white text-xl font-bold shadow-md ${alertLevel === 'High'
                            ? 'bg-red-600'
                            : alertLevel === 'Moderate'
                                ? 'bg-yellow-500'
                                : 'bg-green-500'
                        }`}
                >
                    Alert Level: {alertLevel}
                </motion.div>
            </div>

            <div className="max-w-6xl mx-auto">
                <h2 className="text-2xl font-bold mb-4">🔮 Disease Outbreak Predictions for {city}</h2>

                {loading && (
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Analyzing environmental data and predicting potential outbreaks...</p>
                    </div>
                )}

                {!loading && analysisSummary && (
                    <div className="bg-white rounded-lg shadow-lg p-6">
                        <div className="text-gray-700 whitespace-pre-line leading-relaxed">
                            {analysisSummary}
                        </div>
                    </div>
                )}

                {!loading && !analysisSummary && (
                    <div className="bg-gray-50 rounded-lg p-6 text-center">
                        <p className="text-gray-500">Click "Predict Outbreaks" to get disease predictions for {city}.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
