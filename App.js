import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { Video, ResizeMode } from 'expo-av';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import FinCompassDashboard from './FinCompassDashboard';

// ==========================================
// 🎨 DESIGN TOKEN SYSTEM (THEME SYSTEM)
// ==========================================
const themes = {
  light: {
    primary: '#115E59',
    primaryLight: '#F0FDFA',
    secondary: '#0F766E',
    accent: '#D97706',
    accentLight: '#FEF3C7',
    background: '#FAF9F6',
    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',
    textPrimary: '#1E293B',
    textSecondary: '#475569',
    textMuted: '#94A3B8',
    border: '#E2E8F0',
    success: '#059669',
    successBg: '#ECFDF5',
    successBorder: '#A7F3D0',
    warning: '#D97706',
    warningBg: '#FEF3C7',
    warningBorder: '#FDE68A',
    danger: '#DC2626',
    dangerBg: '#FEE2E2',
    dangerBorder: '#FCA5A5',
    shadow: 'rgba(17, 94, 89, 0.06)',
  },
  dark: {
    primary: '#22D3EE',
    primaryLight: '#102A3B',
    secondary: '#F472B6',
    accent: '#A3E635',
    accentLight: '#283B16',
    background: '#05070D',
    surface: 'rgba(8, 13, 24, 0.94)',
    surfaceElevated: '#101827',
    textPrimary: '#F4F7FB',
    textSecondary: '#A9B7C9',
    textMuted: '#718096',
    border: '#1D3950',
    success: '#A3E635',
    successBg: '#1A2C15',
    successBorder: '#476E22',
    warning: '#FBBF24',
    warningBg: '#352A0D',
    warningBorder: '#725A1A',
    danger: '#FB7185',
    dangerBg: '#351421',
    dangerBorder: '#7F2940',
    shadow: 'rgba(0, 0, 0, 0.55)',
  }
};

// ==========================================
// 🌐 LOCALIZATION STRINGS (EN / HI)
// ==========================================
const t = {
  en: {
    village: 'Village / Town',
    block: 'Block / Taluka',
    district: 'District',
    capture_gps: 'Capture GPS',
    business_category: 'Business Category',
    activities: 'Core Activities',
    voice_to_text: 'Voice-to-Text',
    registered_name: 'Registered Business Name',
    shop_act: 'Shop Act License Number',
    optional: '(Optional)',
    margin_capital: 'Available Margin Capital (10% Equity)',
    quick_pick_25k: '₹25,000',
    quick_pick_50k: '₹50,000',
    quick_pick_1l: '₹1,00,000',
    quick_pick_2l: '₹2,00,000',
    analyze: '⚡ Analyze Feasibility',
    back: 'Back',
    next: 'Next',
    home: 'Home',
    logout: 'Logout',
    where_header: 'Step 1: Where',
    what_header: 'Step 2: What',
    details_header: 'Step 3: Details & Capital',
    verify: 'Verify',
    // Hero
    verdict_card: 'Viability Verdict',
    compliance_verified: 'VERIFIED',
    compliance_self: 'SELF-CERTIFIED',
    good_fit: 'Good Fit',
    moderate_fit: 'Moderate Fit',
    needs_review: 'Needs Review',
    // Financial
    project_cost: 'Project Cost',
    margin_10_percent: '10% Margin (Your Equity)',
    sanctionable_loan: 'Sanctionable Loan (90%)',
    routed_scheme: 'Routed Scheme',
    interest_rate: 'Interest Rate',
    tenure: 'Tenure',
    moratorium: 'Moratorium',
    working_capital: 'Working Capital (25%)',
    // Scheme routing
    micro_finance: 'Micro Finance Scheme',
    term_loan: 'Term Loan Scheme',
    no_pilot: 'No Pilot Scheme',
    exceeds_eligibility: 'Project cost exceeds current scheme eligibility. Maximum project cost for pilot schemes is ₹50 Lakh.',
    // EMI & Moratorium
    repayment_schedule: 'Repayment Schedule',
    moratorium_period: 'Moratorium Period (Interest-Only)',
    active_repayment: 'Active Repayment (Principal + Interest)',
    quarter: 'Qtr',
    opening_balance: 'Opening Balance',
    interest: 'Interest',
    principal: 'Principal',
    total_payment: 'Total Payment',
    // Market reach
    market_reach: 'Market Reach & Catchment Analysis',
    catchment_radius: 'Catchment Radius',
    distribution_channels: 'Distribution Channels',
    // Competitor mapping
    competitor_mapping: 'Competitor Mapping & Saturation',
    opportunities: 'Opportunities',
    threats: 'Threats',
    // SWOT
    strengths: 'Strengths',
    weaknesses: 'Weaknesses',
    opportunities_swot: 'Opportunities',
    threats_swot: 'Threats',
    // Product market
    pricing_strategy: 'Pricing Strategy',
    unit_margin: 'Gross Unit Margin',
    daily_wage: 'Daily-Wage Alignment',
    // DPR download
    download_dpr: '📥 Download Bank-Ready DPR (PDF)',
    dpr_generating: 'Generating DPR...',
    // Error messages
    error_something: 'Something went wrong',
    try_again: 'Try Again',
  },
  hi: {
    village: 'ग्राम / शहर',
    block: 'ब्लॉक / तालुका',
    district: 'जिला',
    capture_gps: 'GPS कैप्चर करें',
    business_category: 'व्यवसाय श्रेणी',
    activities: 'मुख्य गतिविधियाँ',
    voice_to_text: 'वॉइस-टू-टेक्स्ट',
    registered_name: 'पंजीकृत व्यवसाय का नाम',
    shop_act: 'Shop Act लाइसेंस नंबर',
    optional: '(वैकल्पिक)',
    margin_capital: 'उपलब्ध मार्जिन पूंजी (10% इक्विटी)',
    quick_pick_25k: '₹25,000',
    quick_pick_50k: '₹50,000',
    quick_pick_1l: '₹1,00,000',
    quick_pick_2l: '₹2,00,000',
    analyze: '⚡ feasibility विश्लेषण करें',
    back: 'पिछला',
    next: 'अगला',
    home: 'होम',
    logout: 'लॉगआउट',
    where_header: 'चरण 1: जहाँ',
    what_header: 'चरण 2: क्या',
    details_header: 'चरण 3: विवरण एवं पूंजी',
    verify: 'पुष्टि',
    // Hero
    verdict_card: 'पात्रता verdict',
    compliance_verified: 'सत्यापित',
    compliance_self: 'स्व-प्रमाणित',
    good_fit: 'अच्छा फिट',
    moderate_fit: 'मध्यम फिट',
    needs_review: 'समीक्षा की आवश्यकता',
    // Financial
    project_cost: 'परियोजना लागत',
    margin_10_percent: '10% मार्जिन (आपकी इक्विटी)',
    sanctionable_loan: 'स्वीकृत ऋण (90%)',
    routed_scheme: 'चयनित योजना',
    interest_rate: 'ब्याज दर',
    tenure: 'अवधि',
    moratorium: 'मोराेमियम अवधि',
    working_capital: 'कार्यशील पूंजी (25%)',
    // Scheme routing
    micro_finance: 'माइक्रो फाइनेंस योजना',
    term_loan: 'टर्म लोन योजना',
    no_pilot: 'नहीं पायलट योजना',
    exceeds_eligibility: 'परियोजना लागत वर्तमान योजना पात्रता से अधिक है। पायलट योजनाओं के लिए अधिकतम परियोजना लागत ₹50 लाख है।',
    // EMI & Moratorium
    repayment_schedule: 'चुकौती अनुसूची',
    moratorium_period: 'मोराेमियम अवधि (केवल ब्याज)',
    active_repayment: 'क्रियाशील चुकौती (मूलधन + ब्याज)',
    quarter: 'त्रिमाही',
    opening_balance: 'शेष राशि',
    interest: 'ब्याज',
    principal: 'मूलधन',
    total_payment: 'कुल भुगतान',
    // Market reach
    market_reach: 'बाजार पहुंच एवं आकर्षण विश्लेषण',
    catchment_radius: 'Catchment Radius',
    distribution_channels: 'वितरण चैनल',
    // Competitor mapping
    competitor_mapping: 'प्रतियोगी मानचित्रण एवं संतृप्ति',
    opportunities: 'उपलब्धियाँ',
    threats: 'धमकियाँ',
    // SWOT
    strengths: 'बल',
    weaknesses: 'कमजोरियाँ',
    opportunities_swot: 'अवसर',
    threats_swot: 'खतरे',
    // Product market
    pricing_strategy: 'मूल्य निर्धारण रणनीति',
    unit_margin: 'पूँजीगत लाभ मार्जिन',
    daily_wage: 'दैनिक मजदूरी अनुरूपता',
    // DPR download
    download_dpr: '📥 बैंक-ready DPR (PDF) डाउनलोड करें',
    dpr_generating: 'DPR जनरेट हो रहा है...',
    // Error messages
    error_something: 'कुछ त्रुटि हुई',
    try_again: 'फिर प्रयास करें',
  }
};

// ==========================================
// 📊 CATEGORY ICON MAP
// ==========================================
const categoryMap = {
  dairy: { icon: 'cow', name: 'Dairy Farm', color: '#059669' },
  retail_kirana: { icon: 'shopping-bag', name: 'Retail / Kirana', color: '#D97706' },
  textiles: { icon: 'shirt-outline', name: 'Textiles', color: '#F59E0B' },
  poultry: { icon: 'egg-outline', name: 'Poultry Farm', color: '#EF4444' },
  agro_processing: { icon: 'sprout-outline', name: 'Agro-Processing', color: '#10B981' },
};

// ==========================================
// 📝 HELPER FUNCTIONS
// ==========================================
const formatMoney = (value) => `₹${Math.round(Number(value || 0)).toLocaleString('en-IN')}`;
const showEligibilityAlert = (projectCost) => {
  if (projectCost > 5000000) {
    Alert.alert(
      'Eligibility Limit',
      'Project cost exceeds current scheme eligibility. Maximum project cost for pilot schemes is ₹50 Lakh.',
      [{ text: 'OK', style: 'default' }]
    );
  }
};

// ==========================================
// 🧭 STEPPER COMPONENT
// ==========================================
const Stepper = ({ step, totalSteps, onStepChange }) => {
  const items = [];
  for (let i = 1; i <= totalSteps; i++) {
    items.push({
      key: i,
      number: i,
      label: i === 1 ? t.en.where_header.split(':')[1].trim() : 
            i === 2 ? t.en.what_header.split(':')[1].trim() : 
            t.en.details_header.split(':')[1].trim(),
      completed: i < step,
      current: i === step,
    });
  }
  return (
    <View style={styles.stepperContainer}>
      {items.map((item) => (
        <View
          key={item.key}
          style={styles.stepperItem}
          onPress={() => onStepChange(item.number)}
          style={item.completed ? styles.stepperCompleted : item.current ? styles.stepperCurrent : styles.stepperInactive}
        >
          <Text style={styles.stepperNumber}>{item.number}</Text>
          <Text style={styles.stepperLabel}>{item.label}</Text>
        </View>
      ))}
      <View style={styles.stepperLine} />
    </View>
  );
};

styles.stepperContainer = { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 };
styles.stepperItem = { width: 44, aspectRatio: 1, borderRadius: 20, justifyContent: 'center', alignItems: 'center' };
styles.stepperCompleted = { backgroundColor: themes.light.primary, ...StyleSheet.absoluteFillObject };
styles.stepperCurrent = { backgroundColor: themes.accent, ...StyleSheet.absoluteFillObject };
styles.stepperInactive = { backgroundColor: '#E2E8F0', ...StyleSheet.absoluteFillObject };
styles.stepperLine = { flex: 1, height: 2, backgroundColor: '#CBD5E1' };
styles.stepperNumber = { fontSize: 16, fontWeight: 'bold', color: '#FFFFFF' };
styles.stepperLabel = { fontSize: 8, marginTop: 2, color: '#FFFFFF' };

// ==========================================
// 🏠 MAIN APP COMPONENT
// ==========================================
export default function App() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    village: 'Tathawade',
    block: 'Pune',
    district: 'Pune',
    businessCategory: 'Dairy',
    capital: '100000',
    latitude: '18.6161',
    longitude: '73.7431',
    shopActNumber: 'MH-PUN-2024-88912',
    businessName: 'Shree Samarth Agro & Dairy',
    businessDescription: 'Morning delivery of pure A2 cow milk, artisanal paneer & curd to households and retail shops',
    latitude: '',
    longitude: '',
  });
  const [theme, setTheme] = useState('light');
  const [language, setLanguage] = useState('en');
  
  // ... (calculator logic continues)
  
  // Step 1: Where
  if (step === 1) {
    return (
      <View style={styles.screen}>
        <View style={styles.header}><Text style={styles.headerTitle}>{t[language].where_header}</Text><TouchableOpacity style={styles.backBtn} onPress={() => setStep(1)}><Feather name="arrow-left" color={themes.light.primary} size={24} /></TouchableOpacity></View>
        <View style={styles.contentPadding}>
          <View style={styles.inputGroup}><Text style={styles.label}>{t[language].village}</Text><TextInput style={styles.input} placeholder={t[language].village} value={form.village} onChangeText={v => setForm({...form, village: v})} /></View>
          <View style={styles.inputGroup}><Text style={styles.label}>{t[language].block}</Text><TextInput style={styles.input} placeholder="e.g. Pune" value={form.block} onChangeText={b => setForm({...form, block: b})} /></View>
          <View style={styles.inputGroup}><Text style={styles.label}>{t[language].district}</Text><TextInput style={styles.input} placeholder="e.g. Pune" value={form.district} onChangeText={d => setForm({...form, district: d})} /></View>
          <TouchableOpacity style={styles.gpsBtn} onPress={async () => { Location.requestForegroundPermissionsAsync(); Location.getCurrentPositionAsync({}).then(pos => setForm({...form, latitude: pos.coords.latitude.toString(), longitude: pos.coords.longitude.toString()})).catch(() => alert('Location permission denied')) }><Feather name="map-pin" color={themes.accent} size={20} /> {t[language].capture_gps}</TouchableOpacity>
        </View>
      </View>
    );
  }
  
  // Step 2: What
  if (step === 2) {
    return (
      <View style={styles.screen}>
        <View style={styles.header}><Text style={styles.headerTitle}>{t[language].what_header}</Text><TouchableOpacity style={styles.backBtn} onPress={() => setStep(1)}><Feather name="arrow-left" color={themes.light.primary} size={24} /></TouchableOpacity></View>
        <View style={styles.contentPadding}>
          <View style={styles.categoryGrid}>
            Object.keys(categoryMap).forEach((key) => {
              const cat = categoryMap[key];
              return (
                <TouchableOpacity key={key} style={styles.categoryCard} onPress={() => setForm({...form, businessCategory: key})}><View style={[styles.categoryIcon, { borderColor: form.businessCategory === key ? themes.accent : 'transparent' }] }><Feather name={cat.icon} size={28} color={form.businessCategory === key ? cat.color : themes.textMuted} /></View><Text style={styles.categoryText}>{cat.name}</Text></TouchableOpacity>
              );
            })
          </View>
          <View style={styles.activityArea}><Text style={styles.label}>{t[language].activities}</Text><TextInput style={styles.textArea} multiline={true} placeholder={t[language].activities} value={form.businessDescription || ''} onChangeText={a => setForm({...form, businessDescription: a})} /></View>
          <View style={styles.activityArea}><Text style={styles.label}>{t[language].voice_to_text}</Text><TouchableOpacity style={styles.micBtn} onPress={() => alert('Voice-to-Text feature') }><Feather name="mic" color={themes.accent} size={20} /> {t[language].voice_to_text}</TouchableOpacity>
        </View>
      </View>
    );
  }
  
  // Step 3: Details & Capital
  if (step === 3) {
    const marginCapital = Number(form.capital) || 100000;
    const projectCost = marginCapital / 0.10;
    const promoterEquity = projectCost * 0.10;
    const maximumLoan = projectCost * 0.90;
    
    let scheme = {};
    let showAlert = false;
    
    if (projectCost <= 140000) {
      scheme = {
        scheme_name: 'Micro Finance Scheme',
        interest_rate_pa: 6.5,
        tenure_quarters: 12,
        moratorium_quarters: 1,
        moratorium_months: 1 * 3,
        loan_cap: 125000,
        eligibility: 'Eligible under Micro Finance Pilot',
        logic_en: `Because your project cost is ${formatMoney(projectCost)}, you qualify for the Micro Finance Scheme, designed for smaller village startup models capped at ₹1.40 Lakh. A 3-month moratorium applies before principal repayment begins.`,
        logic_hi: `चूंकि आपकी परियोजना लागत ${formatMoney(projectCost)} है, आप माइक्रो फाइनेंस योजना के लिए पात्र हैं, जो ₹1.40 लाख तक के छोटे ग्रामीण व्यवसायों के लिए है। तैयारी के लिए 3 माह का स्थगन लागू है।`,
      };
    } else if (projectCost <= 5000000) {
      scheme = {
        scheme_name: 'Term Loan Scheme',
        interest_rate_pa: 8.0,
        tenure_quarters: 28,
        moratorium_quarters: 2,
        moratorium_months: 2 * 3,
        loan_cap: 4500000,
        eligibility: 'Eligible under Term Loan Pilot',
        logic_en: `Because your project cost is ${formatMoney(projectCost)}, you qualify for the Term Loan Scheme — designed for larger enterprises than the Micro Finance Scheme, which caps at ₹1.40 Lakh. A 6-month moratorium applies before principal repayment begins.`,
        logic_hi: `चूंकि आपकी परियोजना लागत ${formatMoney(projectCost)} है, आप टर्म लोन योजना के लिए पात्र हैं - यह ₹1.40 लाख से बड़े उद्योगों के लिए बनाई गई है। मूलधन भुगतान शुरू होने से पहले 6 महीने का स्थगन लागू है।`,
      };
    } else {
      scheme = {
        scheme_name: 'No Pilot Scheme',
        interest_rate_pa: 0,
        tenure_quarters: 0,
        moratorium_quarters: 0,
        moratorium_months: 0,
        loan_cap: 0,
        eligibility: 'Project cost exceeds the current pilot coverage',
        logic_en: `Project cost exceeds the current pilot coverage (max ₹50.00 Lakh). No government pilot scheme is available for this project size.`,
        logic_hi: `यह परियोजना ₹50.00 लाख की अधिकतम पात्रता सीमा से अधिक है। इस परियोजना आकार के लिए कोई सरकारी पायलट योजना उपलब्ध नहीं है।`,
      };
      showEligibilityAlert(projectCost);
    }
    
    const loanAmount = projectCost > 5000000 ? 0 : scheme.loan_cap > 0 ? Math.min(maximumLoan, scheme.loan_cap) : 0;
    const workingCapital = projectCost * 0.25;
    
    return (
      <View style={styles.screen}>
        <View style={styles.header}><Text style={styles.headerTitle}>{t[language].details_header}</Text><TouchableOpacity style={styles.backBtn} onPress={() => setStep(2)}><Feather name="arrow-left" color={themes.light.primary} size={24} /></TouchableOpacity></View>
        <View style={styles.contentPadding}>
          <View style={styles.inputGroup}><Text style={styles.label}>{t[language].registered_name}</Text><TextInput style={styles.input} placeholder="e.g. Shree Samarth Agro & Dairy" value={form.businessName || 'Shree Samarth Agro & Dairy'} onChangeText={n => setForm({...form, businessName: n})} /></View>
          <View style={styles.inputGroup}><Text style={styles.label}>{t[language].shop_act}</Text><TextInput style={styles.input} placeholder={t[language].optional} value={form.shopActNumber || ''} onChangeText={s => setForm({...form, shopActNumber: s})} /></View>
          <View style={styles.inputGroup}><Text style={styles.label}>{t[language].margin_capital}</Text>
            <View style={styles.marginControls}>
              <TouchableOpacity style={styles.marginBtn} onPress={() => setForm({...form, capital: '25000'}) }><Text style={styles.marginText}>+₹25k</Text></TouchableOpacity>
              <TouchableOpacity style={styles.marginBtn} onPress={() => setForm({...form, capital: '50000'}) }><Text style={styles.marginText}>+₹50k</Text></TouchableOpacity>
              <TouchableOpacity style={styles.marginBtn} onPress={() => setForm({...form, capital: '100000'}) }><Text style={styles.marginText}>+₹1L</Text></TouchableOpacity>
              <TouchableOpacity style={styles.marginBtn} onPress={() => setForm({...form, capital: '200000'}) }><Text style={styles.marginText}>+₹2L</Text></TouchableOpacity>
              <TextInput style={styles.input} placeholder={t[language].margin_capital} value={form.capital || '100000'} onChangeText={c => setForm({...form, capital: c})} />
            </View>
          </View>
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.prevBtn} onPress={() => setStep(2)}><Text>{t[language].back}</Text></TouchableOpacity>
            <TouchableOpacity style={styles.nextBtn} onPress={() => setStep(4)}><Text>{t[language].analyze}</Text></TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }
  
  // Hero/Verdict Screen (Step 4)
  if (step === 4) {
    // ... hero screen implementation
    return null;
  }
  
  // FinCompassDashboard
  return <FinCompassDashboard report={{}} form={form} />;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: themes.light.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderColor: themes.light.border },
  headerTitle: { fontSize: 20, fontWeight: '800', color: themes.textPrimary },
  backBtn: { padding: 8 },
  contentPadding: { padding: 20 },
  inputGroup: { flexDirection: 'column', marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: themes.textSecondary, marginBottom: 6 },
  input: { height: 50, borderColor: themes.border, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, backgroundColor: themes.light.surface, color: themes.textPrimary },
  textArea: { height: 100, borderColor: themes.border, borderWidth: 1, borderRadius: 8, padding: 12, backgroundColor: themes.light.surface, color: themes.textPrimary },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  categoryCard: { padding: 16, borderWidth: 1, borderRadius: 12, alignItems: 'center', minWidth: 80 },
  categoryIcon: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  categoryText: { fontSize: 12, textAlign: 'center', color: themes.textPrimary },
  activityArea: { marginVertical: 16 },
  micBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 8, borderWidth: 1, borderColor: themes.border, borderRadius: 8, backgroundColor: themes.light.surface },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 24 },
  prevBtn: { padding: 12, backgroundColor: themes.light.surface, borderRadius: 8 },
  nextBtn: { padding: 12, backgroundColor: themes.accent, borderRadius: 8 },
});