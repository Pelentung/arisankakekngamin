'use client';

import { CloudSun, Thermometer, Loader2, MapPinOff, Cloud, Sun, CloudRain, CloudLightning, Snowflake, CloudFog } from 'lucide-react';
import { useState, useEffect } from 'react';

// Fungsi untuk menerjemahkan kode cuaca WMO ke ikon dan teks
const getWeatherInfo = (code: number): { icon: React.ReactNode, condition: string } => {
    if (code === 0) return { icon: <Sun className="h-5 w-5 text-yellow-400" />, condition: 'Cerah' };
    if (code >= 1 && code <= 3) return { icon: <CloudSun className="h-5 w-5 text-yellow-400" />, condition: 'Berawan' };
    if (code === 45 || code === 48) return { icon: <CloudFog className="h-5 w-5 text-gray-400" />, condition: 'Berkabut' };
    if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return { icon: <CloudRain className="h-5 w-5 text-blue-400" />, condition: 'Hujan' };
    if (code >= 71 && code <= 77) return { icon: <Snowflake className="h-5 w-5 text-blue-300" />, condition: 'Salju' };
    if (code >= 95 && code <= 99) return { icon: <CloudLightning className="h-5 w-5 text-yellow-500" />, condition: 'Badai' };
    return { icon: <Cloud className="h-5 w-5 text-gray-400" />, condition: 'Berawan' };
};


export function WeatherForecast() {
  const [weather, setWeather] = useState<{location: string, temperature: number, code: number} | null>(null);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Efek ini memastikan komponen hanya dirender di sisi klien
    setIsVisible(true);

    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
        setStatus('loading');
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`);
                    if (!response.ok) {
                        throw new Error('Gagal mengambil data cuaca.');
                    }
                    const data = await response.json();
                    setWeather({
                        location: 'Lokasi Anda', // Open-Meteo tidak menyediakan nama lokasi
                        temperature: Math.round(data.current_weather.temperature),
                        code: data.current_weather.weathercode,
                    });
                    setStatus('success');
                } catch (error) {
                    setErrorMessage('Gagal menghubungi layanan cuaca.');
                    setStatus('error');
                }
            },
            (error) => {
                let message = "Terjadi kesalahan saat mengakses lokasi.";
                if (error.code === error.PERMISSION_DENIED) {
                    message = "Akses lokasi ditolak.";
                }
                setErrorMessage(message);
                setStatus('error');
            }
        );
    } else {
        setErrorMessage("Geolocation tidak didukung di peramban ini.");
        setStatus('error');
    }
  }, []);

  if (!isVisible) {
    return null; // Tidak merender apa pun di server atau saat render awal klien
  }

  if (status === 'loading') {
    return (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Mendapatkan data cuaca...</span>
        </div>
    );
  }

  if (status === 'error') {
     return (
        <div className="flex items-center gap-2 text-sm text-yellow-500">
            <MapPinOff className="h-5 w-5" />
            <span>{errorMessage}</span>
        </div>
    );
  }

  if (status === 'success' && weather) {
    const { icon, condition } = getWeatherInfo(weather.code);
    return (
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
                {icon}
                <span>{condition}</span>
            </div>
            <div className="flex items-center gap-1">
                <Thermometer className="h-5 w-5 text-red-500" />
                <span>{weather.temperature}°C di {weather.location}</span>
            </div>
        </div>
    );
  }

  return null;
}
