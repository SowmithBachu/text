'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ImageIcon, Youtube, Instagram, Twitter, Facebook, Type, Wand2 } from 'lucide-react';
import ThemeToggle from '@/components/layout/ThemeToggle';
import Carousel3D from '@/components/Carousel3D';

const FeatureCard = ({ icon, title, children }: { icon: React.ReactNode, title: string, children: React.ReactNode }) => (
  <div className="bg-white/60 dark:bg-gray-800/60 p-6 rounded-2xl border border-white/20 dark:border-gray-700 transition-colors duration-300 hover:bg-white/70 hover:dark:bg-gray-800/70">
    <div className="flex items-center space-x-4 mb-4">
      <div className="p-2 bg-gradient-to-br from-gray-700 to-gray-900 rounded-lg text-white">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-gray-800 dark:text-white">{title}</h3>
    </div>
    <p className="text-gray-600 dark:text-gray-400">{children}</p>
  </div>
);

export default function HomePage() {

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200">

      {/* Header */}
      <header className="relative z-50 w-full">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20 border-b border-white/20 bg-white/30 dark:bg-gray-900/30 backdrop-blur-xl shadow-lg rounded-b-2xl">
            <div className="flex items-center space-x-3 px-4">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-gray-700 to-black rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
                <div className="relative p-2 bg-white/80 dark:bg-black/80 rounded-lg leading-none flex items-center">
                  <ImageIcon className="h-6 w-6 text-black dark:text-white" />
                </div>
              </div>
              <span className="text-xl font-bold text-black dark:text-white">
                TextOverlayed
              </span>
            </div>
            <div className="flex items-center space-x-4 px-4">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 sm:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative z-10 text-center mb-12">
             <h1 className="text-2xl sm:text-4xl font-extrabold mb-6 drop-shadow-sm">
              <span className="bg-gradient-to-b from-gray-800 to-black dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent">
                Create Stunning{" "}
              </span>
              <span className="text-violet-500 dark:text-violet-400">
                Thumbnails
              </span>
              <span className="bg-gradient-to-b from-gray-800 to-black dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent">
                {" "}and{" "}
              </span>
              <span className="text-violet-500 dark:text-violet-400">
                Social Media Posts
              </span>
              <span className="bg-gradient-to-b from-gray-800 to-black dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent">
                {" "}in Seconds.
              </span>
            </h1>
            <div className="flex justify-center mb-12">
              <Link href="/signin">
                <Button size="lg" className="text-lg px-10 py-4 bg-gradient-to-r from-gray-800 to-black hover:from-gray-700 hover:to-gray-900 text-white border-0 shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 backdrop-blur-sm rounded-xl">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
          <div className="relative z-10 flex justify-center items-center min-h-[500px]">
            <Carousel3D />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard icon={<Youtube />} title="YouTube Thumbnails">
              Grab your audience's attention with compelling text that boosts click-through rates.
            </FeatureCard>
            <FeatureCard icon={<Instagram />} title="Instagram Posts">
              Create beautiful, share-worthy graphics for your feed and stories in minutes.
            </FeatureCard>
            <FeatureCard icon={<Twitter />} title="Twitter Graphics">
              Design eye-catching images that get your message seen and retweeted across the platform.
            </FeatureCard>
            <FeatureCard icon={<Facebook />} title="Facebook Ads & Posts">
              Craft professional ad creatives that stop the scroll and drive tangible conversions.
            </FeatureCard>
            <FeatureCard icon={<Type />} title="Huge Font Library">
              Access hundreds of professional fonts to perfectly match your brand and style.
            </FeatureCard>
            <FeatureCard icon={<Wand2 />} title="Effortless Editing">
              Customize everything from color and size to shadows and rotation with our intuitive editor.
            </FeatureCard>
          </div>
        </div>
      </section>
    </div>
  );
} 