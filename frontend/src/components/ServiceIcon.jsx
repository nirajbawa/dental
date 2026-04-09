import React from 'react';

// Premium SVG illustrations for each dental service
const icons = {
    Implants: (
        <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="80" height="80" rx="16" fill="#e0f2fe" />
            <rect x="34" y="12" width="12" height="28" rx="6" fill="#1a6b8a" />
            <rect x="30" y="36" width="20" height="6" rx="3" fill="#2389b0" />
            <rect x="32" y="42" width="16" height="26" rx="4" fill="#1a6b8a" />
            <circle cx="40" cy="14" r="4" fill="#4db8d4" />
        </svg>
    ),
    'Root Canal': (
        <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="80" height="80" rx="16" fill="#fef3c7" />
            <path d="M28 18 C28 18 20 22 20 34 C20 42 26 46 32 46 L32 62" stroke="#d97706" strokeWidth="3" strokeLinecap="round" fill="none" />
            <path d="M52 18 C52 18 60 22 60 34 C60 42 54 46 48 46 L48 62" stroke="#d97706" strokeWidth="3" strokeLinecap="round" fill="none" />
            <path d="M28 18 Q40 12 52 18 Q56 28 52 36 Q40 42 28 36 Q24 28 28 18Z" fill="#fbbf24" stroke="#d97706" strokeWidth="2" />
            <circle cx="40" cy="27" r="5" fill="#fff" stroke="#d97706" strokeWidth="1.5" />
        </svg>
    ),
    Whitening: (
        <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="80" height="80" rx="16" fill="#f0fdf4" />
            <path d="M20 30 Q40 20 60 30 Q60 50 40 60 Q20 50 20 30Z" fill="white" stroke="#16a34a" strokeWidth="2" />
            <path d="M28 35 Q40 28 52 35" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <circle cx="58" cy="18" r="5" fill="#fbbf24" />
            <line x1="58" y1="10" x2="58" y2="8" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />
            <line x1="64" y1="12" x2="66" y2="10" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />
            <line x1="66" y1="18" x2="68" y2="18" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />
        </svg>
    ),
    Braces: (
        <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="80" height="80" rx="16" fill="#ede9fe" />
            <rect x="16" y="34" width="48" height="12" rx="6" fill="#7c3aed" opacity="0.2" />
            <rect x="16" y="38" width="48" height="4" rx="2" fill="#7c3aed" />
            {[20, 30, 40, 50, 56].map((x, i) => (
                <rect key={i} x={x - 4} y="30" width="8" height="20" rx="3" fill="white" stroke="#7c3aed" strokeWidth="1.5" />
            ))}
        </svg>
    ),
    Extraction: (
        <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="80" height="80" rx="16" fill="#fee2e2" />
            <path d="M30 20 Q40 14 50 20 Q56 30 52 40 L44 62 Q42 66 40 62 Q38 66 36 62 L28 40 Q24 30 30 20Z" fill="white" stroke="#dc2626" strokeWidth="2" />
            <path d="M32 28 Q40 24 48 28" stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <path d="M55 52 L65 62" stroke="#dc2626" strokeWidth="3" strokeLinecap="round" />
            <path d="M65 52 L55 62" stroke="#dc2626" strokeWidth="3" strokeLinecap="round" />
        </svg>
    ),
    'Gum Surgery': (
        <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="80" height="80" rx="16" fill="#fce7f3" />
            <path d="M15 45 Q40 30 65 45" stroke="#db2777" strokeWidth="3" strokeLinecap="round" fill="none" />
            <rect x="26" y="32" width="10" height="22" rx="5" fill="white" stroke="#db2777" strokeWidth="1.5" />
            <rect x="42" y="30" width="10" height="24" rx="5" fill="white" stroke="#db2777" strokeWidth="1.5" />
            <path d="M15 50 Q40 38 65 50" stroke="#db2777" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.4" />
        </svg>
    ),
    General: (
        <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="80" height="80" rx="16" fill="#e0f2fe" />
            <path d="M25 22 Q40 14 55 22 Q62 34 58 46 L50 64 Q47 68 44 64 L40 56 L36 64 Q33 68 30 64 L22 46 Q18 34 25 22Z" fill="white" stroke="#1a6b8a" strokeWidth="2" />
            <circle cx="40" cy="36" r="8" fill="#e0f2fe" stroke="#1a6b8a" strokeWidth="1.5" />
            <path d="M36 36 L39 39 L44 33" stroke="#1a6b8a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
    ),
    'Smile Design': (
        <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="80" height="80" rx="16" fill="#fef9c3" />
            <circle cx="40" cy="40" r="22" fill="white" stroke="#ca8a04" strokeWidth="2" />
            <path d="M28 42 Q40 54 52 42" stroke="#ca8a04" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <circle cx="32" cy="34" r="3" fill="#ca8a04" />
            <circle cx="48" cy="34" r="3" fill="#ca8a04" />
        </svg>
    )
};

export default function ServiceIcon({ name, size = 80 }) {
    const icon = icons[name] || icons['General'];
    return (
        <div style={{ width: size, height: size, flexShrink: 0 }}>
            {React.cloneElement(icon, { width: size, height: size })}
        </div>
    );
}
