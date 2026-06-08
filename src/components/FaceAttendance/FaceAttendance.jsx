import { useState, useRef, useEffect, useCallback } from 'react';
import { attendanceAPI } from '../../services/api';

export default function FaceAttendance({ onSuccess, onClose }) {
  const videoRef  = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const timerRef  = useRef(null);

  const [step,       setStep]       = useState('starting');
  // starting | register | scanning | processing | success | error
  const [message,    setMessage]    = useState('');
  const [progress,   setProgress]   = useState(0);
  const [dots,       setDots]       = useState('');

  // ── Animated dots ────────────────────────────────────
  useEffect(() => {
    const t = setInterval(() =>
      setDots(d => d.length >= 3 ? '' : d + '.'), 500);
    return () => clearInterval(t);
  }, []);

  // ── Progress bar animation ───────────────────────────
  useEffect(() => {
    if (step === 'scanning') {
      setProgress(0);
      const t = setInterval(() =>
        setProgress(p => p >= 90 ? 90 : p + 10), 200);
      return () => clearInterval(t);
    }
    if (step === 'processing') {
      setProgress(95);
    }
  }, [step]);

  // ── Start camera ─────────────────────────────────────
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      return true;
    } catch {
      setStep('error');
      setMessage('Camera access denied. Please allow camera access.');
      return false;
    }
  }, []);

  // ── Stop camera ───────────────────────────────────────
  const stopCamera = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }, []);

  // ── Capture frame ─────────────────────────────────────
  const captureFrame = () => {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return null;
    canvas.width  = video.videoWidth  || 640;
    canvas.height = video.videoHeight || 480;
    canvas.getContext('2d').drawImage(video, 0, 0);
    return canvas.toDataURL('image/jpeg', 0.9);
  };

  // ── Auto face scan ────────────────────────────────────
  const autoScan = useCallback(async () => {
    setStep('scanning');
    setMessage('Scanning your face');

    // Wait 1.5s for camera to stabilize then capture
    timerRef.current = setTimeout(async () => {
      const image = captureFrame();
      if (!image) return;

      setStep('processing');
      setMessage('Verifying identity');

      try {
        const res = await attendanceAPI.faceCheckIn(image);
        stopCamera();
        setProgress(100);
        setStep('success');
        setMessage(res.data.message || 'Attendance marked!');
        onSuccess && onSuccess({ type: 'checkin', data: res.data });
        // Auto close after 2.5s
        setTimeout(() => onClose && onClose(), 2500);
      } catch (err) {
        const errData = err.response?.data;
        if (errData?.need_registration) {
          // No face registered — auto register
          setStep('register');
          setMessage('First time setup — registering your face');
          timerRef.current = setTimeout(() => autoRegister(), 1500);
        } else {
          // Face not matched — retry once
          setStep('scanning');
          setMessage('Adjusting camera angle');
          timerRef.current = setTimeout(() => retryScan(), 1500);
        }
      }
    }, 1500);
  }, [stopCamera, onSuccess, onClose]); // eslint-disable-line

  // ── Retry scan ────────────────────────────────────────
  const retryScan = useCallback(async () => {
    setStep('scanning');
    setMessage('Retrying face scan');

    timerRef.current = setTimeout(async () => {
      const image = captureFrame();
      if (!image) return;

      setStep('processing');
      setMessage('Verifying identity');

      try {
        const res = await attendanceAPI.faceCheckIn(image);
        stopCamera();
        setProgress(100);
        setStep('success');
        setMessage(res.data.message || 'Attendance marked!');
        onSuccess && onSuccess({ type: 'checkin', data: res.data });
        setTimeout(() => onClose && onClose(), 2500);
      } catch {
        // Failed after retry — show manual option
        setStep('error');
        setMessage('Face not recognized');
      }
    }, 1500);
  }, [stopCamera, onSuccess, onClose]); // eslint-disable-line

  // ── Auto register face ────────────────────────────────
  const autoRegister = useCallback(async () => {
    setStep('scanning');
    setMessage('Capturing your face for registration');

    timerRef.current = setTimeout(async () => {
      const image = captureFrame();
      if (!image) return;

      setStep('processing');
      setMessage('Registering your face');

      try {
        await attendanceAPI.registerFace(image);
        // After register, auto check-in
        setStep('scanning');
        setMessage('Face registered! Checking in now');
        timerRef.current = setTimeout(() => autoScan(), 1000);
      } catch (err) {
        setStep('error');
        setMessage(err.response?.data?.error || 'Could not detect face clearly');
      }
    }, 2000);
  }, [autoScan]); // eslint-disable-line

  // ── Main init ─────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      setStep('starting');
      setMessage('Starting camera');

      const ok = await startCamera();
      if (!ok) return;

      // Check face status
      try {
        const res = await attendanceAPI.faceStatus();

        if (res.data.checked_in_today) {
          stopCamera();
          setProgress(100);
          setStep('success');
          setMessage(`Already checked in today ✅`);
          setTimeout(() => onClose && onClose(), 2000);
          return;
        }

        // Camera ready — start auto scan after 1s
        timerRef.current = setTimeout(() => autoScan(), 1000);

      } catch {
        // face-status failed → just try scanning anyway
        timerRef.current = setTimeout(() => autoScan(), 1000);
      }
    };

    init();
    return () => stopCamera();
  }, []); // eslint-disable-line

  // ── Manual check-in fallback ──────────────────────────
  const handleManual = async () => {
    stopCamera();
    setStep('processing');
    setMessage('Recording manual attendance');
    try {
      await attendanceAPI.checkIn();
      setProgress(100);
      setStep('success');
      setMessage('Manual check-in successful ✅');
      onSuccess && onSuccess({ type: 'manual' });
      setTimeout(() => onClose && onClose(), 2000);
    } catch (err) {
      const msg = err.response?.data?.error || '';
      if (msg.includes('Already')) {
        setProgress(100);
        setStep('success');
        setMessage('Already checked in today ✅');
        setTimeout(() => onClose && onClose(), 2000);
      } else {
        setStep('error');
        setMessage('Manual check-in failed');
      }
    }
  };

  // ── Status colors ─────────────────────────────────────
  const ringColor = {
    starting:   '#6366f1',
    register:   '#f59e0b',
    scanning:   '#6366f1',
    processing: '#f59e0b',
    success:    '#10b981',
    error:      '#ef4444',
  }[step] || '#6366f1';

  return (
    <div style={{
      position:'fixed', inset:0, zIndex:9999,
      background:'rgba(0,0,0,0.92)',
      display:'flex', alignItems:'center', justifyContent:'center',
    }}>
      <div style={{
        background:'#0a0f1e',
        border:`1px solid ${ringColor}33`,
        borderRadius:24, padding:'32px 28px',
        width:420, maxWidth:'95vw', textAlign:'center',
        boxShadow:`0 0 60px ${ringColor}22`,
      }}>

        {/* Header */}
        <div style={{ marginBottom:20 }}>
          <h2 style={{ color:'#fff', fontSize:20, margin:'0 0 4px', fontWeight:700 }}>
            {step === 'success' ? '✅ Checked In!'
           : step === 'error'   ? '⚠️ Action Required'
           : '📷 Face Authentication'}
          </h2>
          <p style={{ color:'#64748b', fontSize:13, margin:0 }}>
            {step === 'success' ? 'Welcome! Have a great day 🎉'
           : step === 'error'   ? 'Face scan unsuccessful'
           : 'Automatic attendance system'}
          </p>
        </div>

        {/* Camera view */}
        {(step !== 'success' && step !== 'error') && (
          <div style={{ position:'relative', marginBottom:20 }}>
            {/* Outer ring */}
            <div style={{
              width:220, height:220, borderRadius:'50%',
              margin:'0 auto', position:'relative',
              border:`3px solid ${ringColor}44`,
              boxShadow:`0 0 30px ${ringColor}33`,
            }}>
              {/* Video circle */}
              <div style={{
                width:'100%', height:'100%',
                borderRadius:'50%', overflow:'hidden',
                position:'relative',
              }}>
                <video
                  ref={videoRef}
                  autoPlay playsInline muted
                  style={{
                    width:'100%', height:'100%',
                    objectFit:'cover', display:'block',
                  }}
                />

                {/* Scanning line animation */}
                {(step === 'scanning' || step === 'processing') && (
                  <div style={{
                    position:'absolute', left:0, right:0,
                    height:2, background:`linear-gradient(90deg, transparent, ${ringColor}, transparent)`,
                    animation:'scanLine 2s linear infinite',
                    top:0,
                  }} />
                )}

                {/* Success overlay */}
                {step === 'processing' && (
                  <div style={{
                    position:'absolute', inset:0,
                    background:'rgba(0,0,0,0.5)',
                    display:'flex', alignItems:'center',
                    justifyContent:'center',
                    borderRadius:'50%',
                  }}>
                    <div style={{
                      width:40, height:40, borderRadius:'50%',
                      border:`3px solid ${ringColor}44`,
                      borderTopColor: ringColor,
                      animation:'spin 0.8s linear infinite',
                    }} />
                  </div>
                )}
              </div>

              {/* Corner brackets */}
              {['tl','tr','bl','br'].map(pos => (
                <div key={pos} style={{
                  position:'absolute',
                  top: pos.includes('t') ? -2 : undefined,
                  bottom: pos.includes('b') ? -2 : undefined,
                  left: pos.includes('l') ? -2 : undefined,
                  right: pos.includes('r') ? -2 : undefined,
                  width:20, height:20,
                  borderTop:    pos.includes('t') ? `3px solid ${ringColor}` : undefined,
                  borderBottom: pos.includes('b') ? `3px solid ${ringColor}` : undefined,
                  borderLeft:   pos.includes('l') ? `3px solid ${ringColor}` : undefined,
                  borderRight:  pos.includes('r') ? `3px solid ${ringColor}` : undefined,
                }} />
              ))}
            </div>

            <canvas ref={canvasRef} style={{ display:'none' }} />
          </div>
        )}

        {/* Success icon */}
        {step === 'success' && (
          <div style={{
            fontSize:80, margin:'20px 0',
            animation:'popIn 0.4s ease',
          }}>✅</div>
        )}

        {/* Error icon */}
        {step === 'error' && (
          <div style={{ fontSize:64, margin:'20px 0' }}>🤔</div>
        )}

        {/* Status message */}
        <div style={{
          color: step === 'success' ? '#34d399'
               : step === 'error'   ? '#f87171'
               : '#e2e8f0',
          fontSize:15, fontWeight:600, marginBottom:8,
        }}>
          {message}{step !== 'success' && step !== 'error' ? dots : ''}
        </div>

        {/* Progress bar */}
        {step !== 'error' && (
          <div style={{
            height:3, background:'rgba(255,255,255,0.08)',
            borderRadius:99, margin:'12px 0 20px', overflow:'hidden',
          }}>
            <div style={{
              height:'100%', borderRadius:99,
              background:`linear-gradient(90deg, ${ringColor}, ${ringColor}88)`,
              width:`${progress}%`,
              transition:'width 0.3s ease',
              boxShadow:`0 0 8px ${ringColor}`,
            }} />
          </div>
        )}

        {/* Step indicator */}
        {step !== 'success' && step !== 'error' && (
          <div style={{
            display:'flex', justifyContent:'center',
            gap:6, marginBottom:20,
          }}>
            {['starting','scanning','processing'].map((s, i) => (
              <div key={s} style={{
                width: s === step ? 20 : 8,
                height:8, borderRadius:99,
                background: ['starting','scanning','processing'].indexOf(step) >= i
                  ? ringColor : 'rgba(255,255,255,0.1)',
                transition:'all 0.3s',
              }} />
            ))}
          </div>
        )}

        {/* Buttons */}
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>

          {step === 'error' && (
            <>
              <button
                onClick={() => {
                  setStep('starting');
                  setProgress(0);
                  startCamera().then(() => {
                    timerRef.current = setTimeout(() => autoScan(), 1000);
                  });
                }}
                style={{
                  padding:'12px', borderRadius:12,
                  background:'linear-gradient(135deg,#6366f1,#8b5cf6)',
                  color:'#fff', border:'none', cursor:'pointer',
                  fontSize:14, fontWeight:700,
                }}
              >
                🔄 Try Again
              </button>

              <button
                onClick={handleManual}
                style={{
                  padding:'12px', borderRadius:12,
                  background:'rgba(16,185,129,0.15)',
                  color:'#34d399',
                  border:'1px solid rgba(16,185,129,0.3)',
                  cursor:'pointer', fontSize:14, fontWeight:600,
                }}
              >
                ✋ Manual Check-In
              </button>
            </>
          )}

          {/* Skip button — always available */}
          {step !== 'success' && (
            <button
              onClick={() => { stopCamera(); onClose && onClose(); }}
              style={{
                padding:'10px', borderRadius:12,
                background:'transparent',
                color:'#475569', border:'none',
                cursor:'pointer', fontSize:13,
              }}
            >
              Skip for now
            </button>
          )}
        </div>

      </div>

      {/* Animations */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes scanLine {
          0%   { top: 0%; }
          50%  { top: 95%; }
          100% { top: 0%; }
        }
        @keyframes popIn {
          0%   { transform: scale(0.5); opacity: 0; }
          80%  { transform: scale(1.1); }
          100% { transform: scale(1);   opacity: 1; }
        }
      `}</style>
    </div>
  );
}