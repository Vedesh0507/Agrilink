export type Language = 'en' | 'te' | 'hi';

export interface TranslationDict {
  [key: string]: {
    en: string;
    te: string;
    hi: string;
  };
}

export const translations: TranslationDict = {
  // Navigation
  'nav.home': { en: 'Home', te: 'హోమ్', hi: 'होम' },
  'nav.farmerPortal': { en: 'Farmer Portal', te: 'రైతు పోర్టల్', hi: 'किसान पोर्टल' },
  'nav.buyerPortal': { en: 'Buyer Portal', te: 'కొనుగోలుదారు పోర్టల్', hi: 'खरीदार पोर्टल' },
  'nav.adminConsole': { en: 'Admin Console', te: 'అడ్మిన్ కన్సోల్', hi: 'एडमिन कंसोल' },
  'nav.signIn': { en: 'Sign In', te: 'లాగిన్', hi: 'साइन इन' },
  'nav.createAccount': { en: 'Create Account', te: 'ఖాతా తెరవండి', hi: 'खाता बनाएं' },
  'nav.register': { en: 'Register', te: 'నమోదు', hi: 'रजिस्टर' },
  'nav.signOut': { en: 'Sign Out', te: 'లాగౌట్', hi: 'लॉग आउट' },
  'nav.dashboard': { en: 'Dashboard', te: 'డ్యాష్‌బోర్డ్', hi: 'डैशबोर्ड' },
  'nav.profile': { en: 'Profile', te: 'ప్రొఫైల్', hi: 'प्रोफ़ाइल' },

  // Role Badges & Titles
  'farmer.portalTitle': { en: 'Producer & Farmer Portal', te: 'రైతు & ఉత్పత్తిదారుల పోర్టల్', hi: 'उत्पादक एवं किसान पोर्टल' },
  'buyer.portalTitle': { en: 'Institutional Procurement Portal', te: 'సంస్థాగత కొనుగోలు పోర్టల్', hi: 'संस्थागत खरीद पोर्टल' },
  'farmer.badge': { en: 'Verified Agricultural Producer', te: 'ధృవీకరించబడిన వ్యవసాయ ఉత్పత్తిదారు', hi: 'सत्यापित कृषि उत्पादक' },
  'buyer.badge': { en: 'Verified Institutional Buyer', te: 'ధృవీకరించబడిన సంస్థాగత కొనుగోలుదారు', hi: 'सत्यापित संस्थागत खरीदार' },

  // Farmer Tabs
  'tab.overview': { en: 'Overview', te: 'అవలోకనం', hi: 'अवलोकन' },
  'tab.myProduce': { en: 'My Produce', te: 'నా ఉత్పత్తులు', hi: 'मेरी उपज' },
  'tab.buyerRequests': { en: 'Buyer Requests', te: 'కొనుగోలుదారుల డిమాండ్లు', hi: 'खरीदार की मांगें' },
  'tab.quotations': { en: 'Quotations', te: 'కోటేషన్లు / సంప్రదింపులు', hi: 'कोटेशन / बातचीत' },
  'tab.orders': { en: 'Orders', te: 'ఆర్డర్లు', hi: 'ऑर्डर' },
  'tab.producerProfile': { en: 'Producer Profile', te: 'రైతు ప్రొఫైల్', hi: 'किसान प्रोफ़ाइल' },
  'tab.buyerProfile': { en: 'Buyer Profile', te: 'కొనుగోలుదారు ప్రొఫైల్', hi: 'खरीदार प्रोफ़ाइल' },
  'tab.findSuppliers': { en: 'Find Suppliers', te: 'రైతులను కనుగొనండి', hi: 'आपूर्तिकर्ता खोजें' },
  'tab.smartMatches': { en: 'Smart Matches', te: 'స్మార్ట్ మ్యాచ్‌లు', hi: 'स्मार्ट मैच' },
  'tab.myRequirements': { en: 'My Requirements', te: 'నా డిమాండ్లు', hi: 'मेरी आवश्यकताएं' },

  // Actions & Buttons
  'action.addProduce': { en: 'Add Produce Lot', te: 'కొత్త పంట చేర్చండి', hi: 'नई उपज जोड़ें' },
  'action.postRequirement': { en: 'Post Procurement Requirement', te: 'కొనుగోలు డిమాండ్ నమోదు చేయండి', hi: 'खरीद मांग पोस्ट करें' },
  'action.callBuyer': { en: 'Call Buyer', te: 'కాల్ చేయండి', hi: 'कॉल करें' },
  'action.callFarmer': { en: 'Call Farmer', te: 'రైతుకు కాల్ చేయండి', hi: 'किसान को कॉल करें' },
  'action.whatsapp': { en: 'WhatsApp', te: 'వాట్సాప్', hi: 'व्हाट्सएप' },
  'action.sendOffer': { en: 'Send Supply Offer', te: 'సరఫరా ఆఫర్ పంపండి', hi: 'सप्लाई ऑफर भेजें' },
  'action.requestQuote': { en: 'Request Quotation', te: 'కోటేషన్ కోరండి', hi: 'कोटेशन मांगें' },
  'action.editProfile': { en: 'Edit Profile', te: 'ప్రొఫైల్ సవరించండి', hi: 'प्रोफ़ाइल संपादित करें' },
  'action.saveChanges': { en: 'Save Changes', te: 'మార్పులు భద్రపరచండి', hi: 'बदलाव सहेजें' },
  'action.cancel': { en: 'Cancel', te: 'రద్దు చేయండి', hi: 'రद्द करें' },
  'action.acceptQuote': { en: 'Accept Quotation & Generate Order', te: 'ధరను అంగీకరించి ఆర్డర్ ఇవ్వండి', hi: 'कोटेशन स्वीकार कर ऑर्डर बनाएं' },
  'action.counterOffer': { en: 'Submit Counter-Offer', te: 'మరొక ధర ప్రతిపాదించండి', hi: 'काउंटर ऑफर सबमिट करें' },
  'action.refresh': { en: 'Refresh Data', te: 'రిఫ్రెష్', hi: 'रिफ्रेश' },
  'action.exploreMatches': { en: 'Explore Matches', te: 'మ్యాచ్‌లను చూడండి', hi: 'मैच देखें' },

  // Farmer Dashboard Cards
  'farmer.activeDemandTitle': { en: 'Active Market Demand (Buyer Requests)', te: 'ప్రస్తుత మార్కెట్ డిమాండ్ (కొనుగోలుదారుల కోరికలు)', hi: 'सक्रिय बाज़ार मांग (खरीदार आवश्यकताएं)' },
  'farmer.activeDemandSubtitle': { en: 'Institutional buyers actively looking for farm produce. Contact them directly or send a custom supply offer.', te: 'సంస్థాగత కొనుగోలుదారులు వెతుకుతున్న పంటలు. నేరుగా కాల్ చేయండి లేదా మీ పంట ఆఫర్ పంపండి.', hi: 'संस्थागत खरीदार जो सक्रिय रूप से उपज खरीद रहे हैं। सीधे कॉल करें या सप्लाई ऑफर भेजें।' },
  'farmer.myProduceTitle': { en: 'My Available Produce Inventory', te: 'నా వద్ద ఉన్న పంట నిల్వలు', hi: 'मेरा उपलब्ध उपज स्टॉक' },
  'farmer.targetVolume': { en: 'Target Volume', te: 'కావాల్సిన పరిమాణం', hi: 'आवश्यक मात्रा' },
  'farmer.targetPrice': { en: 'Target Price', te: 'కొనుగోలు ధర', hi: 'लक्षित मूल्य' },
  'farmer.deliveryHub': { en: 'Delivery Hub', te: 'డెలివరీ ప్రదేశం', hi: 'डिलीवरी स्थान' },
  'farmer.targetDate': { en: 'Target Date', te: 'కావాల్సిన తేదీ', hi: 'लक्षित तारीख' },
  'farmer.verifiedBuyer': { en: 'Verified Buyer', te: 'ధృవీకరించబడిన కొనుగోలుదారు', hi: 'सत्यापित खरीदार' },

  // Metrics
  'metric.activeListings': { en: 'Active Produce Lots', te: 'అందుబాటులో ఉన్న పంటలు', hi: 'सक्रिय उपज लॉट' },
  'metric.totalVolume': { en: 'Total Volume Available', te: 'మొత్తం లభ్యమయ్యే పరిమాణం', hi: 'कुल उपलब्ध मात्रा' },
  'metric.buyerRequestsCount': { en: 'Active Buyer Demands', te: 'కొనుగోలుదారుల డిమాండ్లు', hi: 'सक्रिय खरीदार मांगें' },
  'metric.activeQuotations': { en: 'Active Quotations', te: 'నడుస్తున్న సంప్రదింపులు', hi: 'सक्रिय कोटेशन' },
  'metric.activeOrders': { en: 'Active Orders', te: 'నడుస్తున్న ఆర్డర్లు', hi: 'सक्रिय ऑर्डर' },

  // Units
  'unit.kg': { en: 'kg', te: 'కిలోలు', hi: 'किलो' },
  'unit.perKg': { en: '/ kg', te: '/ కిలో', hi: '/ किलो' },

  // Landing Page
  'hero.tagline': { en: 'Connect Farm Supply With Real Business Demand', te: 'రైతు పంటను నిజమైన వ్యాపార డిమాండ్‌తో అనుసంధానించండి', hi: 'किसान की उपज को वास्तविक व्यावसायिक मांग से जोड़ें' },
  'hero.description': { en: 'The B2B Farm-to-Buyer Marketplace connecting smallholder farmers with verified commercial buyers. Direct negotiation, transparent pricing, and smart matching.', te: 'చిన్నకారు రైతులను మరియు సంస్థాగత కొనుగోలుదారులను నేరుగా కలిపే బి2బి వ్యవసాయ వేదిక. దళారులు లేని పారదర్శక వ్యాపారం.', hi: 'छोटे किसानों और सत्यापित व्यावसायिक खरीदारों को सीधे जोड़ने वाला बी2बी कृषि बाज़ार। बिचौलियों के बिना सीधा व्यापार।' },
};
