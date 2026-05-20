import React, { useState, useRef, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import axios from 'axios';

interface BiometricVerificationProps {
  onVerified: () => void;
  onExpire: () => void;
  isVerified: boolean;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export default function BiometricVerification({ onVerified, onExpire, isVerified }: BiometricVerificationProps) {
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [documentPreview, setDocumentPreview] = useState<string | null>(null);
  const [selfieSrc, setSelfieSrc] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  
  const CHALLENGES = [
    { type: 'look_left', text: '1/3: Gire la cabeza a la IZQUIERDA.' },
    { type: 'look_right', text: '2/3: Gire la cabeza a la DERECHA.' },
    { type: 'look_up', text: '3/3: Mire ligeramente hacia ARRIBA.' }
  ];

  const [challengeStep, setChallengeStep] = useState<number>(0);
  const [challengeTimeLeft, setChallengeTimeLeft] = useState<number | null>(null);

  const webcamRef = useRef<Webcam>(null);

  const startCapture = () => {
    setError(null);
    setResult(null);
    setIsCapturing(true);
    setChallengeTimeLeft(10);
  };

  // Reset del step si se cancela o falla
  const resetChallenge = () => {
    setIsCapturing(false);
    setSelfieSrc(null);
    setChallengeStep(0);
    setChallengeTimeLeft(null);
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isCapturing && challengeTimeLeft !== null) {
      if (challengeTimeLeft > 0) {
        interval = setInterval(() => {
          setChallengeTimeLeft(prev => prev !== null ? prev - 1 : null);
        }, 1000);
      } else {
        resetChallenge();
        setError("Tiempo agotado para la prueba de vida. Por favor, inténtelo nuevamente.");
      }
    }
    return () => clearInterval(interval);
  }, [isCapturing, challengeTimeLeft]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isVerified) {
      const updateTime = () => {
        const timestamp = localStorage.getItem('biometricTimestamp');
        const parsedTimestamp = timestamp ? parseInt(timestamp, 10) : NaN;
        
        if (!timestamp || isNaN(parsedTimestamp) || parsedTimestamp <= 0) {
           setTimeLeft(0);
           onExpire();
           return;
        }

        const diff = (30 * 60 * 1000) - (Date.now() - parsedTimestamp);
        if (diff > 0) {
          setTimeLeft(Math.floor(diff / 1000));
        } else {
          setTimeLeft(0);
          onExpire(); // Invalidación por tiempo superado
        }
      };
      
      updateTime();
      interval = setInterval(updateTime, 1000);
    }
    return () => clearInterval(interval);
  }, [isVerified, onExpire]);

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.size > MAX_FILE_SIZE) {
        setError('El archivo supera el tamaño máximo permitido (5MB).');
        return;
      }
      setDocumentFile(file);
      const url = URL.createObjectURL(file);
      setDocumentPreview(url);
    }
  };

  const captureSelfie = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      
      if (imageSrc) {
          const stringLength = imageSrc.length - 'data:image/jpeg;base64,'.length;
          const sizeInBytes = 4 * Math.ceil((stringLength / 3)) * 0.5624896334383812;
          if (sizeInBytes > MAX_FILE_SIZE) {
            setError('La imagen de la cámara es demasiado pesada.');
            return;
          }
      }
      
      setSelfieSrc(imageSrc);
      setIsCapturing(false);
    }
  }, [webcamRef]);

  const retakeSelfie = () => {
    setSelfieSrc(null);
    startCapture();
  };

  const dataURLtoFile = (dataurl: string, filename: string) => {
    var arr = dataurl.split(','),
        mimeMatch = arr[0].match(/:(.*?);/),
        mime = mimeMatch ? mimeMatch[1] : 'image/jpeg',
        bstr = atob(arr[1]), 
        n = bstr.length, 
        u8arr = new Uint8Array(n);
        
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, {type:mime});
  };

  const handleVerify = useCallback(async () => {
    if (!documentFile || !selfieSrc) return;
    
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      const selfieFile = dataURLtoFile(selfieSrc, 'selfie.jpg');
      const formData = new FormData();
      formData.append('document_image', documentFile);
      formData.append('selfie_image', selfieFile);
      
      const currentChallenge = CHALLENGES[challengeStep];
      formData.append('challenge_type', currentChallenge.type);
      
      const response = await axios.post('http://localhost:8000/api/biometric/verify/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setResult(response.data);
      if (response.data.verified) {
        if (challengeStep < 2) {
          setChallengeStep(prev => prev + 1);
          setSelfieSrc(null);
          startCapture();
        } else {
          if (documentPreview) URL.revokeObjectURL(documentPreview);
          setDocumentPreview(null);
          setDocumentFile(null);
          setSelfieSrc(null);
          setChallengeStep(0);
          onVerified();
        }
      } else {
         resetChallenge();
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Error de conexión con el servidor de validación.");
      resetChallenge();
    } finally {
      setLoading(false);
    }
  }, [documentFile, selfieSrc, challengeStep, documentPreview, onVerified]);

  useEffect(() => {
    if (selfieSrc && !isCapturing && documentFile && !loading) {
      handleVerify();
    }
  }, [selfieSrc, isCapturing, documentFile, loading, handleVerify]);


  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (isVerified) {
    return (
      <div className="rounded-3xl border border-brand-500/30 bg-brand-500/5 p-8 shadow-[0_0_30px_rgba(59,130,246,0.15)] relative overflow-hidden transition-all duration-500 animate-fade-in">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-brand-500/20 blur-3xl rounded-full"></div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-center gap-5">
            <div className="p-4 bg-brand-500 text-white rounded-2xl shadow-lg shadow-brand-500/30">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h3 className="text-xl font-black text-brand-500 uppercase tracking-widest">Identidad Verificada</h3>
                <span className="bg-brand-500 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full">Activa</span>
              </div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                Acceso a funciones avanzadas desbloqueado.
              </p>
            </div>
          </div>
          {timeLeft !== null && (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-4 py-2 rounded-xl shadow-sm self-start sm:self-auto flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase">Expira en</p>
                <p className="text-lg font-black text-gray-900 dark:text-white font-mono">{formatTime(timeLeft)}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-6 md:p-8 shadow-sm dark:border-gray-800 dark:bg-slate-900 transition-all">
      <div className="mb-6">
        <h3 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
          <svg className="w-6 h-6 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"></path></svg>
          Validación Biométrica Requerida
        </h3>
        <p className="text-sm text-gray-500 mt-1 font-medium">
          Sube tu documento de identidad y completa la prueba de vida secuencial para desbloquear el Simulador Financiero Avanzado.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Paso 1: Documento */}
        <div className="space-y-3">
          <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">PASO 1: Documento</h4>
          <div className="h-64 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden bg-gray-50 dark:bg-black/20 group hover:border-brand-500 transition-colors">
            {documentPreview ? (
              <img src={documentPreview} alt="Documento" className="absolute inset-0 w-full h-full object-cover opacity-80" />
            ) : (
              <svg className="w-10 h-10 text-gray-400 mb-2 group-hover:text-brand-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-white text-xs font-bold bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm">Seleccionar Imagen</span>
            </div>
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleDocumentChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
        </div>

        {/* Paso 2: Selfie Secuencial */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">PASO 2: Liveness 3D</h4>
            <div className="flex gap-1">
              {[0, 1, 2].map((step) => (
                <div key={step} className={`h-1.5 w-6 rounded-full transition-all duration-500 ${step < challengeStep ? 'bg-green-500' : step === challengeStep ? 'bg-brand-500 animate-pulse' : 'bg-gray-300 dark:bg-gray-700'}`} />
              ))}
            </div>
          </div>
          <div className="h-64 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden bg-black border border-gray-200 dark:border-gray-800 shadow-inner">
            {!isCapturing && !selfieSrc ? (
              <div className="text-center w-full h-full flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800">
                <svg className="w-10 h-10 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                <button 
                  onClick={startCapture}
                  disabled={!documentFile}
                  className="px-4 py-2 bg-gray-900 text-white dark:bg-white dark:text-gray-900 rounded-lg text-xs font-bold hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100"
                >
                  {documentFile ? 'Iniciar Escaneo' : 'Sube Documento Primero'}
                </button>
              </div>
            ) : isCapturing ? (
              <>
                <Webcam
                  audio={false}
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  videoConstraints={{ facingMode: "user" }}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                
                {/* Contorno Óvalo BCP Style */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                  <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <ellipse cx="50" cy="50" rx="35" ry="45" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeDasharray="5,5" />
                    {challengeStep > 0 && (
                      <ellipse cx="50" cy="50" rx="35" ry="45" fill="none" stroke="#22c55e" strokeWidth="2"
                               strokeDasharray="255" strokeDashoffset={255 - (255 * challengeStep / 3)}
                               className="transition-all duration-1000 ease-out" />
                    )}
                  </svg>
                </div>

                <div className="absolute top-3 left-0 right-0 mx-auto w-11/12 bg-black/80 backdrop-blur-md p-3 rounded-xl border border-brand-500/50 flex flex-col items-center shadow-2xl animate-fade-in z-20">
                  <span className="text-[10px] uppercase font-black tracking-widest text-brand-400 mb-1">Mire dentro del óvalo</span>
                  <span className="text-sm font-bold text-white text-center leading-tight">{CHALLENGES[challengeStep].text}</span>
                  <span className={`text-xs font-mono font-bold mt-1.5 ${challengeTimeLeft && challengeTimeLeft <= 3 ? 'text-red-500 animate-pulse' : 'text-gray-300'}`}>00:{challengeTimeLeft?.toString().padStart(2, '0')}</span>
                </div>
                <button 
                  onClick={captureSelfie}
                  className="absolute bottom-6 px-8 py-3 bg-brand-500 text-white rounded-full text-xs font-black tracking-widest shadow-[0_0_20px_rgba(59,130,246,0.6)] hover:bg-brand-400 transition-all hover:scale-105 active:scale-95 z-20"
                >
                  TOMAR FOTO
                </button>
              </>
            ) : (
              <>
                <img src={selfieSrc!} alt="Selfie" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-sm z-10">
                  <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-xs font-bold text-red-500 flex items-center gap-3">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
          {error}
        </div>
      )}

      {result && !result.verified && (
        <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-3">
          <svg className="w-5 h-5 flex-shrink-0 text-amber-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          <div>
            <p className="text-xs font-bold text-amber-500">{result.message || result.error}</p>
            {result.similarity !== undefined && result.similarity !== null && (
               <p className="text-[10px] text-amber-500/70 mt-1 font-medium">Nivel de Similitud: {result.similarity}% (Requerido: 85%)</p>
            )}
          </div>
        </div>
      )}

      <div className="border-t border-gray-100 dark:border-white/5 pt-6">
        <p className="text-[9px] text-gray-400 font-medium leading-relaxed italic text-center">
          Tus imágenes son procesadas de manera segura y temporal en memoria. No almacenamos datos biométricos en nuestros servidores.
        </p>
      </div>
    </div>
  );
}
