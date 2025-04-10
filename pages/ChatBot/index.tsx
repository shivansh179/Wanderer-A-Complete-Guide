import React, { useState } from 'react';

const TextToSpeech: React.FC = () => {
  const [text, setText] = useState<string>('');
  const [rate, setRate] = useState<number>(1); // Default speech rate

  const handleTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(event.target.value);
  };

  const handleRateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRate(parseFloat(event.target.value));
  };

  const handleSpeak = () => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = rate; // Set the speech rate (normal is 1)
      utterance.pitch = 1; // Set pitch (default 1, normal range is 0 to 2)
      utterance.volume = 1; // Set volume (range from 0 to 1)
      window.speechSynthesis.speak(utterance);
    } else {
      alert('Sorry, your browser does not support text to speech.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-bold mb-6">Text to Speech Converter</h1>
      <textarea
        className="w-80 h-40 p-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Enter text here..."
        value={text}
        onChange={handleTextChange}
      />
      <div className="flex items-center mb-4">
        <label htmlFor="rate" className="mr-2 text-lg">Speech Rate: </label>
        <input
          type="range"
          id="rate"
          className="w-40"
          min="0.5"
          max="2"
          step="0.1"
          value={rate}
          onChange={handleRateChange}
        />
        <span className="ml-2">{rate.toFixed(1)}</span>
      </div>
      <button
        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
        onClick={handleSpeak}
      >
        Speak
      </button>
    </div>
  );
};

export default TextToSpeech;
