import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';

interface IconButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
}

function IconButton({ icon, label, onClick, disabled }: IconButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-col items-center justify-center w-24 h-24 rounded-lg transition-all ${
        disabled 
          ? 'opacity-40 cursor-not-allowed' 
          : 'bg-[#3a3a3a] hover:bg-[#4a4a4a] cursor-pointer active:scale-95'
      }`}
    >
      <div className="text-gray-300 mb-2">{icon}</div>
      <span className="text-xs text-gray-400">{label}</span>
    </button>
  );
}

export function WelcomeScreen() {
  const navigate = useNavigate();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  return (
    <div className="flex flex-col h-screen bg-[#2a2a2a]">
      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center">
        <div className="flex gap-6">
          <IconButton
            icon={
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" strokeWidth="1.5" />
                <path d="M8 12l2 2 4-4" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            }
            label="Verificación"
          />
          <IconButton
            icon={
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="3" y="3" width="7" height="7" strokeWidth="1.5" rx="1" />
                <rect x="14" y="3" width="7" height="7" strokeWidth="1.5" rx="1" />
                <rect x="3" y="14" width="7" height="7" strokeWidth="1.5" rx="1" />
                <rect x="14" y="14" width="7" height="7" strokeWidth="1.5" rx="1" />
              </svg>
            }
            label="Panel"
          />
          <IconButton
            icon={
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="8" r="4" strokeWidth="1.5" />
                <path d="M6 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" strokeWidth="1.5" />
              </svg>
            }
            label="Examen"
            onClick={() => navigate('/scheduler')}
          />
          <IconButton
            icon={
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="5" y="11" width="14" height="10" rx="2" strokeWidth="1.5" />
                <path d="M12 11V7a2 2 0 012-2h2a2 2 0 012 2v4" strokeWidth="1.5" />
                <circle cx="12" cy="16" r="1" fill="currentColor" />
              </svg>
            }
            label="Bloqueo"
          />
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="h-8 bg-black flex items-center justify-between px-4">
        <Link to="/admin" className="text-xs text-gray-600 hover:text-gray-400">
          ⚙ Admin
        </Link>
        <div className="text-xs text-gray-500">MRI Console</div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-gray-400 font-mono">{formatTime(time)}</span>
          <button className="flex items-center gap-1 text-gray-400 hover:text-gray-200">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}