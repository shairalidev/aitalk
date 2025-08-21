// Enhanced ChatArea with reliable audio playback using react-speech-kit
import React, { useState, useEffect, useRef } from 'react';
import { useSpeechSynthesis } from 'react-speech-kit';
import { sendMessage, fetchChatMessages } from '../api';
import InputArea from './InputArea';
import FAQ from './FAQ';
import './ChatArea.css';
import jesus from '../img/jesus.jpeg'

function ChatArea({ chatId, updateChatList, currentView }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [streamingResponse, setStreamingResponse] = useState("");
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Audio playback state
  const [currentPlayingIndex, setCurrentPlayingIndex] = useState(null);
  const [audioProgress, setAudioProgress] = useState({});
  
  // Enhanced speech synthesis with better control
  const {
    speak,
    cancel,
    speaking,
    supported,
    voices
  } = useSpeechSynthesis({
    onEnd: () => {
      debugLog('Speech ended naturally');
      setCurrentPlayingIndex(null);
      setAudioProgress(prev => {
        const updated = { ...prev };
        delete updated[currentPlayingIndex];
        return updated;
      });
    },
    onError: (error) => {
      debugLog('Speech error:', error);
      setCurrentPlayingIndex(null);
    }
  });

  // Alternative: Custom Audio Manager for better control
  const audioManagerRef = useRef(null);
  const [isUsingCustomAudio, setIsUsingCustomAudio] = useState(false);

  // Debug logging function
  const debugLog = (message, data = null) => {
    console.log(`[Enhanced TTS] ${message}`, data || '');
  };

  // Custom Audio Manager Class
  class CustomAudioManager {
    constructor() {
      this.currentAudio = null;
      this.currentIndex = null;
      this.isPlaying = false;
      this.isPaused = false;
      this.audioQueue = [];
    }

    async textToSpeech(text, messageIndex, options = {}) {
      debugLog(`Converting text to speech for message ${messageIndex}`);
      
      // Stop any currently playing audio
      this.stop();

      try {
        // Using a more reliable approach - convert text to audio blob
        // This could be replaced with a TTS service API call
        const audioBlob = await this.synthesizeToBlob(text, options);
        const audioUrl = URL.createObjectURL(audioBlob);
        
        const audio = new Audio(audioUrl);
        audio.preload = 'auto';
        
        // Set up event listeners
        audio.addEventListener('loadstart', () => debugLog('Audio loading started'));
        audio.addEventListener('canplay', () => debugLog('Audio can start playing'));
        audio.addEventListener('play', () => {
          debugLog('Audio started playing');
          this.isPlaying = true;
          this.isPaused = false;
          this.currentIndex = messageIndex;
        });
        audio.addEventListener('pause', () => {
          debugLog('Audio paused');
          this.isPlaying = false;
          this.isPaused = true;
        });
        audio.addEventListener('ended', () => {
          debugLog('Audio ended');
          this.cleanup();
        });
        audio.addEventListener('error', (e) => {
          debugLog('Audio error:', e);
          this.cleanup();
        });

        this.currentAudio = audio;
        return audio;

      } catch (error) {
        debugLog('Error creating audio:', error);
        throw error;
      }
    }

    async synthesizeToBlob(text, options = {}) {
      // Method 1: Using SpeechSynthesisUtterance with MediaRecorder (if supported)
      if ('SpeechSynthesisUtterance' in window && 'MediaRecorder' in window) {
        try {
          return await this.recordSpeechSynthesis(text, options);
        } catch (error) {
          debugLog('MediaRecorder approach failed, trying alternative:', error);
        }
      }

      // Method 2: Using Web Speech API directly (fallback)
      return this.createSilentAudio(); // Placeholder for demonstration
    }

    async recordSpeechSynthesis(text, options = {}) {
      return new Promise((resolve, reject) => {
        // Create a destination for recording
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const destination = audioContext.createMediaStreamDestination();
        
        // Create speech synthesis
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = options.rate || 0.75;
        utterance.pitch = options.pitch || 0.3;
        utterance.volume = options.volume || 1;

        // Set voice
        if (options.voice) {
          utterance.voice = options.voice;
        } else {
          const voices = speechSynthesis.getVoices();
          const preferredVoice = voices.find(voice => 
            voice.lang.startsWith('en') && 
            (voice.name.includes('Male') || voice.name.includes('male'))
          ) || voices.find(voice => voice.lang.startsWith('en')) || voices[0];
          
          if (preferredVoice) utterance.voice = preferredVoice;
        }

        // Set up MediaRecorder
        const mediaRecorder = new MediaRecorder(destination.stream);
        const chunks = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) chunks.push(event.data);
        };

        mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'audio/webm' });
          resolve(blob);
        };

        utterance.onend = () => {
          mediaRecorder.stop();
          audioContext.close();
        };

        utterance.onerror = (error) => {
          mediaRecorder.stop();
          audioContext.close();
          reject(error);
        };

        // Start recording and speaking
        mediaRecorder.start();
        speechSynthesis.speak(utterance);
      });
    }

    createSilentAudio() {
      // Create a minimal audio blob for fallback
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const buffer = audioContext.createBuffer(1, audioContext.sampleRate * 0.1, audioContext.sampleRate);
      
      // Convert buffer to blob (simplified - in real implementation you'd encode properly)
      const arrayBuffer = new ArrayBuffer(buffer.length * 2);
      const view = new Uint8Array(arrayBuffer);
      
      return new Blob([view], { type: 'audio/wav' });
    }

    play() {
      if (this.currentAudio) {
        debugLog('Playing audio');
        return this.currentAudio.play();
      }
    }

    pause() {
      if (this.currentAudio) {
        debugLog('Pausing audio');
        this.currentAudio.pause();
      }
    }

    stop() {
      if (this.currentAudio) {
        debugLog('Stopping audio');
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
        this.cleanup();
      }
    }

    cleanup() {
      if (this.currentAudio) {
        const url = this.currentAudio.src;
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      }
      this.currentAudio = null;
      this.currentIndex = null;
      this.isPlaying = false;
      this.isPaused = false;
    }
  }

  useEffect(() => {
    // Initialize audio manager
    audioManagerRef.current = new CustomAudioManager();
    debugLog('Audio manager initialized');

    // Check if react-speech-kit is working properly
    if (!supported) {
      debugLog('Speech synthesis not supported, will use custom audio manager');
      setIsUsingCustomAudio(true);
    } else {
      debugLog('Speech synthesis supported, using react-speech-kit');
    }

    return () => {
      if (audioManagerRef.current) {
        audioManagerRef.current.stop();
      }
    };
  }, [supported]);

  useEffect(() => {
    if (chatId && currentView === 'chat') {
      loadMessages();
    } else {
      setMessages([]);
    }
  }, [chatId, currentView]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingResponse]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadMessages = async () => {
    try {
      debugLog('Loading messages...');
      const chatMessages = await fetchChatMessages(chatId);
      setMessages(chatMessages);
      debugLog('Messages loaded:', chatMessages.length);
    } catch (err) {
      console.error('Failed to load messages:', err);
      setError('Failed to load messages: ' + err.message);
    }
  };

  // Enhanced play/pause with multiple fallback strategies
  const handlePlayPause = async (text, messageIndex) => {
    debugLog(`=== Enhanced Play/Pause for message ${messageIndex} ===`);
    debugLog('Current state:', { 
      currentPlayingIndex, 
      speaking, 
      isUsingCustomAudio,
      audioManagerState: audioManagerRef.current ? {
        isPlaying: audioManagerRef.current.isPlaying,
        isPaused: audioManagerRef.current.isPaused,
        currentIndex: audioManagerRef.current.currentIndex
      } : null
    });

    // Strategy 1: Use custom audio manager (most reliable)
    if (isUsingCustomAudio || !supported) {
      return handleCustomAudioPlayPause(text, messageIndex);
    }

    // Strategy 2: Use react-speech-kit with enhancements
    return handleSpeechKitPlayPause(text, messageIndex);
  };

  const handleCustomAudioPlayPause = async (text, messageIndex) => {
    const manager = audioManagerRef.current;
    
    if (currentPlayingIndex === messageIndex) {
      if (manager.isPlaying) {
        debugLog('Pausing custom audio');
        manager.pause();
        setCurrentPlayingIndex(messageIndex); // Keep index but mark as paused
      } else if (manager.isPaused) {
        debugLog('Resuming custom audio');
        await manager.play();
      }
      return;
    }

    // Start new audio
    try {
      debugLog('Starting new custom audio');
      setCurrentPlayingIndex(messageIndex);
      
      const audio = await manager.textToSpeech(text, messageIndex, {
        rate: 0.75,
        pitch: 0.3,
        volume: 1
      });
      
      await audio.play();
      
    } catch (error) {
      debugLog('Custom audio failed:', error);
      setCurrentPlayingIndex(null);
      // Fallback to basic speech synthesis
      handleBasicSpeechSynthesis(text, messageIndex);
    }
  };

  const handleSpeechKitPlayPause = (text, messageIndex) => {
    if (speaking && currentPlayingIndex === messageIndex) {
      debugLog('Canceling speech (react-speech-kit doesn\'t support pause)');
      cancel();
      setCurrentPlayingIndex(null);
      return;
    }

    if (speaking) {
      cancel();
    }

    debugLog('Starting speech with react-speech-kit');
    setCurrentPlayingIndex(messageIndex);

    // Get preferred voice
    const preferredVoice = voices.find(voice => 
      voice.lang.startsWith('en') && 
      (voice.name.toLowerCase().includes('male') || 
       voice.name.toLowerCase().includes('bass') || 
       voice.name.toLowerCase().includes('baritone'))
    ) || voices.find(voice => voice.lang.startsWith('en')) || voices[0];

    speak({ 
      text,
      voice: preferredVoice,
      rate: 0.75,
      pitch: 0.3,
      volume: 1
    });
  };

  const handleBasicSpeechSynthesis = (text, messageIndex) => {
    debugLog('Using basic speech synthesis as final fallback');
    
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.75;
      utterance.pitch = 0.3;
      utterance.volume = 1;

      utterance.onstart = () => setCurrentPlayingIndex(messageIndex);
      utterance.onend = () => setCurrentPlayingIndex(null);
      utterance.onerror = () => setCurrentPlayingIndex(null);

      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSendMessage = async (content) => {
    debugLog('Sending message...');
    setLoading(true);
    setError(null);
    setStreamingResponse("");

    const userMessage = { role: 'user', content };
    setMessages(prevMessages => [...prevMessages, userMessage]);

    try {
      const response = await sendMessage(chatId, content, (partialResponse) => {
        setStreamingResponse(partialResponse);
      });

      setMessages(prevMessages => [...prevMessages, response]);
      setStreamingResponse("");

      updateChatList({
        id: chatId,
        title: content.slice(0, 30) + (content.length > 30 ? "..." : ""),
        messages: [...messages, userMessage, response]
      });

    } catch (err) {
      console.error('Failed to send message:', err);
      setError(`Failed to send message: ${err.message}. Please try again.`);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  // Determine current state for UI
  const getPlaybackState = (messageIndex) => {
    if (currentPlayingIndex !== messageIndex) return 'idle';
    
    if (isUsingCustomAudio) {
      const manager = audioManagerRef.current;
      if (manager.isPlaying) return 'playing';
      if (manager.isPaused) return 'paused';
    } else {
      if (speaking) return 'playing';
    }
    
    return 'idle';
  };

  if (currentView === 'faq') {
    return <FAQ />;
  }

  return (
    <div className="chat-area">
      <div className="chat-header">
        <div className="header-content">
          <div className="avatar">
            <img src={jesus} alt="Jesus" />
            <div className="online-indicator"></div>
          </div>
          <div className="user-info">
            <p className="username">Jesus</p>
            <p className="status">Online</p>
          </div>
        </div>
      </div>
      
      <div className="messages">
        {messages.map((msg, index) => {
          const playbackState = getPlaybackState(index);
          
          return (
            <div key={index} className={`message ${msg.role}`}>
              <strong>{msg.role === 'user' ? 'You' : 'Jesus'}</strong>
              <div className="message-content">{msg.content}</div>

              {msg.role === 'model' && (
                <div className="audio-controls">
                  <button
                    className={`play-btn ${playbackState}`}
                    title={
                      playbackState === 'playing' ? "Pause response" :
                      playbackState === 'paused' ? "Resume response" :
                      "Play response"
                    }
                    onClick={() => handlePlayPause(msg.content, index)}
                    disabled={loading}
                  >
                    {playbackState === 'playing' ? (
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <rect x="7" y="6" width="4" height="12" rx="1" />
                        <rect x="13" y="6" width="4" height="12" rx="1" />
                      </svg>
                    ) : playbackState === 'paused' ? (
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="8,5 19,12 8,19" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="1.5"/>
                        <polygon points="10,8 16,12 10,16" />
                      </svg>
                    )}
                  </button>
                  
                  {playbackState !== 'idle' && (
                    <button
                      className="stop-btn"
                      title="Stop playback"
                      onClick={() => {
                        if (isUsingCustomAudio) {
                          audioManagerRef.current?.stop();
                        } else {
                          cancel();
                        }
                        setCurrentPlayingIndex(null);
                      }}
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <rect x="6" y="6" width="12" height="12" rx="1" />
                      </svg>
                    </button>
                  )}
                  
                  <span className="audio-status">
                    {playbackState === 'playing' && '🔊'}
                    {playbackState === 'paused' && '⏸️'}
                    {isUsingCustomAudio && playbackState !== 'idle' && ' (Enhanced)'}
                  </span>
                </div>
              )}
            </div>
          );
        })}

        {streamingResponse && (
          <div className="message model">
            <strong>Jesus</strong>
            <div className="message-content">{streamingResponse}</div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {error && (
        <div className="error">
          {error}
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}

      {loading && <div className="loading">Jesus is typing a response...</div>}

      <InputArea onSendMessage={handleSendMessage} inputRef={inputRef} />
      
      {/* Debug info */}
      <div style={{ 
        position: 'fixed', 
        bottom: '10px', 
        right: '10px', 
        background: 'rgba(0,0,0,0.7)', 
        color: 'white', 
        padding: '5px', 
        fontSize: '10px',
        borderRadius: '3px'
      }}>
        Audio: {isUsingCustomAudio ? 'Custom' : 'SpeechKit'} | 
        Playing: {currentPlayingIndex !== null ? currentPlayingIndex : 'None'}
      </div>
    </div>
  );
}

export default ChatArea;