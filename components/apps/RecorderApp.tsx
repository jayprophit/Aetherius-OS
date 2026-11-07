import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Recorder } from '../../apps/aetherius-recorder/src/domain.ts';
import { SimulatedAudioCaptureAdapter, BrowserAudioCaptureAdapter } from '../../apps/aetherius-app-suite/src/index.ts';

export const RecorderApp: React.FC = () => {
  const [storageDir] = useState('test-recorder-ui');
  const [mode, setMode] = useState<'simulated' | 'device'>('simulated');
  const [devices, setDevices] = useState<any[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [permission, setPermission] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [recordings, setRecordings] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [volume, setVolume] = useState(1);

  const recorderRef = useRef<Recorder | null>(null);
  const adapterRef = useRef<any>(null);
  const timerRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Initialize recorder.
  useEffect(() => {
    const adapter = mode === 'device'
      ? new BrowserAudioCaptureAdapter({ maxBufferFrames: 8192 })
      : new SimulatedAudioCaptureAdapter();
    adapterRef.current = adapter;
    const recorder = new Recorder({ storageDir, captureAdapter: adapter });
    recorderRef.current = recorder;
    recorder.load();
    setRecordings(recorder.listRecordings());
  }, [mode, storageDir]);

  // Enumerate devices when switching to device mode.
  useEffect(() => {
    if (mode !== 'device' || !adapterRef.current) return;
    adapterRef.current.enumerateDevices()
      .then((devs: any[]) => {
        setDevices(devs);
        if (devs.length > 0 && !selectedDevice) setSelectedDevice(devs[0].id);
      })
      .catch(() => setDevices([]));
  }, [mode, selectedDevice]);

  // Timer for elapsed time.
  useEffect(() => {
    if (isRecording) {
      timerRef.current = window.setInterval(() => {
        setElapsed((prev) => prev + 1);
      }, 1000);
    } else if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [isRecording]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleRequestPermission = async () => {
    setError(null);
    try {
      if (!adapterRef.current) throw new Error('Adapter not initialized');
      const result = await recorderRef.current!.requestPermission(selectedDevice || undefined);
      setPermission(result);
    } catch (err: any) {
      setError(err.message || 'Permission request failed');
    }
  };

  const handleStart = async () => {
    setError(null);
    try {
      if (!recorderRef.current) throw new Error('Recorder not initialized');
      const result = await recorderRef.current.startSession(mode, selectedDevice || undefined);
      setSession(result);
      setIsRecording(result.state === 'recording');
      setElapsed(0);
      setRecordings(recorderRef.current.listRecordings());
    } catch (err: any) {
      setError(err.message || 'Failed to start recording');
    }
  };

  const handlePause = async () => {
    try {
      if (!session) return;
      const result = await recorderRef.current!.pauseSession(session.id);
      setSession(result);
      setIsRecording(false);
    } catch (err: any) {
      setError(err.message || 'Failed to pause');
    }
  };

  const handleResume = async () => {
    try {
      if (!session) return;
      const result = await recorderRef.current!.resumeSession(session.id);
      setSession(result);
      setIsRecording(true);
    } catch (err: any) {
      setError(err.message || 'Failed to resume');
    }
  };

  const handleStop = async () => {
    try {
      if (!session) return;
      const recording = await recorderRef.current!.stopSession(session.id);
      setSession(null);
      setIsRecording(false);
      setElapsed(0);
      setRecordings(recorderRef.current!.listRecordings());
    } catch (err: any) {
      setError(err.message || 'Failed to stop recording');
    }
  };

  const handlePlay = (recording: any) => {
    if (!recording.path) return;
    if (playingId === recording.id) {
      audioRef.current?.pause();
      setPlayingId(null);
      return;
    }
    if (audioRef.current) {
      audioRef.current.pause();
    }
    const audio = new Audio(recording.path);
    audio.volume = volume;
    audio.play();
    audioRef.current = audio;
    setPlayingId(recording.id);
    audio.onended = () => setPlayingId(null);
  };

  const handleExport = (recording: any) => {
    try {
      const buffer = recorderRef.current!.exportWav(recording.id);
      const blob = new Blob([buffer], { type: 'audio/wav' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${recording.id}.wav`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message || 'Export failed');
    }
  };

  const handleDelete = (id: string) => {
    // Simple UI-side removal; real implementation would delete from storage.
    setRecordings((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-2 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value as any)}
          className="px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-sm"
          aria-label="Capture mode"
        >
          <option value="simulated">Simulated</option>
          <option value="device">Microphone</option>
        </select>

        {mode === 'device' && (
          <select
            value={selectedDevice}
            onChange={(e) => setSelectedDevice(e.target.value)}
            className="px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-sm"
            aria-label="Select microphone"
          >
            {devices.map((d) => (
              <option key={d.id} value={d.id}>{d.label}</option>
            ))}
          </select>
        )}

        {!permission && mode === 'device' && (
          <button onClick={handleRequestPermission} className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
            Request Permission
          </button>
        )}

        {!session && permission && (
          <button onClick={handleStart} className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700">
            Start Recording
          </button>
        )}

        {session && session.state === 'recording' && (
          <>
            <button onClick={handlePause} className="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700">
              Pause
            </button>
            <button onClick={handleStop} className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700">
              Stop
            </button>
          </>
        )}

        {session && session.state === 'paused' && (
          <>
            <button onClick={handleResume} className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700">
              Resume
            </button>
            <button onClick={handleStop} className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700">
              Stop
            </button>
          </>
        )}

        <div className="ml-auto flex items-center gap-2">
          {isRecording && (
            <span className="flex items-center gap-1 text-red-600 text-sm font-medium">
              <span className="w-3 h-3 bg-red-600 rounded-full animate-pulse" />
              REC {formatTime(elapsed)}
            </span>
          )}
          <span className="text-xs text-gray-500">
            {session ? `${session.format.sampleRate} Hz / ${session.format.channels} ch` : 'Ready'}
          </span>
        </div>
      </div>

      {/* Level meter */}
      <div className="h-16 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-end px-4 gap-px">
        {isRecording && (
          <div className="w-full h-4 bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 transition-all duration-75"
               style={{ width: `${Math.min(100, Math.max(5, audioLevel * 100))}%` }} />
        )}
        {!isRecording && <span className="text-xs text-gray-400">Input level</span>}
      </div>

      {/* Error / status */}
      {error && (
        <div className="p-2 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm" role="alert">
          {error}
        </div>
      )}

      {permission && !permission.permissionGranted && (
        <div className="p-2 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 text-sm" role="alert">
          Microphone permission denied. Please grant permission in your browser settings.
        </div>
      )}

      {/* Recordings list */}
      <div className="flex-1 overflow-y-auto p-4">
        <h3 className="text-sm font-semibold mb-2 text-gray-600 dark:text-gray-300">Recordings</h3>
        {recordings.length === 0 && (
          <p className="text-sm text-gray-400">No recordings yet. Start a recording to create one.</p>
        )}
        <div className="space-y-2">
          {recordings.map((rec) => (
            <div key={rec.id} className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
              <button
                onClick={() => handlePlay(rec)}
                className="w-8 h-8 flex items-center justify-center bg-blue-600 text-white rounded-full hover:bg-blue-700"
                aria-label={playingId === rec.id ? 'Stop' : 'Play'}
              >
                {playingId === rec.id ? '■' : '▶'}
              </button>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{rec.id}</div>
                <div className="text-xs text-gray-500">
                  {new Date(rec.createdAt).toLocaleString()} · {(rec.sizeBytes / 1024).toFixed(1)} KB · {rec.sampleRate} Hz
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-20"
                  aria-label="Volume"
                />
                <button onClick={() => handleExport(rec)} className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300">
                  Export
                </button>
                <button onClick={() => handleDelete(rec.id)} className="px-2 py-1 text-xs bg-red-100 dark:bg-red-900/30 text-red-700 rounded hover:bg-red-200">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
