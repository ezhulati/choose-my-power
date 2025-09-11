/**
 * Standard ZIP Input React Component
 * 
 * React version of StandardZipInput.astro that matches the exact same design and functionality.
 * This ensures consistent ZIP input appearance across both Astro and React components.
 */

import React, { useState } from 'react';
import { getCityFromZip } from '../config/tdsp-mapping';

interface StandardZipInputReactProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'hero' | 'inline' | 'compact';
  onSearch?: (zipCode: string) => void;
  className?: string;
}

export default function StandardZipInputReact({ 
  size = 'lg',
  variant = 'inline',
  onSearch,
  className = ''
}: StandardZipInputReactProps) {
  const [zipCode, setZipCode] = useState('');

  // Size configurations (matching StandardZipInput.astro exactly)
  const sizes = {
    sm: {
      input: 'pl-10 pr-4 py-3 text-base',
      button: 'px-6 py-3',
      icon: 'h-5 w-5'
    },
    md: {
      input: 'pl-14 pr-6 py-5 text-xl',
      button: 'px-10 py-5',
      icon: 'h-6 w-6'
    },
    lg: {
      input: 'pl-16 pr-8 py-6 text-2xl',
      button: 'px-12 py-6',
      icon: 'h-7 w-7'
    }
  };

  // Variant configurations (matching StandardZipInput.astro exactly)
  const variants = {
    hero: {
      container: 'max-w-xl mx-auto',
      form: 'rounded-2xl shadow-2xl overflow-hidden bg-white ring-4 ring-white/10 backdrop-blur-sm',
    },
    inline: {
      container: 'max-w-lg mx-auto',
      form: 'rounded-xl shadow-lg overflow-hidden bg-white border-2 border-gray-200 hover:border-texas-navy/20 transition-all duration-300',
    },
    compact: {
      container: 'max-w-md mx-auto', 
      form: 'rounded-lg shadow-md overflow-hidden bg-white border border-gray-300',
    }
  };

  const sizeConfig = sizes[size];
  const variantConfig = variants[variant];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (zipCode && zipCode.length === 5) {
      // Call onSearch prop if provided, otherwise use intelligent city mapping like homepage
      if (onSearch) {
        onSearch(zipCode);
      } else {
        // Use the same logic as homepage - intelligent ZIP-to-city mapping
        const city = getCityFromZip(zipCode);
        
        if (city) {
          // Navigate to the electricity plans page (correct routing pattern)
          window.location.href = `/electricity-plans/${city}`;
        } else {
          // ZIP code not found, try to determine state by ZIP code pattern
          if (zipCode.startsWith('7')) {
            // Texas ZIP code, but city not in our mapping - go to Texas page
            window.location.href = '/texas/electricity-providers';
          } else {
            // Not a Texas ZIP code or unknown - go to locations page
            window.location.href = '/locations';
          }
        }
      }
    }
  };

  return (
    <div className={`${variantConfig.container} ${className}`}>
      <form 
        onSubmit={handleSubmit}
        className={`zip-form ${variantConfig.form} flex items-stretch`}
        data-zip-form="react"
      >
        <div className="relative flex-1">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            <svg className={sizeConfig.icon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
            </svg>
          </div>
          <input
            type="text"
            value={zipCode}
            onChange={(e) => setZipCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
            placeholder="ZIP code"
            className={`zip-input ${sizeConfig.input} w-full border-0 bg-transparent text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-0`}
            pattern="[0-9]{5}"
            maxLength={5}
            required
          />
        </div>
        <button
          type="submit"
          aria-label="Search electricity plans by ZIP code"
          className={`${sizeConfig.button} bg-gradient-to-r from-red-600 to-red-700 text-white font-bold hover:from-red-700 hover:to-red-800 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-red-200 active:scale-95 group`}
        >
          <div className="flex items-center gap-3">
            <svg className={`${sizeConfig.icon} group-hover:scale-110 transition-transform`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
            {size !== 'sm' && <span className="hidden sm:block">Find Plans</span>}
          </div>
        </button>
      </form>
    </div>
  );
}