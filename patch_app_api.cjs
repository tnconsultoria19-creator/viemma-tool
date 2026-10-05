const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

const apiLogic = `  const [isClientView, setIsClientView] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // Cloudflare Worker API Handlers (Mocked for Demo)
  const saveItinerary = async () => {
    setIsSaving(true);
    setSaveMessage('Saving to Cloudflare D1...');
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      setSaveMessage('Saved Successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      setSaveMessage('Network Error');
    } finally {
      setIsSaving(false);
    }
  };

  const generateAIItinerary = async () => {
    setIsSaving(true);
    setSaveMessage('Generating via Gemini API...');
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setSaveMessage('AI Itinerary Generated!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      setSaveMessage('Network Error');
    } finally {
      setIsSaving(false);
    }
  };

  // Load from local storage`;

content = content.replace('  // Load from local storage', apiLogic);

fs.writeFileSync('src/App.tsx', content, 'utf8');
