import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import Error from './Error';




export default function OutbreakOraclePage() {
    const [airQuality, setAirQuality] = useState(null);
    const [weather, setWeather] = useState(null);
    const [city, setCity] = useState('Delhi');
    const [region, setRegion] = useState('India');
    const [analysisSummary, setAnalysisSummary] = useState(null);
    const [loading, setLoading] = useState(false);
    const { isDark, toggleTheme } = useTheme();
    const [storyMode, setStoryMode] = useState(true);
    const [storyStep, setStoryStep] = useState(0);
    const [hasError, setHasError] = useState(false);

    const [bgImage, setBgImage] = useState(null);


    const [isSpeaking, setIsSpeaking] = useState(false);
    const synthRef = useRef(window.speechSynthesis);

    const url = `https://api.pexels.com/v1/search?query=${city}&per_page=1`;
    const headers = { Authorization: import.meta.env.VITE_PEXELS_API_KEY };



    const fetchBgImage = async (weatherDesc) => {
        try {
            // Use both city and weather description for the query
            const query = `${city} ${weatherDesc}`;
            const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1`;
            const headers = { Authorization: import.meta.env.VITE_PEXELS_API_KEY };
            const res = await axios.get(url, { headers });
            const photo = res.data.photos?.[0]?.src?.large || null;
            setBgImage(photo);
        } catch (err) {
            setBgImage(null); // fallback if error
        }
    };

    // Fetch image when region changes
    // useEffect(() => {
    //     const handler = setTimeout(() => {
    //         if (city && city.trim().length > 0) {
    //             fetchBgImage();
    //         }
    //     }, 500); // 500ms debounce

    //     return () => clearTimeout(handler);
    // }, [city]);

    const storySteps = [
        {
            avatar: "🧑‍⚕️",
            text: "Welcome to Outbreak Oracle! I'm Dr. Ada, your health AI guide.",
        },
        {
            avatar: "🧑‍⚕️",
            text: "Enter your city and region above, then click 'Predict Outbreaks' to get started.",
        },
        {
            avatar: "🧑‍⚕️",
            text: "I'll analyze weather and air quality, then predict possible health risks for your area.",
        },
        {
            avatar: "🧑‍⚕️",
            text: "Check the color-coded alert level and read my recommendations to stay safe!",
        },
        {
            avatar: "🧑‍⚕️",
            text: "You can always restart Story Mode from the menu. Ready to begin?",
        },
    ];

    const handleNextStory = () => {
        if (storyStep < storySteps.length - 1) {
            setStoryStep(storyStep + 1);
        } else {
            setStoryMode(false);
        }
    };

    const handleSkipStory = () => setStoryMode(false);

    const speakAnalysis = () => {
        if (isSpeaking) {
            synthRef.current.cancel();
            setIsSpeaking(false);
            return;
        }
        if (!analysisSummary) return;
        synthRef.current.cancel();

        const utter = new window.SpeechSynthesisUtterance(
            analysisSummary.replace(/[*_~`#>\[\]\(\)]/g, '')
        );

        // Try to pick a more natural voice
        const voices = window.speechSynthesis.getVoices();
        console.log('Available voices:', voices);

        const preferredVoice = voices.find(
            v => v.name === "Samantha" || v.voiceURI === "com.apple.voice.compact.en-US.Samantha"
        );
        if (preferredVoice) {
            utter.voice = preferredVoice;
        }

        utter.rate = 0.98;
        utter.pitch = 1.08;
        utter.volume = 1;

        utter.onend = () => setIsSpeaking(false);
        utter.onerror = () => setIsSpeaking(false);
        setIsSpeaking(true);
        synthRef.current.speak(utter);
    };

    // Optional: Stop speech if user navigates away or summary changes
    useEffect(() => {
        return () => synthRef.current.cancel();
    }, [analysisSummary]);


    // useEffect(() => {
    //     fetchAllData();
    // }, []);

    const fetchAllData = async () => {
        setLoading(true);
        setHasError(false); // Reset error state
        try {

            // fetchBgImage();
            const geoRes = await axios.get(
                `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${import.meta.env.VITE_OPENWEATHER_API_KEY}&units=metric`
            );
            setWeather(geoRes.data);

            const weatherDesc = geoRes.data.weather?.[0]?.description || city;
            await fetchBgImage(weatherDesc);

            const airRes = await axios.get(
                `https://api.openweathermap.org/data/2.5/air_pollution?lat=${geoRes.data.coord.lat}&lon=${geoRes.data.coord.lon}&appid=${import.meta.env.VITE_OPENWEATHER_API_KEY}`
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
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${import.meta.env.VITE_GEMENI_API_KEY}`,
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
            setHasError(true);
            setAnalysisSummary(null);
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
        <div className={`min-h-screen transition-colors duration-300 p-6 ${isDark
            ? 'bg-gradient-to-br from-gray-900 to-gray-800 text-white'
            : 'bg-gradient-to-br from-blue-50 to-purple-100 text-gray-900'
            }`}>
            {storyMode && (
                <div
                    className={`fixed inset-0 flex items-center justify-center z-50 transition-colors duration-300 ${isDark
                            ? 'bg-black bg-opacity-80 text-white'
                            : 'bg-white bg-opacity-80 text-gray-900'
                        }`}
                    style={{
                        backdropFilter: 'blur(2px)',
                        WebkitBackdropFilter: 'blur(2px)',
                    }}
                >
                    <div
                        className={`max-w-md w-full rounded-xl shadow-lg p-6 text-center transition-colors duration-300 ${isDark ? 'bg-gray-900' : 'bg-white'
                            }`}
                    >
                        <div className="text-5xl mb-4">{storySteps[storyStep].avatar}</div>
                        <div className="text-lg mb-6">{storySteps[storyStep].text}</div>
                        <div className="flex justify-center gap-4">
                            <button
                                onClick={handleNextStory}
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                                {storyStep === storySteps.length - 1 ? "Let's Go!" : "Next"}
                            </button>
                            <button
                                onClick={handleSkipStory}
                                className={`px-4 py-2 rounded hover:bg-gray-400 ${isDark
                                        ? 'bg-gray-700 text-white'
                                        : 'bg-gray-300 text-gray-800'
                                    }`}
                            >
                                Skip
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <div className="flex justify-center gap-4 items-center mb-8">
                <h1 className="text-4xl font-bold">🧠 Outbreak Oracle</h1>
                <button
                    onClick={toggleTheme}
                    className={`p-1 rounded-full transition-colors duration-300 ${isDark
                        ? 'bg-yellow-500 hover:bg-yellow-400 text-gray-900'
                        : 'bg-gray-800 hover:bg-gray-700 text-white'
                        }`}
                    title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                >
                    {isDark ? '☀️' : '🌙'}
                </button>
            </div>

            <div className="flex flex-col md:flex-row gap-4 items-center justify-center mb-6">
                <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Enter City"
                    className={`px-4 py-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDark
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                        : 'bg-white border-gray-300 text-gray-900'
                        }`}
                />
                <input
                    type="text"
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    placeholder="Enter Region (e.g., India)"
                    className={`px-4 py-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDark
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                        : 'bg-white border-gray-300 text-gray-900'
                        }`}
                />
                <button
                    onClick={fetchAllData}
                    disabled={loading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors duration-300"
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
                <div className={`rounded-xl shadow-xl p-6 border-l-8 border-purple-500 ${isDark ? 'bg-gray-800' : 'bg-white'
                    }`}
                    style={bgImage ? {
                        backgroundImage: `url(${bgImage})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        color: isDark ? 'white' : 'black',
                        backgroundColor: isDark ? 'rgba(30,30,30,0.4)' : 'rgba(255,255,255,0.4)',
                        backgroundBlendMode: 'overlay',
                    } : {}}
                >
                    <h2 className="text-xl font-semibold text-purple-600 mb-2">Air Quality</h2>
                    <p className={isDark ? 'text-gray-100' : 'text-gray-900'}>
                        AQI: {airQuality?.main.aqi || 'Loading'} (1 = Good, 5 = Hazardous)
                    </p>
                    <div className="mt-2">
                        <div className={`text-sm ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                            CO: {airQuality?.components.co || 'N/A'} μg/m³
                        </div>
                        <div className={`text-sm ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                            PM2.5: {airQuality?.components.pm2_5 || 'N/A'} μg/m³
                        </div>
                    </div>
                </div>

                <div className={`rounded-xl shadow-xl p-6 border-l-8 border-blue-500 ${isDark ? 'bg-gray-800' : 'bg-white'
                    }`}
                    style={bgImage ? {
                        backgroundImage: `url(${bgImage})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        color: isDark ? 'white' : 'black',
                        backgroundColor: isDark ? 'rgba(30,30,30,0.4)' : 'rgba(255,255,255,0.4)',
                        backgroundBlendMode: 'overlay',
                    } : {}}
                >
                    <h2 className="text-xl font-semibold text-blue-600 mb-2">Weather</h2>
                    <div className={isDark ? 'text-gray-100' : 'text-gray-700'}>
                        {weather ? (
                            <>
                                Temp: {weather.main.temp}°C, {weather.weather[0].description}
                                <div className={`text-sm mt-1 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
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
                        <img
                            src="/gif.gif"
                            alt="Loading animation"
                            className="w-40 h-40 mx-auto mb-4 rounded-full shadow-lg border-4 border-blue-200"
                            draggable={false}
                        />
                        <p className={`mt-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                            Analyzing environmental data and predicting potential outbreaks...
                        </p>
                    </div>
                )}

                {!loading && hasError && (
                    <div className="max-w-6xl mx-auto">
                        <Error />
                    </div>
                )}

                {!loading && !hasError && analysisSummary && (
                    <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg overflow-hidden`}>
                        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 flex items-center justify-between">
                            <h3 className="text-lg font-semibold flex items-center">
                                <span className="mr-2">🤖</span>
                                AI Disease Outbreak Analysis
                            </h3>
                            <button
                                onClick={speakAnalysis}
                                className={`ml-4 px-3 py-1 rounded-full text-sm font-medium transition-colors duration-200 ${isSpeaking ? 'bg-gray-400' : 'bg-green-500 hover:bg-green-600'} text-white`}
                                title={isSpeaking ? "Stop playback" : "Listen to analysis"}
                            >
                                {isSpeaking ? '⏹️ Stop' : '🔊 Listen'}
                            </button>
                        </div>
                        <div className="p-6">
                            <div className={`${isDark ? 'prose prose-sm prose-invert text-gray-300' : 'prose prose-sm text-gray-700'} max-w-none leading-[2.5]`}>
                                <div
                                    dangerouslySetInnerHTML={{
                                        __html: analysisSummary
                                            ?.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                            ?.replace(/\*(.*?)\*/g, '<em>$1</em>')
                                            ?.replace(/\n\n/g, '</p><p>')
                                            ?.replace(/\n- /g, '</p><ul><li>')
                                            ?.replace(/\n(\d+)\. /g, '</p><ol><li>')
                                            ?.replace(/^/, '<p>')
                                            ?.replace(/$/, '</p>')
                                            ?.replace(/<p><\/p>/g, '')
                                            ?.replace(/<p><ul>/g, '<ul>')
                                            ?.replace(/<p><ol>/g, '<ol>')
                                            ?.replace(/<\/li><\/p>/g, '</li>')
                                            ?.replace(/(<li>.*?)(?=<li>|<\/ul>|<\/ol>)/g, '$1</li>')
                                    }}
                                />
                            </div>
                            <div className={`mt-4 pt-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                                <div className={`flex items-center text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                    <span className="mr-2">⚡</span>
                                    Powered by AI Analysis • Generated at {new Date().toLocaleTimeString()}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {!loading && !analysisSummary && (
                    <div className={`rounded-lg p-6 text-center ${isDark ? 'bg-gray-800' : 'bg-gray-50'
                        }`}>
                        <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                            Click "Predict Outbreaks" to get disease predictions for {city}.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}