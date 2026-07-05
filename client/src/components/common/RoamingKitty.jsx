import React, { useState, useEffect, useRef } from 'react';
import Chatbot from './Chatbot';

export default function RoamingKitty() {
  const [position, setPosition] = useState({ x: window.innerWidth - 100, y: window.innerHeight - 100 });
  const [direction, setDirection] = useState(1); // 1 = right, -1 = left
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [action, setAction] = useState('idle'); // 'idle', 'walking', 'sitting'
  const kittyRef = useRef(null);
  
  // Random wandering logic
  useEffect(() => {
    if (isChatOpen) return;

    let intervalId;
    let targetPos = null;
    let stepTimer;

    const moveStep = () => {
      if (!targetPos || isChatOpen) return;
      
      setPosition(prev => {
        const dx = targetPos.x - prev.x;
        const dy = targetPos.y - prev.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 5) {
          setAction('idle');
          targetPos = null;
          return prev;
        }

        const speed = 2; // pixel per frame
        const vx = (dx / dist) * speed;
        const vy = (dy / dist) * speed;
        
        setDirection(vx < 0 ? -1 : 1);
        
        return {
          x: prev.x + vx,
          y: prev.y + vy
        };
      });
      
      if (targetPos) {
        stepTimer = requestAnimationFrame(moveStep);
      }
    };

    const pickNewTarget = () => {
      // Pick a random location on screen (avoiding edges)
      const maxX = window.innerWidth - 100;
      const maxY = window.innerHeight - 100;
      
      targetPos = {
        x: Math.max(20, Math.random() * maxX),
        y: Math.max(20, Math.random() * maxY)
      };
      
      setAction('walking');
      moveStep();
    };

    // Every 5-10 seconds, decide to do something
    const actionLoop = () => {
      if (isChatOpen) return;
      
      const rand = Math.random();
      if (rand < 0.6) {
        // 60% chance to walk somewhere
        pickNewTarget();
      } else {
        // 40% chance to just sit/idle
        setAction('idle');
      }
      
      const nextDelay = 5000 + Math.random() * 5000;
      intervalId = setTimeout(actionLoop, nextDelay);
    };

    intervalId = setTimeout(actionLoop, 2000);

    return () => {
      clearTimeout(intervalId);
      if (stepTimer) cancelAnimationFrame(stepTimer);
    };
  }, [isChatOpen]);

  // Keep kitty inside window on resize
  useEffect(() => {
    const handleResize = () => {
      setPosition(prev => ({
        x: Math.min(prev.x, window.innerWidth - 80),
        y: Math.min(prev.y, window.innerHeight - 80)
      }));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <>
      <div 
        ref={kittyRef}
        onClick={() => setIsChatOpen(true)}
        style={{
          position: 'fixed',
          left: position.x,
          top: position.y,
          width: '60px',
          height: '60px',
          cursor: 'pointer',
          zIndex: 9999,
          transition: action === 'idle' ? 'transform 0.3s ease' : 'none',
          transform: `scaleX(${direction}) ${action === 'walking' ? 'translateY(' + (Math.sin(Date.now() / 150) * 3) + 'px)' : ''}`,
          display: isChatOpen ? 'none' : 'block',
          filter: 'drop-shadow(0px 4px 8px rgba(0,0,0,0.3))'
        }}
        title="Click to Chat with Kitty!"
      >
        <img 
          src="/kitty_happy.png" 
          alt="Kitty" 
          style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
        />
      </div>

      <Chatbot isOpenExternal={isChatOpen} setIsOpenExternal={setIsChatOpen} />
    </>
  );
}
