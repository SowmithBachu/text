'use client';

import { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    // Check for saved theme preference or default to light
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' || 'light';
    setTheme(savedTheme);
    document.documentElement.classList.toggle('dark', savedTheme === 'dark');
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  return (
    <Button
      onClick={toggleTheme}
      variant="ghost"
      size="sm"
      className="relative overflow-hidden bg-white/10 dark:bg-gray-900/10 backdrop-blur-xl border border-white/20 dark:border-gray-800/50 hover:bg-white/20 dark:hover:bg-gray-900/20 transition-all duration-300"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
      <div className="relative flex items-center space-x-2">
        {theme === 'light' ? (
          <>
            <Moon className="h-4 w-4 text-gray-700 dark:text-gray-300" />
            <span className="hidden sm:inline text-sm text-gray-700 dark:text-gray-300">Dark</span>
          </>
        ) : (
          <>
            <Sun className="h-4 w-4 text-gray-700 dark:text-gray-300" />
            <span className="hidden sm:inline text-sm text-gray-700 dark:text-gray-300">Light</span>
          </>
        )}
      </div>
    </Button>
  );
} 