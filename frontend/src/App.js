import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Container,
  TextField,
  Button,
  Paper,
  Typography,
  CircularProgress,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  IconButton,
  useTheme,
  Avatar,
  Switch,
  FormControlLabel,
  Tooltip,
  useMediaQuery,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PersonIcon from '@mui/icons-material/Person';
import MenuIcon from '@mui/icons-material/Menu';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import StopIcon from '@mui/icons-material/Stop';
import MicIcon from '@mui/icons-material/Mic';
import axios from 'axios';
import AudioRecorder from './AudioRecorder';

const DRAWER_WIDTH = 280;

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const [speakingMessageIndex, setSpeakingMessageIndex] = useState(null);
  const messagesEndRef = useRef(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    // Set initial drawer state based on screen size
    setDrawerOpen(!isMobile);
  }, [isMobile]);

  // Initialize speech synthesis
  const speak = (text, messageIndex) => {
    if (!speechEnabled) return;
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Get available voices and set a good default
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(voice => 
      voice.name.includes('Google') || 
      voice.name.includes('Microsoft') || 
      voice.name.includes('Samantha')
    );
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
      setSpeakingMessageIndex(messageIndex);
    };
    utterance.onend = () => {
      setIsSpeaking(false);
      setSpeakingMessageIndex(null);
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      setSpeakingMessageIndex(null);
    };

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setSpeakingMessageIndex(null);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const clearChat = () => {
    setMessages([]);
    stopSpeaking();
  };

  const handleTranscriptionComplete = (transcription) => {
    setInput(transcription);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/chat`, {
        message: userMessage
      });
      
      const botResponse = response.data.response;
      const newMessageIndex = messages.length + 1;
      setMessages(prev => [...prev, { role: 'assistant', content: botResponse }]);
      speak(botResponse, newMessageIndex);
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = 'Sorry, I encountered an error. Please try again.';
      const newMessageIndex = messages.length + 1;
      setMessages(prev => [...prev, { role: 'assistant', content: errorMessage }]);
      speak(errorMessage, newMessageIndex);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh', bgcolor: '#f0f2f6' }}>
      {/* Sidebar */}
      <Drawer
        variant={isMobile ? "temporary" : "persistent"}
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            bgcolor: '#ffffff',
            borderRight: '1px solid rgba(0, 0, 0, 0.12)',
          },
        }}
      >
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <SmartToyIcon sx={{ color: theme.palette.primary.main }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Voice Bot
          </Typography>
        </Box>
        <Divider />
        <List>
          <ListItem button onClick={clearChat}>
            <ListItemText primary="New Chat" />
          </ListItem>
          <ListItem>
            <FormControlLabel
              control={
                <Switch
                  checked={speechEnabled}
                  onChange={(e) => {
                    setSpeechEnabled(e.target.checked);
                    if (!e.target.checked) {
                      stopSpeaking();
                    }
                  }}
                  color="primary"
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {speechEnabled ? <VolumeUpIcon /> : <VolumeOffIcon />}
                  <Typography>Voice Response</Typography>
                </Box>
              }
            />
          </ListItem>
        </List>
      </Drawer>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 1, sm: 2, md: 3 },
          width: '100%',
          ml: 0,
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          transition: theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        {/* Header */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          mb: 2,
          position: 'sticky',
          top: 0,
          zIndex: 1,
          bgcolor: '#f0f2f6',
          pt: 1,
          px: { xs: 1, sm: 2 },
        }}>
          <IconButton
            onClick={() => setDrawerOpen(!drawerOpen)}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Chats
          </Typography>
        </Box>

        {/* Messages */}
        <Box
          sx={{
            flex: 1,
            overflow: 'auto',
            mb: 2,
            px: { xs: 1, sm: 2 },
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          {messages.map((message, index) => (
            <Box
              key={index}
              sx={{
                display: 'flex',
                justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
                gap: 1,
                alignItems: 'flex-start',
                width: '100%',
              }}
            >
              {message.role === 'assistant' && (
                <Avatar sx={{ bgcolor: theme.palette.primary.main, width: 32, height: 32 }}>
                  <SmartToyIcon sx={{ fontSize: 20 }} />
                </Avatar>
              )}
              <Box sx={{
                position: 'relative',
                width: 'fit-content',
                maxWidth: { xs: '85%', sm: '70%' },
                minWidth: 48,
                alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start',
              }}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    bgcolor: message.role === 'user' ? theme.palette.primary.main : '#ffffff',
                    color: message.role === 'user' ? '#ffffff' : 'text.primary',
                    borderRadius: 2,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    width: 'fit-content',
                    maxWidth: { xs: '85vw', sm: '70vw' },
                    minWidth: 48,
                    px: 2,
                    py: 1.5,
                  }}
                >
                  <Typography sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {message.content}
                  </Typography>
                </Paper>
                {message.role === 'assistant' && speakingMessageIndex === index && (
                  <Tooltip title="Stop speaking">
                    <IconButton
                      onClick={stopSpeaking}
                      sx={{
                        position: 'absolute',
                        right: { xs: -32, sm: -40 },
                        top: '50%',
                        transform: 'translateY(-50%)',
                        bgcolor: 'error.main',
                        color: 'white',
                        width: { xs: 28, sm: 32 },
                        height: { xs: 28, sm: 32 },
                        '&:hover': {
                          bgcolor: 'error.dark',
                        },
                      }}
                    >
                      <StopIcon sx={{ fontSize: { xs: 16, sm: 20 } }} />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
              {message.role === 'user' && (
                <Avatar sx={{ bgcolor: theme.palette.grey[500], width: 32, height: 32 }}>
                  <PersonIcon sx={{ fontSize: 20 }} />
                </Avatar>
              )}
            </Box>
          ))}
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-start', gap: 1, alignItems: 'center' }}>
              <Avatar sx={{ bgcolor: theme.palette.primary.main, width: 32, height: 32 }}>
                <SmartToyIcon sx={{ fontSize: 20 }} />
              </Avatar>
              <CircularProgress size={20} />
            </Box>
          )}
          <div ref={messagesEndRef} />
        </Box>

        {/* Input Area */}
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0,
            p: 0.5,
            bgcolor: '#fff',
            borderRadius: '32px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            width: '100%',
            maxWidth: 900,
            mx: 'auto',
            mb: 2,
          }}
        >
          <Box sx={{ pl: 1, pr: 1, display: 'flex', alignItems: 'center' }}>
            <AudioRecorder onTranscriptionComplete={handleTranscriptionComplete} />
          </Box>
          <TextField
            fullWidth
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message or Use the microphone to speak..."
            variant="outlined"
            size="medium"
            disabled={loading}
            InputProps={{
              sx: {
                borderRadius: '24px',
                background: 'transparent',
                boxShadow: 'none',
                fontSize: 18,
                pl: 1,
                pr: 1,
                height: 48,
              },
            }}
            sx={{
              mx: 0,
              '.MuiOutlinedInput-notchedOutline': { border: 'none' },
              background: 'transparent',
            }}
          />
          <Button
            type="submit"
            variant="contained"
            color="success"
            disabled={loading || !input.trim()}
            sx={{
              minWidth: '48px',
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              bgcolor: '#4CAF50',
              color: 'white',
              boxShadow: '0 2px 8px rgba(44,62,80,0.08)',
              ml: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              '&:hover': { bgcolor: '#45a049' },
              '&:disabled': { bgcolor: '#9e9e9e', color: '#fff' },
            }}
            aria-label="Send message"
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : <SendIcon />}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

export default App; 