'use client';

import { useEffect, useRef } from 'react';
import './Carousel3D.css';

const Carousel3D = () => {
  const spinContainer = useRef<HTMLDivElement>(null);
  const radius = 240;
  
  const config = {
    autoRotate: true,
    rotateSpeed: -60,
    imgWidth: 170,
    imgHeight: 270,
  };

  const images = [
    'https://iili.io/HTjH72V.jpg',
    'https://iili.io/HTjHCk7.jpg',
    'https://iili.io/HTjH3Bf.jpg',
    '/edited-image-6.png', // Local image from public folder
    'https://iili.io/HTjHRrQ.jpg',
    'https://iili.io/HTjHAEx.jpg',
    'https://images.pexels.com/photos/139829/pexels-photo-139829.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500',
  ];
  useEffect(() => {
    if (!spinContainer.current) return;

    const init = (delayTime?: number) => {
      if (!spinContainer.current) return;
      
      const aEle = [
        ...Array.from(spinContainer.current.getElementsByTagName('img')), 
        ...Array.from(spinContainer.current.getElementsByTagName('video'))
      ];
      
      aEle.forEach((ele, i) => {
        ele.style.transform = `rotateY(${i * (360 / aEle.length)}deg) translateZ(${radius}px)`;
        ele.style.transition = "transform 1s";
        ele.style.transitionDelay = delayTime ? `${delayTime}s` : `${(aEle.length - i) / 4}s`;
      });
    };

    // Initialize
    setTimeout(() => init(), 1000);

    // Auto rotate
    if (config.autoRotate && spinContainer.current) {
      const animationName = config.rotateSpeed > 0 ? 'spin' : 'spinRevert';
      spinContainer.current.style.animation = `${animationName} ${Math.abs(config.rotateSpeed)}s infinite linear`;
    }
  }, []);

  return (
    <div id="carousel-container">
      <div ref={spinContainer} id="spin-container" style={{ width: config.imgWidth, height: config.imgHeight }}>
        {images.map((src, index) => (
          <img 
            key={index} 
            src={src} 
            alt="" 
            onError={(e) => {
              console.error('Failed to load image:', src);
              console.error('Error:', e);
            }}
            onLoad={() => {
              console.log('Successfully loaded image:', src);
            }}
          />
        ))}
        <video controls autoPlay loop>
          <source src={videoSrc} type="video/mp4" />
        </video>
        <p>Love from Prasenjit ♥</p>
      </div>
      <div id="ground" style={{ width: radius * 3, height: radius * 3 }} />
    </div>
  );
};

export default Carousel3D;

