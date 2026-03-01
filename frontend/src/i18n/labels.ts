import { AgriNitiLanguage } from '../store/languageStore';

type LabelKey =
  | 'appTagline'
  | 'loginTitle'
  | 'loginSubtitle'
  | 'username'
  | 'password'
  | 'login'
  | 'createAccount'
  | 'dashboardTitle'
  | 'dashboardSubtitle'
  | 'askAiTitle'
  | 'askAiPlaceholder';

type Labels = Record<AgriNitiLanguage, Record<LabelKey, string>>;

export const labels: Labels = {
  en: {
    appTagline: 'Intelligent agri-assistance for Indian farmers.',
    loginTitle: 'Choose your language',
    loginSubtitle: 'AgriNiti speaks with you in your preferred language.',
    username: 'Username',
    password: 'Password',
    login: 'Login',
    createAccount: 'Create account',
    dashboardTitle: 'Unified farm intelligence',
    dashboardSubtitle: 'Weather, markets, schemes and AI in one place.',
    askAiTitle: 'Ask AgriNiti AI',
    askAiPlaceholder: 'Describe your crop, issue or question here...'
  },
  hi: {
    appTagline: 'भारतीय किसानों के लिए स्मार्ट कृषि सहायक।',
    loginTitle: 'अपनी भाषा चुनें',
    loginSubtitle: 'AgriNiti आपकी पसंदीदा भाषा में बात करता है।',
    username: 'उपयोगकर्ता नाम',
    password: 'पासवर्ड',
    login: 'लॉगिन',
    createAccount: 'खाता बनाएँ',
    dashboardTitle: 'एकीकृत कृषि जानकारी',
    dashboardSubtitle: 'मौसम, मंडी, योजनाएँ और AI एक ही स्थान पर।',
    askAiTitle: 'AgriNiti AI से पूछें',
    askAiPlaceholder: 'अपनी फसल, समस्या या सवाल यहाँ लिखें...'
  },
  kn: {
    appTagline: 'ಭಾರತೀಯ ರೈತರಿಗೆ ಬುದ್ಧಿವಂತ ಕೃಷಿ ಸಹಾಯಕ.',
    loginTitle: 'ನಿಮ್ಮ ಭಾಷೆಯನ್ನು ಆರಿಸಿ',
    loginSubtitle: 'AgriNiti ನಿಮ್ಮ ಇಷ್ಟದ ಭಾಷೆಯಲ್ಲಿ ಮಾತನಾಡುತ್ತದೆ.',
    username: 'ಬಳಕೆದಾರ ಹೆಸರು',
    password: 'ಪಾಸ್ವರ್ಡ್',
    login: 'ಲಾಗಿನ್',
    createAccount: 'ಖಾತೆ ರಚಿಸಿ',
    dashboardTitle: 'ಏಕೀಕೃತ ರೈತ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
    dashboardSubtitle: 'ಹವಾಮಾನ, ಮಾರುಕಟ್ಟೆ, ಯೋಜನೆಗಳು ಮತ್ತು AI ಒಂದೇ ಜಾಗದಲ್ಲಿ.',
    askAiTitle: 'AgriNiti AI ಅನ್ನು ಕೇಳಿ',
    askAiPlaceholder: 'ನಿಮ್ಮ ಬೆಳೆ, ಸಮಸ್ಯೆ ಅಥವಾ ಪ್ರಶ್ನೆಯನ್ನು ಇಲ್ಲಿ ಬರೆಯಿರಿ...'
  },
  ta: {
    appTagline: 'இந்திய விவசாயிகளுக்கான நுண்ணறிவு வேளாண் உதவி.',
    loginTitle: 'உங்கள் மொழியைத் தேர்ந்தெடுக்கவும்',
    loginSubtitle: 'AgriNiti உங்கள் விருப்பமான மொழியில் பேசுகிறது.',
    username: 'பயனர் பெயர்',
    password: 'கடவுச்சொல்',
    login: 'உள்நுழை',
    createAccount: 'கணக்கு உருவாக்கு',
    dashboardTitle: 'ஏகीकृत பண்ணை நுண்ணறிவு',
    dashboardSubtitle: 'வானிலை, சந்தை, திட்டங்கள் மற்றும் AI ஒரே இடத்தில்.',
    askAiTitle: 'AgriNiti AI-யை கேளுங்கள்',
    askAiPlaceholder: 'உங்கள் பயிர், சிக்கல் அல்லது கேள்வியை இங்கே எழுதுங்கள்...'
  },
  te: {
    appTagline: 'భారతీయ రైతుల కోసం స్మార్ట్ వ్యవసాయ సహాయకుడు.',
    loginTitle: 'మీ భాషను ఎంచుకోండి',
    loginSubtitle: 'AgriNiti మీకు ఇష్టమైన భాషలో మాట్లాడుతుంది.',
    username: 'వినియోగదారు పేరు',
    password: 'పాస్వర్డ్',
    login: 'లాగిన్',
    createAccount: 'ఖాతా సృష్టించండి',
    dashboardTitle: 'ఏకీకృత వ్యవసాయ డ్యాష్‌బోర్డ్',
    dashboardSubtitle: 'వాతావరణం, మార్కెట్, పథకాలు, AI అన్నీ ఒకే చోట.',
    askAiTitle: 'AgriNiti AIని అడగండి',
    askAiPlaceholder: 'మీ పంట, సమస్య లేదా ప్రశ్నను ఇక్కడ వ్రాయండి...'
  },
  ml: {
    appTagline: 'ഇന്ത്യൻ കർഷകർക്ക് ബുദ്ധിമാനായ കാർഷിക സഹായി.',
    loginTitle: 'നിങ്ങളുടെ ഭാഷ തിരഞ്ഞെടുക്കൂ',
    loginSubtitle: 'AgriNiti നിങ്ങളുടെ ഇഷ്ടഭാഷയിൽ സംസാരിക്കും.',
    username: 'ഉപയോക്തൃനാമം',
    password: 'പാസ്വേഡ്',
    login: 'ലോഗിൻ',
    createAccount: 'അക്കൗണ്ട് സൃഷ്ടിക്കുക',
    dashboardTitle: 'ഏകീകൃത ഫാം ഇന്റലിജൻസ്',
    dashboardSubtitle: 'കാലാവസ്ഥ, മാർക്കറ്റ്, പദ്ധതികൾ, AI എല്ലാം ഒറ്റ സ്ഥലത്ത്.',
    askAiTitle: 'AgriNiti AIയോട് ചോദിക്കുക',
    askAiPlaceholder: 'നിങ്ങളുടെ വിള, പ്രശ്നം അല്ലെങ്കിൽ ചോദ്യങ്ങൾ ഇവിടെ എഴുതൂ...'
  }
};

export function useLabel(lang: AgriNitiLanguage, key: LabelKey): string {
  return labels[lang][key];
}

