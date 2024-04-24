import React from 'react';

interface IndeterminateProgressBarProps {
  progress: number; // Progress as a percentage from 0 to 100
}

const IndeterminateProgressBar: React.FC<IndeterminateProgressBarProps> = ({ progress }) => {
  return (
    <div 
      aria-valuemax={100} 
      aria-valuemin={0} 
      aria-valuenow={progress} // Reflects the current value of the progress
      role="progressbar" 
      data-state="indeterminate" 
      data-max={100} 
      className="relative h-4 overflow-hidden rounded-full dark:bg-slate-800 w-full bg-gray-700"
    >
      <div
        data-state="indeterminate"
        data-max={100}
        className="h-full bg-green-300 dark:bg-slate-50"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
};

export default IndeterminateProgressBar;