import React, { useState } from 'react';
import { Search, MapPin } from 'lucide-react';

interface ZipCodeSearchProps {
  onSearch?: (zipCode: string) => void;
  placeholder?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function ZipCodeSearch({ onSearch, placeholder = "Enter ZIP code", size = 'md' }: ZipCodeSearchProps) {
  const [zipCode, setZipCode] = useState('');

  const defaultOnSearch = (zipCode: string) => {
    console.log('Default navigation for ZIP:', zipCode);
    // Navigate to Texas city page based on ZIP code
    // For now, navigate to general Texas page - could be enhanced with ZIP-to-city mapping
    if (typeof window !== 'undefined') {
      window.location.href = `/texas?zip=${zipCode}`;
    }
  };

  const handleSearch = onSearch || defaultOnSearch;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted with ZIP:', zipCode);
    if (zipCode.length === 5) {
      console.log('Calling handleSearch with:', zipCode);
      handleSearch(zipCode);
    } else {
      console.log('ZIP code not 5 digits:', zipCode.length);
    }
  };

  const handleButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    console.log('Button clicked with ZIP:', zipCode);
    if (zipCode.length === 5) {
      console.log('Calling handleSearch from button with:', zipCode);
      handleSearch(zipCode);
    }
  };

  const sizeClasses = {
    sm: 'h-10 text-sm',
    md: 'h-12 text-base',
    lg: 'h-14 text-lg'
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MapPin className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={zipCode}
          onChange={(e) => setZipCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
          placeholder={placeholder}
          className={`block w-full pl-10 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 bg-white placeholder-gray-500 ${sizeClasses[size]}`}
        />
        <button
          type="submit"
          onClick={handleButtonClick}
          disabled={zipCode.length !== 5}
          className="absolute inset-y-0 right-0 px-4 flex items-center bg-red-600 text-white rounded-r-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          <Search className="h-5 w-5" />
        </button>
      </div>
    </form>
  );
}