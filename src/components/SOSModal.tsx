import React, { useEffect, useState, useCallback } from 'react';
import { Phone, X, VolumeX, AlertTriangle, RotateCcw } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { useAudio } from '../hooks/useAudio';

interface SOSModalProps {
  onClose: () => void;
  emergencyContacts: any[];
}

export const SOSModal: React.FC<SOSModalProps> = ({ onClose, emergencyContacts }) => {
  const { isUrdu } = useLanguage();
  const { playSOS, stopSOS, playClick } = useAudio();
  const [countdown, setCountdown] = useState(5);
  const [isSOSActive, setIsSOSActive] = useState(false);

  const startAlert = useCallback(() => {
    setIsSOSActive(true);
    playSOS();
  }, [playSOS]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0 && !isSOSActive) {
      timer = setTimeout(() => setCountdown(prev => prev - 1), 1000);
    } else if (countdown === 0 && !isSOSActive) {
      startAlert();
    }
    return () => clearTimeout(timer);
  }, [countdown, isSOSActive, startAlert]);

  const handleStop = () => {
    stopSOS();
    setIsSOSActive(false);
    onClose();
  };

  const handleRestart = () => {
    playClick();
    stopSOS();
    setCountdown(5);
    setIsSOSActive(false);
  };

  return (
    <div className="sos-modal-overlay">
      <div className={`sos-modal-content ${isSOSActive ? 'sos-active-pulse' : ''}`}>
        <button className="sos-close-btn" onClick={handleStop}>
          <X size={24} />
        </button>

        <div className="sos-header">
          <AlertTriangle size={64} color="var(--color-danger)" style={{ marginBottom: 16 }} />
          <h2>{isUrdu ? 'ہنگامی مدد' : 'Emergency Help'}</h2>
          <div className="sos-status-badge">
            <div className="pulse-dot" />
            <span>{isSOSActive ? (isUrdu ? 'مدد طلب کی جا رہی ہے' : 'SOS ACTIVE') : (isUrdu ? 'الرٹ بھیجا جا رہا ہے' : 'ALERT SENDING')}</span>
          </div>
        </div>

        {!isSOSActive ? (
          <div className="sos-countdown-container">
            <div className="sos-countdown-circle">
              <span className="sos-countdown-number">{countdown}</span>
            </div>
            <p className="sos-hint">
              {isUrdu ? 'روکنے کے لیے بٹن دبائیں' : 'Press STOP to cancel'}
            </p>
          </div>
        ) : (
          <div className="sos-active-status">
            <p className="sos-active-msg">
              {isUrdu ? 'گھر والوں کو الرٹ بھیج دیا گیا ہے۔' : 'Family has been alerted.'}
            </p>
          </div>
        )}

        <div className="sos-actions">
          {emergencyContacts.map((contact, idx) => (
            <button 
              key={idx} 
              className="btn-sos-call"
              onClick={() => { playClick(); window.location.href = `tel:${contact.phone}`; }}
            >
              <Phone size={24} />
              <div className="call-text">
                <span className="call-label">{isUrdu ? 'فوری کال' : 'Quick Call'}</span>
                <span className="call-name">{contact.name}</span>
              </div>
            </button>
          ))}

          <button className="btn-sos-stop brand-secondary-btn" onClick={handleStop}>
            <VolumeX size={24} />
            <span>{isUrdu ? 'الرٹ ختم کریں' : 'Stop Alert'}</span>
          </button>

          {isSOSActive && (
            <button className="btn-sos-restart-simple" onClick={handleRestart}>
              <RotateCcw size={20} />
              <span>{isUrdu ? 'دوبارہ شروع' : 'Restart'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
