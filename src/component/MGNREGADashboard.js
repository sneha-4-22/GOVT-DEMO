import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { MapPin, TrendingUp, Users, Calendar, Info, AlertCircle, RefreshCw, Globe } from 'lucide-react';
import { Client, Databases, Query } from 'appwrite';

const MGNREGADashboard = () => {
  const [districts, setDistricts] = useState([]);
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [districtData, setDistrictData] = useState(null);
  const [historicalData, setHistoricalData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [showInfo, setShowInfo] = useState({});
  const [error, setError] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [language, setLanguage] = useState('en'); // 'en' or 'hi'

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];
  const BACKEND_URL = 'https://govt-server-qn4u.onrender.com';
  // Translation object
  const t = {
    en: {
      title: 'MGNREGA Dashboard',
      subtitle: 'View Your District Performance',
      state: 'Uttar Pradesh',
      selectDistrict: 'Select District',
      chooseDistrict: 'Choose District',
      locationDetected: 'Location Detected',
      loadingData: 'Loading Data...',
      districtLabel: 'District',
      performanceReport: 'MGNREGA Performance Report',
      syncData: 'Sync Data',
      syncing: 'Syncing...',
      changeDistrict: 'Change District',
      overallPerformance: 'Overall Performance',
      employmentRate: 'Employment Provided Rate',
      employmentProvided: 'of demanded employment provided',
      totalHouseholds: 'Total Households',
      householdsInfo: 'Number of households registered under MGNREGA in the district',
      jobCards: 'Job Cards',
      issued: 'Issued',
      jobCardsInfo: 'Cards issued to get employment',
      personDays: 'Person-Days',
      generated: 'Generated',
      personDaysInfo: 'Total days of employment generated (all people)',
      expenditure: 'Expenditure',
      crores: 'Crores',
      expenditureInfo: 'Total expenditure on MGNREGA in the district',
      demandVsSupply: 'Employment Demand vs Supply',
      demanded: 'Demanded',
      provided: 'Provided',
      familiesNeedEmployment: 'families still need employment',
      allDemandFulfilled: 'All demand fulfilled',
      workProgress: 'Work Progress',
      completed: 'Completed',
      ongoing: 'Ongoing',
      worksCompleted: 'Works Completed',
      historicalTrend: 'Historical Trend (Last 5 Years)',
      employment: 'Employment',
      whatIsMGNREGA: 'What is MGNREGA?',
      mgnregaDesc: 'The Mahatma Gandhi National Rural Employment Guarantee Act (MGNREGA) is a Government of India scheme that guarantees 100 days of employment in a financial year to every rural household.',
      poweredBy: 'Powered by Appwrite Cloud | Data stored securely',
      errorLoading: 'Error loading data'
    },
    hi: {
      title: 'मनरेगा डैशबोर्ड',
      subtitle: 'अपने जिले का प्रदर्शन देखें',
      state: 'उत्तर प्रदेश',
      selectDistrict: 'जिला चुनें',
      chooseDistrict: 'जिला चुनें',
      locationDetected: 'आपका स्थान पता चल गया',
      loadingData: 'डेटा लोड हो रहा है...',
      districtLabel: 'जिला',
      performanceReport: 'मनरेगा प्रदर्शन रिपोर्ट',
      syncData: 'अपडेट करें',
      syncing: 'सिंक हो रहा है...',
      changeDistrict: 'जिला बदलें',
      overallPerformance: 'समग्र प्रदर्शन',
      employmentRate: 'रोजगार प्रदान दर',
      employmentProvided: 'मांगे गए रोजगार का प्रदान किया गया',
      totalHouseholds: 'कुल परिवार',
      householdsInfo: 'जिले में कितने परिवारों ने मनरेगा में पंजीकृत किया',
      jobCards: 'जॉब कार्ड',
      issued: 'जारी किए गए',
      jobCardsInfo: 'काम पाने के लिए जारी किए गए कार्ड',
      personDays: 'व्यक्ति-दिवस',
      generated: 'उत्पन्न',
      personDaysInfo: 'कुल कितने दिनों का रोजगार मिला (सभी लोगों को)',
      expenditure: 'खर्च',
      crores: 'करोड़ रुपये',
      expenditureInfo: 'जिले में मनरेगा पर कुल खर्च',
      demandVsSupply: 'रोजगार मांग और पूर्ति',
      demanded: 'मांगी गई',
      provided: 'प्रदान की गई',
      familiesNeedEmployment: 'परिवारों को अभी भी रोजगार की जरूरत है',
      allDemandFulfilled: 'सभी मांग पूरी हुई',
      workProgress: 'कार्य प्रगति',
      completed: 'पूर्ण',
      ongoing: 'चल रहा',
      worksCompleted: 'कार्य पूर्ण हुए',
      historicalTrend: 'पिछले वर्षों का रुझान (5 वर्ष)',
      employment: 'रोजगार',
      whatIsMGNREGA: 'मनरेगा क्या है?',
      mgnregaDesc: 'महात्मा गांधी राष्ट्रीय ग्रामीण रोजगार गारंटी अधिनियम (मनरेगा) भारत सरकार की एक योजना है जो ग्रामीण क्षेत्रों में प्रत्येक परिवार को एक वित्तीय वर्ष में 100 दिनों के रोजगार की गारंटी देती है।',
      poweredBy: 'Appwrite Cloud द्वारा संचालित | डेटा सुरक्षित संग्रहीत',
      errorLoading: 'डेटा लोड करने में त्रुटि'
    }
  };

  // Initialize Appwrite
  const client = new Client();
  client
    .setEndpoint('https://fra.cloud.appwrite.io/v1')
    .setProject('6906074b000e78a3a942');

  const databases = new Databases(client);
  const DATABASE_ID = '690609420002bfd26330';
  const COLLECTION_ID = 'mgnrega_data';

  // Uttar Pradesh districts
  const upDistricts = [
    'Agra', 'Aligarh', 'Allahabad', 'Ambedkar Nagar', 'Azamgarh',
    'Baghpat', 'Bahraich', 'Ballia', 'Balrampur', 'Banda',
    'Barabanki', 'Bareilly', 'Basti', 'Bijnor', 'Budaun',
    'Bulandshahr', 'Chandauli', 'Chitrakoot', 'Deoria', 'Etah',
    'Etawah', 'Faizabad', 'Farrukhabad', 'Fatehpur', 'Firozabad',
    'Gautam Buddha Nagar', 'Ghaziabad', 'Ghazipur', 'Gonda', 'Gorakhpur',
    'Hamirpur', 'Hardoi', 'Jalaun', 'Jaunpur', 'Jhansi',
    'Kannauj', 'Kanpur Dehat', 'Kanpur Nagar', 'Kasganj', 'Kaushambi',
    'Kheri', 'Kushinagar', 'Lalitpur', 'Lucknow', 'Maharajganj',
    'Mahoba', 'Mainpuri', 'Mathura', 'Mau', 'Meerut',
    'Mirzapur', 'Moradabad', 'Muzaffarnagar', 'Pilibhit', 'Pratapgarh',
    'Raebareli', 'Rampur', 'Saharanpur', 'Sant Kabir Nagar', 'Sant Ravidas Nagar',
    'Shahjahanpur', 'Shamli', 'Shravasti', 'Siddharthnagar', 'Sitapur',
    'Sonbhadra', 'Sultanpur', 'Unnao', 'Varanasi'
  ];

  useEffect(() => {
    setDistricts(upDistricts);
    detectUserLocation();
    initializeData();
  }, []);

  const initializeData = async () => {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [Query.limit(1)]
      );
      
      if (response.total === 0) {
        console.log('No data found, seeding initial data...');
        await seedInitialData();
      }
    } catch (err) {
      console.error('Error checking data:', err);
      setError('Please create "mgnrega_data" collection in Appwrite Database');
    }
  };

  const seedInitialData = async () => {
    const sampleDistricts = ['Agra', 'Lucknow', 'Varanasi', 'Kanpur Nagar', 'Allahabad'];
    const years = ['2020-21', '2021-22', '2022-23', '2023-24', '2024-25'];

    for (const district of sampleDistricts) {
      for (const year of years) {
        const data = generateMockData(district, year);
        try {
          await databases.createDocument(
            DATABASE_ID,
            COLLECTION_ID,
            'unique()',
            {
              district: district,
              state: 'Uttar Pradesh',
              fin_year: year,
              total_households: data.total_households,
              job_cards_issued: data.job_cards_issued,
              employment_demanded: data.employment_demanded,
              employment_provided: data.employment_provided,
              persondays_generated: data.persondays_generated,
              avg_days_per_household: data.avg_days_per_household,
              works_completed: data.works_completed,
              expenditure_cr: parseFloat(data.expenditure_cr),
              last_synced: new Date().toISOString()
            }
          );
        } catch (err) {
          console.error('Error seeding data:', err);
        }
      }
    }
  };

  const generateMockData = (district, year) => ({
    district,
    fin_year: year,
    total_households: Math.floor(Math.random() * 50000) + 20000,
    job_cards_issued: Math.floor(Math.random() * 45000) + 18000,
    employment_demanded: Math.floor(Math.random() * 40000) + 15000,
    employment_provided: Math.floor(Math.random() * 35000) + 12000,
    persondays_generated: Math.floor(Math.random() * 5000000) + 2000000,
    avg_days_per_household: Math.floor(Math.random() * 50) + 30,
    works_completed: Math.floor(Math.random() * 2000) + 500,
    expenditure_cr: (Math.random() * 200 + 50).toFixed(2)
  });

  const detectUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          let nearestDistrict = 'Lucknow';
          
          if (lat > 27 && lat < 28 && lng > 80 && lng < 81) nearestDistrict = 'Lucknow';
          else if (lat > 27 && lat < 28 && lng > 77 && lng < 78) nearestDistrict = 'Agra';
          else if (lat > 25 && lat < 26 && lng > 82 && lng < 83) nearestDistrict = 'Varanasi';
          else if (lat > 26 && lat < 27 && lng > 80 && lng < 81) nearestDistrict = 'Kanpur Nagar';
          
          setSelectedDistrict(nearestDistrict);
          fetchDistrictData(nearestDistrict);
        },
        (error) => {
          console.log('Location access denied');
        }
      );
    }
  };

  const fetchDistrictData = async (district) => {
    setLoading(true);
    setError(null);
    
    try {
      const currentYear = '2024-25';
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [
          Query.equal('district', district),
          Query.equal('fin_year', currentYear),
          Query.limit(1)
        ]
      );

      if (response.documents.length > 0) {
        setDistrictData(response.documents[0]);
      } else {
        const mockData = generateMockData(district, currentYear);
        const doc = await databases.createDocument(
          DATABASE_ID,
          COLLECTION_ID,
          'unique()',
          {
            district: district,
            state: 'Uttar Pradesh',
            fin_year: currentYear,
            total_households: mockData.total_households,
            job_cards_issued: mockData.job_cards_issued,
            employment_demanded: mockData.employment_demanded,
            employment_provided: mockData.employment_provided,
            persondays_generated: mockData.persondays_generated,
            avg_days_per_household: mockData.avg_days_per_household,
            works_completed: mockData.works_completed,
            expenditure_cr: parseFloat(mockData.expenditure_cr),
            last_synced: new Date().toISOString()
          }
        );
        setDistrictData(doc);
      }

      const years = ['2020-21', '2021-22', '2022-23', '2023-24', '2024-25'];
      const historicalResponse = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [
          Query.equal('district', district),
          Query.limit(100)
        ]
      );

      const historical = years.map(year => {
        const doc = historicalResponse.documents.find(d => d.fin_year === year);
        return doc || generateMockData(district, year);
      });

      setHistoricalData(historical);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(t[language].errorLoading);
      
      const mockData = generateMockData(district, '2024-25');
      setDistrictData(mockData);
      
      const years = ['2020-21', '2021-22', '2022-23', '2023-24', '2024-25'];
      const historical = years.map(year => generateMockData(district, year));
      setHistoricalData(historical);
    } finally {
      setLoading(false);
    }
  };

  const syncWithGovAPI = async () => {
  setSyncing(true);
  try {
    // Call your backend sync endpoint
    const response = await fetch(`${BACKEND_URL}/api/sync/${selectedDistrict}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    
    // Refresh the district data after sync
    await fetchDistrictData(selectedDistrict);
    
    if (result.success) {
      alert(language === 'en' 
        ? `Successfully synced ${result.total || 0} records!` 
        : `${result.total || 0} रिकॉर्ड सफलतापूर्वक अपडेट किए गए!`);
    } else {
      alert(language === 'en' 
        ? result.message || 'Sync completed!' 
        : result.message || 'सिंक पूर्ण हुआ!');
    }
  } catch (err) {
    console.error('Sync error:', err);
    alert(language === 'en' 
      ? 'Sync failed. Please try again. The server might be starting up (takes 30-60 sec on first request).' 
      : 'सिंक करने में त्रुटि। कृपया पुनः प्रयास करें।');
  } finally {
    setSyncing(false);
  }
};

  const handleDistrictChange = (e) => {
    const district = e.target.value;
    setSelectedDistrict(district);
    if (district) {
      fetchDistrictData(district);
    }
  };

  const InfoBox = ({ title, content, id }) => (
    <div className="relative">
      <button
        onClick={() => setShowInfo({...showInfo, [id]: !showInfo[id]})}
        className="ml-2 text-blue-500 hover:text-blue-700"
      >
        <Info size={16} />
      </button>
      {showInfo[id] && (
        <div className="absolute z-10 bg-white border-2 border-blue-300 rounded-lg p-3 shadow-lg w-64 mt-1">
          <p className="text-sm text-gray-700">{content}</p>
        </div>
      )}
    </div>
  );

  const MetricCard = ({ title, value, subtitle, icon: Icon, color, info, infoId }) => (
    <div className={`bg-white rounded-lg shadow-md p-6 border-l-4 ${color}`}>
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center">
            <p className="text-gray-600 text-sm font-medium">{title}</p>
            {info && <InfoBox title={title} content={info} id={infoId} />}
          </div>
          <p className="text-3xl font-bold mt-2">{typeof value === 'number' ? value.toLocaleString('en-IN') : value}</p>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-full ${color.replace('border', 'bg').replace('500', '100')}`}>
          <Icon className={color.replace('border-', 'text-')} size={24} />
        </div>
      </div>
    </div>
  );

  const LanguageToggle = () => (
    <div className="flex items-center gap-3 bg-white rounded-lg px-4 py-2 shadow-md">
      <Globe size={20} className="text-gray-600" />
      <span className={`text-sm font-medium ${language === 'en' ? 'text-blue-600' : 'text-gray-500'}`}>EN</span>
      <button
        onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          language === 'hi' ? 'bg-green-600' : 'bg-gray-300'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            language === 'hi' ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
      <span className={`text-sm font-medium ${language === 'hi' ? 'text-green-600' : 'text-gray-500'}`}>हिं</span>
    </div>
  );

  if (!selectedDistrict) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
        <div className="max-w-2xl mx-auto mt-20">
          <div className="bg-white rounded-lg shadow-xl p-8">
            <div className="flex justify-end mb-4">
              <LanguageToggle />
            </div>
            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold text-gray-800 mb-4">{t[language].title}</h1>
              <p className="text-gray-600">{t[language].subtitle}</p>
              <p className="text-sm text-green-600 mt-2">{t[language].state}</p>
            </div>
            
            {userLocation && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center">
                <MapPin className="text-green-600 mr-2" size={20} />
                <p className="text-green-700">{t[language].locationDetected}</p>
              </div>
            )}

            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
                <AlertCircle className="text-red-600 mr-2" size={20} />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <div className="mb-6">
              <label className="block text-gray-700 font-medium mb-2">
                {t[language].selectDistrict}
              </label>
              <select
                value={selectedDistrict}
                onChange={handleDistrictChange}
                className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none text-lg"
              >
                <option value="">-- {t[language].chooseDistrict} --</option>
                {districts.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 text-lg">{t[language].loadingData}</p>
        </div>
      </div>
    );
  }

  if (!districtData) {
    return null;
  }

  const performanceScore = Math.round((districtData.employment_provided / districtData.employment_demanded) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">{selectedDistrict} {t[language].districtLabel}</h1>
              <p className="text-gray-600 mt-1">{t[language].performanceReport}</p>
              <p className="text-sm text-gray-500 mt-1">{t[language].state}</p>
            </div>
            <div className="flex gap-2 items-center flex-wrap">
              <LanguageToggle />
              <button
                onClick={syncWithGovAPI}
                disabled={syncing}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2 disabled:opacity-50"
              >
                <RefreshCw size={18} className={syncing ? 'animate-spin' : ''} />
                {syncing ? t[language].syncing : t[language].syncData}
              </button>
              <button
                onClick={() => setSelectedDistrict('')}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
              >
                {t[language].changeDistrict}
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center">
            <AlertCircle className="text-yellow-600 mr-2" size={20} />
            <p className="text-yellow-800 text-sm">{error}</p>
          </div>
        )}

        {/* Performance Score */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg shadow-lg p-8 mb-6 text-white">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">{t[language].overallPerformance}</h2>
            <div className="text-6xl font-bold mb-2">{performanceScore}%</div>
            <p className="text-xl">{t[language].employmentRate}</p>
            <p className="mt-2 text-sm opacity-90">{performanceScore}% {t[language].employmentProvided}</p>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <MetricCard
            title={t[language].totalHouseholds}
            value={districtData.total_households}
            icon={Users}
            color="border-blue-500"
            info={t[language].householdsInfo}
            infoId="households"
          />
          <MetricCard
            title={t[language].jobCards}
            value={districtData.job_cards_issued}
            subtitle={t[language].issued}
            icon={Calendar}
            color="border-green-500"
            info={t[language].jobCardsInfo}
            infoId="jobcards"
          />
          <MetricCard
            title={t[language].personDays}
            value={(districtData.persondays_generated / 100000).toFixed(1) + 'L'}
            subtitle={t[language].generated}
            icon={TrendingUp}
            color="border-orange-500"
            info={t[language].personDaysInfo}
            infoId="persondays"
          />
          <MetricCard
            title={t[language].expenditure}
            value={'₹' + districtData.expenditure_cr + ' Cr'}
            subtitle={t[language].crores}
            icon={TrendingUp}
            color="border-red-500"
            info={t[language].expenditureInfo}
            infoId="expenditure"
          />
        </div>

        {/* Employment Comparison */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-bold mb-4 text-gray-800">
              {t[language].demandVsSupply}
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={[
                { name: t[language].demanded, value: districtData.employment_demanded },
                { name: t[language].provided, value: districtData.employment_provided }
              ]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded flex items-start">
              <AlertCircle className="text-yellow-600 mr-2 flex-shrink-0 mt-1" size={20} />
              <p className="text-sm text-yellow-800">
                {districtData.employment_demanded - districtData.employment_provided > 0
                  ? `${(districtData.employment_demanded - districtData.employment_provided).toLocaleString('en-IN')} ${t[language].familiesNeedEmployment}`
                  : t[language].allDemandFulfilled}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-bold mb-4 text-gray-800">
              {t[language].workProgress}
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    { name: t[language].completed, value: districtData.works_completed },
                    { name: t[language].ongoing, value: Math.floor(districtData.works_completed * 0.3) }
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {COLORS.map((color, index) => (
                    <Cell key={`cell-${index}`} fill={color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 text-center">
              <p className="text-3xl font-bold text-green-600">{districtData.works_completed}</p>
              <p className="text-gray-600">{t[language].worksCompleted}</p>
            </div>
          </div>
        </div>

        {/* Historical Trend */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h3 className="text-xl font-bold mb-4 text-gray-800">
            {t[language].historicalTrend}
          </h3>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={historicalData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="fin_year" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="employment_provided" stroke="#10b981" name={t[language].employment} strokeWidth={2} />
              <Line type="monotone" dataKey="persondays_generated" stroke="#3b82f6" name={t[language].personDays} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-bold text-blue-900 mb-3">{t[language].whatIsMGNREGA}</h3>
          <p className="text-gray-700">
            {t[language].mgnregaDesc}
          </p>
        </div>

        {/* Powered by Appwrite */}
        <div className="text-center text-gray-500 text-sm pb-4">
          <p>{t[language].poweredBy}</p>
        </div>
      </div>
    </div>
  );
};

export default MGNREGADashboard;