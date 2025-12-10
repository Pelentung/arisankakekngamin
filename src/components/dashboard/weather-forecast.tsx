'use client';

import { CloudSun, Thermometer } from 'lucide-react';
import { useState, useEffect } from 'react';

// Data cuaca tiruan. Di aplikasi nyata, ini akan berasal dari API.
const mockWeatherData = {
    location: 'Jakarta',
    temperature: 29,
    condition: 'Cerah Berawan',
};

export function WeatherForecast() {
  const [weather, setWeather] = useState(mockWeatherData);
  const [isVisible, setIsVisible] = useState(false);

  // Efek ini memastikan komponen hanya dirender di sisi klien untuk menghindari hydration mismatch
  useEffect(() => {
    setIsVisible(true);
  }, []);

  if (!isVisible) {
    return null; // Tidak merender apa pun di server atau saat render awal klien
  }

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <CloudSun className="h-5 w-5 text-yellow-400" />
        <span>{weather.condition}</span>
        <Thermometer className="h-5 w-5 text-red-500" />
        <span>{weather.temperature}°C di {weather.location}</span>
    </div>
  );
}
