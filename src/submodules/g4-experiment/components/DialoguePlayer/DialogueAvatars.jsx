import React from 'react';

export const UncleAvatar = () => (
    <svg viewBox="0 0 100 100" className="w-full h-full bg-yellow-100" style={{ width: '100%', height: '100%', backgroundColor: '#fef9c3' }}>
        <circle cx="50" cy="50" r="45" fill="#fde68a" />
        <path d="M30,40 Q50,55 70,40" stroke="#333" strokeWidth="3" fill="none" />
        <circle cx="35" cy="35" r="4" fill="#333" />
        <circle cx="65" cy="35" r="4" fill="#333" />
        <path d="M50,20 Q65,10 80,25" fill="#5c4033" />
        <path d="M50,20 Q35,10 20,25" fill="#5c4033" />
        <rect x="40" y="80" width="20" height="20" fill="#ef4444" />
        <path d="M40,80 L50,90 L60,80" fill="white" />
    </svg>
);

export const MingAvatar = () => (
    <svg viewBox="0 0 100 100" className="w-full h-full bg-blue-100" style={{ width: '100%', height: '100%', backgroundColor: '#dbeafe' }}>
        <circle cx="50" cy="50" r="45" fill="#bfdbfe" />
        <path d="M30,55 Q50,75 70,55" stroke="#333" strokeWidth="3" fill="none" />
        <circle cx="35" cy="45" r="4" fill="#333" />
        <circle cx="65" cy="45" r="4" fill="#333" />
        <path d="M20,30 Q50,10 80,30" fill="#374151" />
        <path d="M10,40 Q20,30 20,50" fill="#374151" />
        <path d="M90,40 Q80,30 80,50" fill="#374151" />
    </svg>
);

export const MomAvatar = () => (
    <svg viewBox="0 0 100 100" className="w-full h-full bg-pink-100" style={{ width: '100%', height: '100%', backgroundColor: '#fce7f3' }}>
        <circle cx="50" cy="50" r="45" fill="#fbcfe8" />
        <path d="M35,60 Q50,70 65,60" stroke="#c026d3" strokeWidth="2" fill="none" />
        <circle cx="35" cy="45" r="4" fill="#333" />
        <circle cx="65" cy="45" r="4" fill="#333" />
        <path d="M20,20 Q50,60 80,20 L85,80 Q50,100 15,80 Z" fill="#701a75" />
    </svg>
);

export const DadAvatar = () => (
    <svg viewBox="0 0 100 100" className="w-full h-full bg-green-100" style={{ width: '100%', height: '100%', backgroundColor: '#dcfce7' }}>
        <circle cx="50" cy="50" r="45" fill="#dcfce7" />
        <rect x="25" y="40" width="20" height="12" rx="2" stroke="#333" strokeWidth="2" fill="none" />
        <rect x="55" y="40" width="20" height="12" rx="2" stroke="#333" strokeWidth="2" fill="none" />
        <line x1="45" y1="46" x2="55" y2="46" stroke="#333" strokeWidth="2" />
        <path d="M35,65 Q50,75 65,65" stroke="#333" strokeWidth="2" fill="none" />
        <path d="M25,25 Q50,15 75,25" fill="#1e293b" />
    </svg>
);
