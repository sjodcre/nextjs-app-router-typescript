import React from 'react';

interface DexscreenerChartProps {
  pairAddress: string; // The address of the trading pair you want to display
}

const DexscreenerChart: React.FC<DexscreenerChartProps> = ({ pairAddress }) => {
  const iframeSrc = `https://dexscreener.com/ethereum/${pairAddress}?embed=1&theme=dark`;

  return (
    <div style={{ width: '100%', height: '500px' }}>
      <iframe
        src={iframeSrc}
        width="100%"
        height="100%"
        allowFullScreen
        style={{ border: 'none' }}
      ></iframe>
    </div>
  );
};

export default DexscreenerChart;