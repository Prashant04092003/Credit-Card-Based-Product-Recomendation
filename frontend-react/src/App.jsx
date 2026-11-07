import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import PortfolioOverview from './pages/PortfolioOverview';
import Customer360 from './pages/Customer360';
import WhatIfSimulator from './pages/WhatIfSimulator';
import CustomerSegments from './pages/CustomerSegments';
import CardSimilarity from './pages/CardSimilarity';
import FraudRadar from './pages/FraudRadar';

export default function App() {
  const [activeTab, setActiveTab] = useState('portfolio');
  const [selectedUserId, setSelectedUserId] = useState(0);

  const handleSelectUser = (userId) => {
    setSelectedUserId(Number(userId));
    setActiveTab('customer-360');
  };

  return (
    <div className="flex h-screen bg-black text-white font-sans antialiased overflow-hidden">
      {/* Navigation Sidebar */}
      <Sidebar activeTab={activeTab} onSelectTab={setActiveTab} />

      {/* Main View Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-black">
        {/* Top Navbar */}
        <Header 
          activeTab={activeTab} 
          selectedUserId={selectedUserId}
          onSelectUser={handleSelectUser} 
        />

        {/* Full-width Responsive Canvas */}
        <main className="flex-1 overflow-y-auto px-8 py-8 bg-black">
          <div className="w-full max-w-[1800px] mx-auto pb-20">
            {activeTab === 'portfolio' && (
              <PortfolioOverview onSelectUser={handleSelectUser} />
            )}

            {activeTab === 'customer-360' && (
              <Customer360 
                userId={selectedUserId} 
                onSelectUser={handleSelectUser} 
              />
            )}

            {activeTab === 'simulator' && (
              <WhatIfSimulator 
                userId={selectedUserId} 
                onSelectUser={handleSelectUser} 
              />
            )}

            {activeTab === 'segments' && (
              <CustomerSegments onSelectUser={handleSelectUser} />
            )}

            {activeTab === 'similarity' && (
              <CardSimilarity onSelectUser={handleSelectUser} />
            )}

            {activeTab === 'fraud' && (
              <FraudRadar />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
