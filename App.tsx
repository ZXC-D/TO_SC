import React, { useState } from 'react';
import { Scene } from './components/Scene';
import { UI } from './components/UI';

const App = () => {
  // Master state for the tree formation
  const [isTreeAssembled, setIsTreeAssembled] = useState(false);

  return (
    <div className="relative w-full h-screen bg-[#011a10] overflow-hidden">
      {/* 3D Scene Layer */}
      <div className="absolute inset-0 z-0">
        <Scene isTreeAssembled={isTreeAssembled} />
      </div>

      {/* UI Overlay Layer */}
      <UI 
        isTreeAssembled={isTreeAssembled} 
        onToggleTree={() => setIsTreeAssembled(prev => !prev)} 
      />
      
      {/* Vignette Overlay for extra depth (CSS based) */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,rgba(1,26,16,0.8)_100%)] z-20 mix-blend-multiply"></div>
    </div>
  );
};

export default App;