import React, { useState, useRef } from 'react';
import MicIcon from '@mui/icons-material/Mic';
import StopIcon from '@mui/icons-material/Stop';
import CircularProgress from '@mui/material/CircularProgress';

const AudioRecorder = ({ onTranscriptionComplete }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/m4a' });
        await sendAudioToServer(audioBlob);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Error accessing microphone. Please ensure you have granted microphone permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsProcessing(true);
      
      // Stop all audio tracks
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const sendAudioToServer = async (audioBlob) => {
    try {
      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.m4a');

      const response = await fetch(`${process.env.REACT_APP_API_URL}/transcribe`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Transcription failed');
      }

      const data = await response.json();
      onTranscriptionComplete(data.transcription);
    } catch (error) {
      console.error('Error sending audio to server:', error);
      alert('Error processing audio. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="audio-recorder">
      <button
        onClick={isRecording ? stopRecording : startRecording}
        disabled={isProcessing}
        className={`record-button ${isRecording ? 'recording' : ''} ${isProcessing ? 'processing' : ''}`}
        aria-label={isRecording ? 'Stop recording' : 'Start recording'}
      >
        {isProcessing ? (
          <CircularProgress size={24} color="inherit" />
        ) : isRecording ? (
          <StopIcon fontSize="medium" />
        ) : (
          <MicIcon fontSize="medium" />
        )}
      </button>
      <style jsx>{`
        .audio-recorder {
          display: flex;
          align-items: center;
          height: 48px;
        }
        .record-button {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          border: none;
          cursor: pointer;
          background-color: #4CAF50;
          color: white;
          box-shadow: 0 2px 8px rgba(44,62,80,0.08);
          transition: background 0.2s, box-shadow 0.2s;
          outline: none;
        }
        .record-button:hover:not(:disabled) {
          background-color: #45a049;
        }
        .record-button.recording {
          background-color: #f44336;
          animation: pulse 1.5s infinite;
        }
        .record-button.processing {
          background-color: #9e9e9e;
          cursor: not-allowed;
        }
        @keyframes pulse {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
          100% {
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
};

export default AudioRecorder; 