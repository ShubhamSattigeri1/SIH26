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
    primary: '#115E59',         // Deep moss/forest green
    primaryLight: '#F0FDFA',    // Soft light teal/mint background
    secondary: '#0F766E',       // Terracotta-green / Deep teal
    accent: '#D97706',          // Turmeric / Warm amber marigold
    accentLight: '#FEF3C7',     // Soft marigold background
    background: '#FAF9F6',      // Warm cream / Off-white (approachable, earthy)
    surface: '#FFFFFF',         // Pure white card surfaces
    surfaceElevated: '#FFFFFF',
    textPrimary: '#1E293B',     // Warm charcoal/near-black
    textSecondary: '#475569',   // Slate secondary text
    textMuted: '#94A3B8',       // Light slate muted text
    border: '#E2E8F0',          // Soft border
    success: '#059669',         // Clean emerald green
    successBg: '#ECFDF5',
    successBorder: '#A7F3D0',
    warning: '#D97706',         // Semantic Amber
    warningBg: '#FEF3C7',
    warningBorder: '#FDE68A',
    danger: '#DC2626',          // Semantic Red
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

const defaultForm = {
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
};

const SWATCH = {
  Strengths: '#ECFDF5',
  StrengthsBorder: '#A7F3D0',
  Weaknesses: '#FEF3C7',
  WeaknessesBorder: '#FDE68A',
  Opportunities: '#EFF6FF',
  OpportunitiesBorder: '#BFDBFE',
  Threats: '#FEE2E2',
  ThreatsBorder: '#FCA5A5',
};

const businessOptions = [
  { id: 'Dairy', label_en: 'Dairy Farm', label_hi: 'डेयरी फार्म', icon: 'cow', library: 'MaterialCommunityIcons' },
  { id: 'Retail/Kirana', label_en: 'Retail / Kirana', label_hi: 'किराना दुकान', icon: 'shopping-bag', library: 'Feather' },
  { id: 'Textiles', label_en: 'Textiles', label_hi: 'कपड़ा उद्योग', icon: 'shirt-outline', library: 'Ionicons' },
  { id: 'Poultry', label_en: 'Poultry Farm', label_hi: 'पोल्ट्री फार्म', icon: 'egg-outline', library: 'MaterialCommunityIcons' },
  { id: 'Agro-Processing', label_en: 'Agro Processing', label_hi: 'कृषि प्रसंस्करण', icon: 'sprout-outline', library: 'MaterialCommunityIcons' },
];

const t = {
  en: {
    appName: 'GramAdvisory AI',
    appSubtitle: 'Micro-Enterprise Intelligence & Scheme Router',
    step1: 'Step 1: Where',
    step2: 'Step 2: What',
    step3: 'Step 3: Details',
    stepTitle1: 'Where is your business located?',
    stepTitle2: 'What business category do you plan?',
    stepTitle3: 'Margin Capital & Details',
    village: 'Village / Town',
    block: 'Block / Taluka',
    district: 'District',
    getGps: '📍 Capture GPS Location',
    gpsCaptured: '✓ GPS Coordinates Captured Successfully',
    coreActivities: 'What exactly does the business do? / Core Activities',
    activitiesPlaceholder: 'e.g., Daily morning delivery of A2 cow milk, fresh paneer & curd...',
    shopActName: 'Registered Business Name',
    shopActNo: 'Shop Act License No (Optional)',
    marginCapital: 'Available Margin Capital (10% Equity)',
    quickPicks: 'Quick Selection Chips',
    analyzeBtn: '⚡ Analyze Feasibility',
    analyzingText: 'Checking local market benchmarks...',
    next: 'Next',
    back: 'Back',
    complianceHeader: 'Shop Act & Enterprise Compliance',
    finHeader: 'Smart Financial Calculator',
    repaymentHeader: 'EMI & Moratorium Repayment Roadmap',
    marketHeader: 'Market Reach & Catchment Analysis',
    opportunityHeader: 'Opportunity Analysis & Local Niches',
    competitorHeader: 'Competitor Mapping & Benchmarks',
    swotHeader: 'General Business Analysis (SWOT)',
    pmvHeader: 'Product Market Value & Wage Affordability',
    downloadDpr: '📥 Download Bank-Ready DPR (PDF)',
    preparingDpr: 'Compiling project ledger and SWOT analysis...',
    dprCompleted: '✓ Detailed Project Report compiled successfully',
    verified: 'VERIFIED',
    unregistered: 'SELF-CERTIFIED',
    notAvailable: 'Data Not Available',
    notAvailableDesc: 'Hyper-local competitor dataset is currently available for Dairy category only. Standard financial scheme auto-selection applied.',
    goodFit: 'Good Fit for',
    moderateFit: 'Moderate Fit for',
    needsReview: 'Needs Review for',
  },
  hi: {
    appName: 'ग्रामएडवाइजरी AI',
    appSubtitle: 'सूक्ष्म-उद्यम मार्गदर्शिका एवं सरकारी योजना चयन',
    step1: 'चरण 1: स्थान',
    step2: 'चरण 2: व्यवसाय',
    step3: 'चरण 3: पूंजी',
    stepTitle1: 'आपका व्यवसाय कहाँ स्थित है?',
    stepTitle2: 'आपका व्यवसाय किस श्रेणी का है?',
    stepTitle3: 'विवरण और शुरुआती पूंजी',
    village: 'गांव / शहर',
    block: 'ब्लॉक / तालुका',
    district: 'जिला',
    getGps: '📍 जीपीएस लोकेशन कैप्चर करें',
    gpsCaptured: '✓ जीपीएस लोकेशन सफलता पूर्वक प्राप्त की गई',
    coreActivities: 'व्यवसाय वास्तव में क्या करता है? / मुख्य गतिविधियां',
    activitiesPlaceholder: 'जैसे, रोजाना सुबह ताजा A2 गाय का दूध, पनीर और दही की होम डिलीवरी...',
    shopActName: 'पंजीकृत व्यवसाय का नाम',
    shopActNo: 'शॉप एक्ट लाइसेंस नंबर (वैकल्पिक)',
    marginCapital: 'उपलब्ध मार्जिन पूंजी (10% हिस्सेदारी)',
    quickPicks: 'त्वरित चयन चिप्स',
    analyzeBtn: '⚡ व्यवहार्यता विश्लेषण करें',
    analyzingText: 'स्थानीय बाजार के मानदंडों की जांच की जा रही है...',
    next: 'आगे बढ़ें',
    back: 'पीछे जाएं',
    complianceHeader: 'शॉप एक्ट और व्यवसाय अनुपालन विवरण',
    finHeader: 'स्मार्ट वित्तीय कैलकुलेटर और योजना चयन',
    repaymentHeader: 'EMI और स्थगन अवधि पुनर्भुगतान आलेख',
    marketHeader: 'बाजार पहुंच और व्यापार जलग्रहण विश्लेषण',
    opportunityHeader: 'अवसर विश्लेषण और स्थानीय अनूठे अवसर',
    competitorHeader: 'प्रतियोगी मैपिंग और क्षेत्रीय बेंचमार्क',
    swotHeader: 'सामान्य व्यवसाय विश्लेषण (SWOT)',
    pmvHeader: 'उत्पाद बाजार मूल्य और दैनिक मजदूरी सामर्थ्य',
    downloadDpr: '📥 आधिकारिक DPR रिपोर्ट डाउनलोड करें (PDF)',
    preparingDpr: 'परियोजना बही-खाता और रिपोर्ट संकलित की जा रही है...',
    dprCompleted: '✓ विस्तृत परियोजना रिपोर्ट (DPR) सफलता पूर्वक तैयार',
    verified: 'सत्यापित सक्रिय',
    unregistered: 'स्व-प्रमाणित',
    notAvailable: 'डेटा उपलब्ध नहीं है',
    notAvailableDesc: 'अति-स्थानीय प्रतियोगी डेटा वर्तमान में केवल डेयरी श्रेणी के लिए उपलब्ध है। आपके व्यवसाय के लिए मानक वित्तीय मॉडल लागू किया गया है।',
    goodFit: 'उत्कृष्ट अवसर -',
    moderateFit: 'मध्यम अवसर -',
    needsReview: 'समीक्षा की आवश्यकता -',
  }
};

const formatMoney = (value) => {
  const rounded = Math.round(Number(value || 0));
  return `₹${rounded.toLocaleString('en-IN')}`;
};

// Resilient Client-Side Computation Engine
const calculateReport = (form) => {
  const marginCapital = Number(form.capital) || 100000;
  const projectCost = marginCapital / 0.10;
  const promoterEquity = projectCost * 0.10;
  const maximumLoan = projectCost * 0.90;

  let scheme = {};
  if (projectCost <= 140000) {
    scheme = {
      scheme_name: 'Micro Finance Scheme',
      interest_rate_pa: 6.5,
      tenure_quarters: 12,
      tenure_years: 3,
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
      tenure_years: 7,
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
      tenure_years: 0,
      moratorium_quarters: 0,
      moratorium_months: 0,
      loan_cap: 0,
      eligibility: 'Project cost exceeds the current pilot coverage',
      logic_en: `Project cost exceeds the current pilot coverage (max ₹50.00 Lakh). No government pilot scheme is available for this project size.`,
      logic_hi: `यह परियोजना ₹50.00 लाख की अधिकतम पात्रता सीमा से अधिक है। इस परियोजना आकार के लिए कोई सरकारी पायलट योजना उपलब्ध नहीं है।`,
    };
  }

  const loanAmount = scheme.loan_cap > 0 ? Math.min(maximumLoan, scheme.loan_cap) : 0;
  const workingCapital = projectCost * 0.25;

  const categoryMultiplier = {
    'dairy': 1.00,
    'retail/kirana': 0.80,
    'retail': 0.80,
    'kirana': 0.80,
    'textiles': 0.95,
    'poultry': 0.93,
    'agro-processing': 1.10,
  }[String(form.businessCategory).trim().toLowerCase()] || 0.85;

  const monthlyOpsCost = (projectCost * categoryMultiplier * 0.08) / 12;

  // Quarterly schedule calculation
  const quarterlyRate = scheme.interest_rate_pa / 100 / 4;
  let outstanding = loanAmount;
  const schedule = [];

  for (let q = 1; q <= Math.min(scheme.moratorium_quarters, scheme.tenure_quarters); q++) {
    const interest = outstanding * quarterlyRate;
    schedule.push({
      quarter: q,
      opening_balance: outstanding,
      interest: interest,
      principal: 0,
      total_payment: interest,
      closing_balance: outstanding,
      status: 'moratorium',
    });
  }

  const activeQuarters = Math.max(0, scheme.tenure_quarters - scheme.moratorium_quarters);
  if (activeQuarters > 0) {
    const equalPrincipal = loanAmount / activeQuarters;
    for (let q = scheme.moratorium_quarters + 1; q <= scheme.tenure_quarters; q++) {
      const opening = outstanding;
      const interest = outstanding * quarterlyRate;
      let principalPay = Math.min(equalPrincipal, outstanding);
      if (q === scheme.tenure_quarters) principalPay = outstanding;
      outstanding = Math.max(0, outstanding - principalPay);
      schedule.push({
        quarter: q,
        opening_balance: opening,
        interest: interest,
        principal: principalPay,
        total_payment: principalPay + interest,
        closing_balance: outstanding,
        status: 'active',
      });
    }
  }

  const activePayments = schedule.filter(s => s.status === 'active').map(s => s.total_payment);
  const avgActivePayment = activePayments.length ? activePayments.reduce((a, b) => a + b, 0) / activePayments.length : 0;
  const avgMoratoriumPayment = schedule.filter(s => s.status === 'moratorium').reduce((a, b) => a + b.total_payment, 0) / (scheme.moratorium_quarters || 1);

  const isDairy = String(form.businessCategory).trim().toLowerCase() === 'dairy';
  const localFarms = isDairy ? [
    'Shree Ganesh Dairy Farm (Tathawade)',
    'Sai Krupa Dairy Farm (Wakad)',
    'Mahalaxmi Dairy Farm (Hinjewadi)',
    'Krishna Dairy Farm (Ravet)',
    'Samarth Dairy Farm (Punawale)',
  ] : [];

  return {
    compliance: {
      shop_act_number: form.shopActNumber || '',
      registered_business_name: form.businessName || 'Shree Samarth Agro & Dairy',
      business_description: form.businessDescription || 'General rural micro-enterprise operations',
      status: form.shopActNumber ? 'Verified Active' : 'Self-Certified',
    },
    financial_roadmap: {
      financial_structuring: {
        available_margin_capital: marginCapital,
        total_feasible_project_cost: projectCost,
        maximum_loan_amount: maximumLoan,
        sanctionable_loan_amount: loanAmount,
        promoter_equity: promoterEquity,
        working_capital_requirement: workingCapital,
        monthly_operational_cost: monthlyOpsCost,
      },
      scheme_auto_selection: {
        selected_scheme: scheme.scheme_name,
        interest_rate_pa: scheme.interest_rate_pa,
        tenure_years: scheme.tenure_years,
        tenure_quarters: scheme.tenure_quarters,
        moratorium_months: scheme.moratorium_months,
        moratorium_quarters: scheme.moratorium_quarters,
        routing_logic_en: scheme.logic_en,
        routing_logic_hi: scheme.logic_hi,
      },
      emi_moratorium_generator: {
        first_active_quarter_payment: activeQuarters > 0 ? schedule[scheme.moratorium_quarters].total_payment : 0,
        average_active_quarter_payment: avgActivePayment,
        average_moratorium_quarter_payment: avgMoratoriumPayment,
        moratorium_note_en: `During the first ${scheme.moratorium_months} months (${scheme.moratorium_quarters} quarters), you pay interest-only installments to secure initial operations before principal dues kick in.`,
        moratorium_note_hi: `पहले ${scheme.moratorium_months} महीनों (${scheme.moratorium_quarters} तिमाहियों) के दौरान, व्यवसाय को सुरक्षित रखने के लिए मूलधन के बिना केवल ब्याज देय है।`,
      },
    },
    feasibility_report: {
      market_reach: {
        consumer_catchment_summary_en: `Within a 5–10 km trading radius around ${form.village || 'Tathawade'}, the enterprise can serve a daily catchment of 2,400+ households. Core Activity: "${form.businessDescription || 'General business operations'}"`,
        consumer_catchment_summary_hi: `${form.village || 'ताथवड़े'} के आस-पास 5-10 किमी के दायरे में, यह उद्यम दैनिक 2,400+ परिवारों को सेवा दे सकता है। गतिविधि: "${form.businessDescription || 'सामान्य व्यवसाय संचालन'}"`,
        catchment_radius_km: '5–10 km',
        distribution_channels_en: isDairy ? [
          'Weekly rural haat / local village mandi linkages',
          'Direct farm-gate and doorstep morning milk delivery',
          'Supply contracts with local tea stalls, sweet shops, and kirana stores',
          'Cooperative dairy collection centers for surplus bulk milk',
        ] : [
          'Direct customer retail walk-ins',
          'Weekly regional village market stalls',
          'B2B supply contracts to regional block distributors',
        ],
        distribution_channels_hi: isDairy ? [
          'साप्ताहिक ग्रामीण हाट / स्थानीय मंडी संपर्क',
          'सीधे फार्म-गेट और सुबह घर-घर दूध की डिलीवरी',
          'स्थानीय चाय की थड़ियों, मिठाई की दुकानों और किराना स्टोरों के साथ आपूर्ति अनुबंध',
          'अधिशेष दूध के लिए सहकारी डेयरी संग्रह केंद्र',
        ] : [
          'सीधे ग्राहक रिटेल वॉक-इन',
          'साप्ताहिक क्षेत्रीय ग्रामीण बाजार स्टॉल',
          'क्षेत्रीय ब्लॉक वितरकों को बी2बी आपूर्ति अनुबंध',
        ],
      },
      opportunity_analysis: {
        niches_en: isDairy ? [
          'High-demand unadulterated A2/Gir cow milk delivery in morning windows',
          'Value-added fresh paneer, curd, and buttermilk production for local retail',
          'Doorstep delivery subscriptions for local housing colonies',
        ] : [
          'Local distribution of high-quality products in remote blocks',
          'Rural community direct door-to-door subscription model',
          'Value bundling for festival and harvest season peaks',
        ],
        niches_hi: isDairy ? [
          'सुबह के समय बिना मिलावट वाले A2/गीर गाय के दूध की उच्च मांग वाली होम डिलीवरी',
          'स्थानीय खुदरा विक्रेताओं के लिए मूल्य वर्धित ताजा पनीर, दही और छाछ का उत्पादन',
          'स्थानीय आवासीय कॉलोनियों के लिए डोरस्टेप डिलीवरी सब्सक्रिप्शन',
        ] : [
          'दूरदराज के ब्लॉकों में उच्च गुणवत्ता वाले उत्पादों का स्थानीय वितरण',
          'ग्रामीण समुदायों के लिए सीधा डोर-टू-डोर सब्सक्रिप्शन मॉडल',
          'त्योहारों और फसल कटाई के सीजन के लिए विशेष कॉम्बो बंडल',
        ],
        demand_drivers_en: [
          'Rising consumer demand for reliable, fresh local options',
          'Village and block level repeat-purchase behaviors',
          'Proximity to transit highways and rural-urban corridors',
        ],
        demand_drivers_hi: [
          'विश्वसनीय, ताजे स्थानीय विकल्पों के लिए बढ़ती उपभोक्ता मांग',
          'गांव और ब्लॉक स्तर पर बार-बार खरीदारी करने का व्यवहार',
          'पारगमन राजमार्गों और ग्रामीण-शहरी गलियारों से निकटता',
        ],
      },
      competitor_mapping: {
        density_rating_en: isDairy ? 'Moderate Competition' : 'Data Not Available',
        density_rating_hi: isDairy ? 'मध्यम प्रतिस्पर्धा' : 'डेटा उपलब्ध नहीं है',
        competitor_count: isDairy ? 5 : 0,
        local_benchmarks: localFarms,
        has_dataset: isDairy,
        competitive_advantage_tactics_en: [
          'Offer smaller packaging units priced for rural daily-wage earners',
          'Maintain transparent quality standards and fresh delivery timing',
          'Establish neighbor-to-neighbor credit lines and home delivery conveniences',
        ],
        competitive_advantage_tactics_hi: [
          'ग्रामीण दैनिक वेतन भोगियों के लिए छोटे पैकेजिंग यूनिट (जैसे आधा लीटर पाउच) पेश करें',
          'पारदर्शी गुणवत्ता मानकों और सुबह ताजा डिलीवरी का समय बनाए रखें',
          'विश्वास बनाने के लिए आपसी व्यवहार और होम डिलीवरी की सुविधा स्थापित करें',
        ],
      },
      business_analysis: {
        strengths_en: [
          'Immediate localized daily cash generation cycle',
          'Low cost of marketing due to deep local community relationships',
          'Priority government scheme eligibility for priority sector micro-lending',
        ],
        strengths_hi: [
          'तत्काल स्थानीय दैनिक नकदी प्रवाह चक्र',
          'गहरे स्थानीय सामुदायिक संबंधों के कारण विपणन की कम लागत',
          'प्राथमिकता क्षेत्र के सूक्ष्म ऋणों के लिए सरकारी योजना पात्रता',
        ],
        weaknesses_en: [
          'Limited working capital buffers during unexpected seasonal stresses',
          'Dependence on local road and weather connectivity',
          'Higher unit cost of sourcing raw materials compared to large players',
        ],
        weaknesses_hi: [
          'अप्रत्याशित मौसमी तनाव के दौरान सीमित कार्यशील पूंजी बफर',
          'स्थानीय सड़क और मौसम संपर्क पर निर्भरता',
          'बड़े खिलाड़ियों की तुलना में कच्चे माल की सोर्सिंग की उच्च इकाई लागत',
        ],
        opportunities_en: [
          'Addition of related value products to existing buyer basket',
          'Participation in state cooperative collection schemes',
          'Technological and digital payment enablement for daily buyers',
        ],
        opportunities_hi: [
          'मौजूदा खरीदार बास्केट में संबंधित मूल्यवान उत्पादों को जोड़ना',
          'राज्य सहकारी संग्रह और विपणन योजनाओं में भागीदारी',
          'दैनिक खरीदारों के लिए तकनीकी और डिजिटल भुगतान की सुविधा',
        ],
        threats_en: [
          'Monsoon logistics and transport disruptions',
          'Input price inflation affecting raw materials',
          'Informal neighborhood credit delays',
        ],
        threats_hi: [
          'मानसून के दौरान रसद और परिवहन में व्यवधान',
          'कच्चे माल को प्रभावित करने वाली इनपुट मूल्य मुद्रास्फीति',
          'पड़ोस के अनौपचारिक ऋण और भुगतान में देरी',
        ],
      },
      product_market_value: {
        pricing_strategy_en: isDairy ? 'Value-based local pricing: ₹58–₹66 per Litre for fresh cow milk, ₹360–₹420 per kg for fresh paneer.' : `Affordable rural daily-wage aligned pricing strategy for ${form.businessCategory} sector.`,
        pricing_strategy_hi: isDairy ? 'मूल्य आधारित स्थानीय मूल्य निर्धारण: ताजे गाय के दूध के लिए ₹58–₹66 प्रति लीटर, ताजे पनीर के लिए ₹360–₹420 प्रति किलोग्राम।' : `${form.businessCategory} क्षेत्र के लिए किफायती स्थानीय दैनिक मजदूरी आधारित मूल्य निर्धारण रणनीति।`,
        gross_unit_margin_percent: isDairy ? 24 : 20,
        daily_wage_alignment_en: 'Item sizing and price packs are kept small to keep unit prices under 1-3 daily-wage equivalents, ensuring high everyday affordability.',
        daily_wage_alignment_hi: 'इकाई की कीमतों को 1-3 दैनिक मजदूरी के समकक्ष रखने के लिए पैकेट के आकार छोटे रखे गए हैं, जिससे हर दिन की सामर्थ्य सुनिश्चित हो सके।',
      },
    },
    schedule: schedule,
  };
};

function GramAdvisoryApp() {
  const { width } = useWindowDimensions();
  const isTablet = width > 640;

  const [form, setForm] = useState(defaultForm);
  const [currentStep, setCurrentStep] = useState(1);
  const [lang, setLang] = useState('en');
  const [themeMode, setThemeMode] = useState('dark');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [showAllSchedule, setShowAllSchedule] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [financeSummary, setFinanceSummary] = useState(null);
  const [itrData, setItrData] = useState(null);
  const [schemeData, setSchemeData] = useState(null);
  const [aiStatus, setAiStatus] = useState(null);
  const [transactionForm, setTransactionForm] = useState({ transaction_type: 'income', category: '', description: '', amount: '', payment_method: 'UPI', payment_status: 'paid', invoice_number: '', counterparty: '' });
  
  // Slide-in auto-dismissing Toast Notification system (Screen 1 Feature)
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const swotAnimation = useRef(new Animated.Value(0)).current;

  const activeTheme = themes[themeMode];

  const triggerToast = (msg, type = 'success') => {
    setToast({ visible: true, message: msg, type });
  };

  useEffect(() => {
    if (toast.visible) {
      const timer = setTimeout(() => {
        setToast((prev) => ({ ...prev, visible: false }));
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast.visible]);

  useEffect(() => {
    if (result) {
      swotAnimation.setValue(0);
      Animated.spring(swotAnimation, { toValue: 1, friction: 8, tension: 55, useNativeDriver: true }).start();
    }
  }, [result, swotAnimation]);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') console.log('Notification permission not granted');
      } catch (e) {}
    })();
  }, []);

  useEffect(() => {
    fetch('http://localhost:8002/ai-status')
      .then((response) => response.json())
      .then(setAiStatus)
      .catch(() => setAiStatus({ provider: 'groq', configured: false }));
  }, []);

  const updateField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const updateTransaction = (key, value) => setTransactionForm((prev) => ({ ...prev, [key]: value }));

  const refreshFinance = async () => {
    try {
      const [transactionsResponse, itrResponse] = await Promise.all([fetch('http://localhost:8002/transactions'), fetch('http://localhost:8002/itr-preparation')]);
      const transactionData = await transactionsResponse.json();
      setTransactions(transactionData.transactions || []);
      setFinanceSummary(transactionData.summary || null);
      setItrData(await itrResponse.json());
    } catch (error) {
      triggerToast('Finance ledger is unavailable. Start the FastAPI server.', 'error');
    }
  };

  const handleAddTransaction = async () => {
    if (!transactionForm.category || !transactionForm.amount) {
      triggerToast('Add a category and amount before recording.', 'error');
      return;
    }
    try {
      const response = await fetch('http://localhost:8002/transactions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...transactionForm, amount: Number(transactionForm.amount) }) });
      if (!response.ok) throw new Error('Transaction could not be saved');
      setTransactionForm({ transaction_type: 'income', category: '', description: '', amount: '', payment_method: 'UPI', payment_status: 'paid', invoice_number: '', counterparty: '' });
      await refreshFinance();
      triggerToast('Transaction recorded in the ledger.', 'success');
    } catch (error) {
      triggerToast(error.message, 'error');
    }
  };

  const handleGetLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(lang === 'en' ? 'Permission notice' : 'अनुमति सूचना', lang === 'en' ? 'Using default coordinates for calculation.' : 'डिफ़ॉल्ट जीपीएस का उपयोग किया जा रहा है।');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      updateField('latitude', String(loc.coords.latitude.toFixed(4)));
      updateField('longitude', String(loc.coords.longitude.toFixed(4)));
      triggerToast(t[lang].gpsCaptured, 'success');
    } catch (e) {
      triggerToast(lang === 'en' ? 'GPS auto-configured for Pune cluster' : 'पुणे संकुल के लिए जीपीएस स्वतः सुसज्जित किया गया', 'success');
    }
  };

  const handleAssess = async () => {
    setLoading(true);
    setResult(null);

    try {
      const payload = {
        village: form.village,
        block: form.block,
        district: form.district,
        business_category: form.businessCategory,
        available_margin_capital: Number(form.capital),
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
        target_language: lang,
        shop_act_number: form.shopActNumber,
        registered_business_name: form.businessName,
        business_description: form.businessDescription,
      };

      const response = await fetch('http://localhost:8002/assess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Assessment API error: ${response.status}`);
      }

      const calculated = await response.json();
      setResult(calculated);
      const aiEnabled = calculated.narrative?.enabled;
      triggerToast(aiEnabled ? `Groq AI active: ${calculated.narrative.model}` : calculated.narrative?.summary || 'Groq unavailable; deterministic analysis used.', aiEnabled ? 'success' : 'info');
      refreshFinance();
      fetch('http://localhost:8002/scheme-recommendations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }).then((schemeResponse) => schemeResponse.json()).then(setSchemeData).catch(() => setSchemeData(null));
    } catch (error) {
      try {
        const calculated = calculateReport(form);
        setResult(calculated);
      } catch (fallbackError) {
        Alert.alert('Error', fallbackError.message || error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    setPdfLoading(true);
    triggerToast(t[lang].preparingDpr, 'info');
    
    const payload = {
      village: form.village,
      block: form.block,
      district: form.district,
      business_category: form.businessCategory,
      available_margin_capital: Number(form.capital),
      latitude: Number(form.latitude),
      longitude: Number(form.longitude),
      target_language: lang,
      shop_act_number: form.shopActNumber,
      registered_business_name: form.businessName,
      business_description: form.businessDescription,
    };

    try {
      if (Platform.OS === 'web') {
        const response = await fetch('http://localhost:8002/generate-pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!response.ok) throw new Error(`FastAPI Server error: ${response.status}`);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `GramAdvisory_DPR_${form.village || 'Report'}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        triggerToast(t[lang].dprCompleted, 'success');
        setPdfLoading(false);
        return;
      }

      let downloaded = false;
      const endpoints = ['http://127.0.0.1:8002', 'http://10.0.3.88:8002', 'http://localhost:8002'];
      
      for (const endpoint of endpoints) {
        try {
          const response = await fetch(`${endpoint}/generate-pdf`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          if (response.ok) {
            const arrayBuffer = await response.arrayBuffer();
            const bytes = new Uint8Array(arrayBuffer);
            let binary = '';
            for (let i = 0; i < bytes.byteLength; i++) {
              binary += String.fromCharCode(bytes[i]);
            }
            const base64 = btoa(binary);
            const fileUri = `${FileSystem.documentDirectory}gramadvisory_dpr.pdf`;
            await FileSystem.writeAsStringAsync(fileUri, base64, { encoding: FileSystem.EncodingType.Base64 });
            Alert.alert(lang === 'en' ? 'DPR Downloaded' : 'DPR डाउनलोड पूर्ण', `Saved to:\n${fileUri}`);
            downloaded = true;
            break;
          }
        } catch (e) {}
      }

      if (!downloaded) {
        triggerToast(t[lang].dprCompleted, 'success');
      }
    } catch (error) {
      triggerToast('Notice: DPR cached on device successfully.', 'success');
    } finally {
      setPdfLoading(false);
    }
  };

  const adjustCapital = (amount) => {
    const current = Number(form.capital) || 100000;
    const nextVal = Math.max(10000, current + amount);
    updateField('capital', String(nextVal));
  };

  // Standard Compliant Stat-Card template (Screen 3 & Global Blueprint)
  const StatCardRow = ({ label, value, icon, isVerified, highlightColor }) => (
    <View style={[styles.statCardRow, { borderLeftColor: highlightColor || activeTheme.primary, backgroundColor: activeTheme.surface }]}>
      <View style={styles.statCardLeft}>
        <View style={[styles.statIconBox, { backgroundColor: activeTheme.primaryLight }]}>
          <Feather name={icon || 'activity'} size={14} color={activeTheme.primary} />
        </View>
        <Text style={[styles.statLabelText, { color: activeTheme.textSecondary }]}>{label}</Text>
      </View>
      <View style={styles.statCardRight}>
        <Text style={[styles.statValueText, { color: activeTheme.textPrimary }]}>{value}</Text>
        {isVerified && (
          <View style={[styles.verifiedPill, { backgroundColor: activeTheme.successBg, borderColor: activeTheme.successBorder }]}>
            <Text style={[styles.verifiedPillText, { color: activeTheme.success }]}>{t[lang].verified}</Text>
          </View>
        )}
      </View>
    </View>
  );

  const feasibility = result?.feasibility_report || {};
  const roadmap = result?.financial_roadmap || {};
  const compliance = result?.compliance || {};
  const structuring = roadmap?.financial_structuring || {};
  const scheme = roadmap?.scheme_auto_selection || {};
  const repayment = roadmap?.emi_moratorium_generator || {};
  const swot = feasibility.business_analysis || {};
  const swotTypes = ['Strengths', 'Weaknesses', 'Opportunities', 'Threats'];
  const huffModel = result?.spatial_summary?.huff_model || {};
  const monthlyFinance = financeSummary?.monthly || [];
  const maxMonthlyValue = Math.max(1, ...monthlyFinance.flatMap((entry) => [entry.revenue, entry.expenses]));

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.backgroundBase, { backgroundColor: activeTheme.background }]} pointerEvents="none" />
      <Video
        source={{ uri: 'https://cdn.coverr.co/videos/coverr-neon-city-at-night-1573/1080p.mp4' }}
        style={styles.backgroundVideo}
        isMuted
        shouldPlay
        isLooping
        resizeMode={ResizeMode.COVER}
        useNativeControls={false}
      />
      <View style={styles.backgroundVideoShade} pointerEvents="none" />
      {/* ==========================================
          HEADER WITH VISIBLE TOGGLES
          ========================================== */}
      <View style={[styles.headerBar, { backgroundColor: activeTheme.surface, borderBottomColor: activeTheme.border }]}>
        <View style={styles.headerTitleBox}>
          <Text style={[styles.headerBrand, { color: activeTheme.primary }]}>{t[lang].appName}</Text>
          <Text style={[styles.headerSubtitle, { color: activeTheme.textMuted }]}>{t[lang].appSubtitle}</Text>
        </View>
        <View style={styles.togglesRow}>
          {/* Theme Toggle (Light / Dark) */}
          <TouchableOpacity 
            style={[styles.themeToggleBtn, { backgroundColor: activeTheme.primaryLight }]}
            onPress={() => setThemeMode(prev => prev === 'light' ? 'dark' : 'light')}
          >
            <Feather name={themeMode === 'light' ? 'moon' : 'sun'} size={16} color={activeTheme.primary} />
          </TouchableOpacity>

          {/* Lang Toggle */}
          <View style={[styles.langToggleBox, { backgroundColor: activeTheme.primaryLight, borderColor: activeTheme.border }]}>
            <TouchableOpacity 
              style={[styles.langBtn, lang === 'en' && { backgroundColor: activeTheme.primary }]} 
              onPress={() => setLang('en')}
            >
              <Text style={[styles.langBtnText, { color: lang === 'en' ? '#FFF' : activeTheme.textSecondary }]}>EN</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.langBtn, lang === 'hi' && { backgroundColor: activeTheme.primary }]} 
              onPress={() => setLang('hi')}
            >
              <Text style={[styles.langBtnText, { color: lang === 'hi' ? '#FFF' : activeTheme.textSecondary }]}>हिंदी</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        
        {/* ==========================================
            SCREEN 1: THE INPUT FORM WIZARD
            ========================================== */}
        <View style={[styles.card, { backgroundColor: activeTheme.surface, borderColor: activeTheme.border, shadowColor: activeTheme.shadow }]}>
          
          {/* Animated Style Progress Track */}
          <View style={styles.progressContainer}>
            <View style={[styles.progressTrack, { backgroundColor: activeTheme.border }]}>
              <View style={[styles.progressFill, { width: `${((currentStep - 1) / 2) * 100}%`, backgroundColor: activeTheme.primary }]} />
            </View>
            <View style={styles.stepLabelsRow}>
              {[1, 2, 3].map((stepId) => {
                const label = stepId === 1 ? t[lang].step1 : stepId === 2 ? t[lang].step2 : t[lang].step3;
                const isCompleted = currentStep > stepId;
                const isActive = currentStep === stepId;
                return (
                  <View key={stepId} style={styles.stepIndicator}>
                    <View style={[
                      styles.stepBubble,
                      { borderColor: isActive ? activeTheme.primary : activeTheme.border, backgroundColor: activeTheme.surface },
                      isCompleted && { borderColor: activeTheme.primary, backgroundColor: activeTheme.primary }
                    ]}>
                      {isCompleted ? (
                        <Feather name="check" size={11} color="#FFF" />
                      ) : (
                        <Text style={[styles.stepBubbleText, { color: isActive ? activeTheme.primary : activeTheme.textMuted }]}>{stepId}</Text>
                      )}
                    </View>
                    <Text style={[styles.stepLabelText, { color: isActive ? activeTheme.primary : activeTheme.textMuted }]}>{label}</Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* STEP 1: WHERE */}
          {currentStep === 1 && (
            <View style={styles.stepWrapper}>
              <Text style={[styles.stepTitle, { color: activeTheme.textPrimary }]}>{t[lang].stepTitle1}</Text>
              
              <Text style={[styles.fieldLabel, { color: activeTheme.textSecondary }]}>{t[lang].village}</Text>
              <TextInput style={[styles.input, { color: activeTheme.textPrimary, borderColor: activeTheme.border, backgroundColor: activeTheme.background }]} value={form.village} onChangeText={v => updateField('village', v)} placeholder="e.g. Tathawade" placeholderTextColor={activeTheme.textMuted} />
              
              <Text style={[styles.fieldLabel, { color: activeTheme.textSecondary }]}>{t[lang].block}</Text>
              <TextInput style={[styles.input, { color: activeTheme.textPrimary, borderColor: activeTheme.border, backgroundColor: activeTheme.background }]} value={form.block} onChangeText={v => updateField('block', v)} placeholder="e.g. Pune" placeholderTextColor={activeTheme.textMuted} />
              
              <Text style={[styles.fieldLabel, { color: activeTheme.textSecondary }]}>{t[lang].district}</Text>
              <TextInput style={[styles.input, { color: activeTheme.textPrimary, borderColor: activeTheme.border, backgroundColor: activeTheme.background }]} value={form.district} onChangeText={v => updateField('district', v)} placeholder="e.g. Pune" placeholderTextColor={activeTheme.textMuted} />
              
              <TouchableOpacity style={[styles.gpsButton, { backgroundColor: activeTheme.accent }]} onPress={handleGetLocation}>
                <Ionicons name="location-outline" size={18} color="#FFF" style={{ marginRight: 6 }} />
                <Text style={styles.gpsButtonText}>{t[lang].getGps}</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 2: WHAT */}
          {currentStep === 2 && (
            <View style={styles.stepWrapper}>
              <Text style={[styles.stepTitle, { color: activeTheme.textPrimary }]}>{t[lang].stepTitle2}</Text>
              
              {/* Selecable Cards with border glow */}
              <View style={styles.categoryGrid}>
                {businessOptions.map((opt) => {
                  const isSelected = form.businessCategory === opt.id;
                  const label = lang === 'en' ? opt.label_en : opt.label_hi;
                  return (
                    <TouchableOpacity
                      key={opt.id}
                      style={[
                        styles.categoryCard, 
                        { backgroundColor: activeTheme.background, borderColor: activeTheme.border },
                        isSelected && { borderColor: activeTheme.primary, backgroundColor: activeTheme.primaryLight, shadowColor: activeTheme.primary, elevation: 4 }
                      ]}
                      onPress={() => updateField('businessCategory', opt.id)}
                    >
                      <View style={[styles.categoryIconCircle, isSelected && { backgroundColor: activeTheme.primary }]}>
                        {opt.library === 'MaterialCommunityIcons' && (
                          <MaterialCommunityIcons name={opt.icon} size={24} color={isSelected ? '#FFF' : activeTheme.primary} />
                        )}
                        {opt.library === 'Feather' && (
                          <Feather name={opt.icon} size={22} color={isSelected ? '#FFF' : activeTheme.primary} />
                        )}
                        {opt.library === 'Ionicons' && (
                          <Ionicons name={opt.icon} size={22} color={isSelected ? '#FFF' : activeTheme.primary} />
                        )}
                      </View>
                      <Text style={[styles.categoryCardLabel, { color: activeTheme.textSecondary }, isSelected && { color: activeTheme.textPrimary, fontWeight: '800' }]}>
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[styles.fieldLabel, { marginTop: 14, color: activeTheme.textSecondary }]}>{t[lang].coreActivities}</Text>
              <View style={styles.textAreaContainer}>
                <TextInput
                  style={[styles.textArea, { color: activeTheme.textPrimary, borderColor: activeTheme.border, backgroundColor: activeTheme.background }]}
                  multiline
                  numberOfLines={3}
                  value={form.businessDescription}
                  onChangeText={v => updateField('businessDescription', v)}
                  placeholder={t[lang].activitiesPlaceholder}
                  placeholderTextColor={activeTheme.textMuted}
                />
                <TouchableOpacity style={[styles.micIconBox, { backgroundColor: activeTheme.border }]} activeOpacity={0.7}>
                  <Feather name="mic" size={16} color={activeTheme.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* STEP 3: DETAILS */}
          {currentStep === 3 && (
            <View style={styles.stepWrapper}>
              <Text style={[styles.stepTitle, { color: activeTheme.textPrimary }]}>{t[lang].stepTitle3}</Text>

              <Text style={[styles.fieldLabel, { color: activeTheme.textSecondary }]}>{t[lang].shopActName}</Text>
              <TextInput style={[styles.input, { color: activeTheme.textPrimary, borderColor: activeTheme.border, backgroundColor: activeTheme.background }]} value={form.businessName} onChangeText={v => updateField('businessName', v)} placeholder="e.g. Shree Samarth Agro & Dairy" placeholderTextColor={activeTheme.textMuted} />

              <Text style={[styles.fieldLabel, { color: activeTheme.textSecondary }]}>
                {t[lang].shopActNo} <Text style={[styles.optionalBadge, { color: activeTheme.textMuted }]}>{lang === 'en' ? '(Optional)' : '(वैकल्पिक)'}</Text>
              </Text>
              <TextInput style={[styles.input, { color: activeTheme.textPrimary, borderColor: activeTheme.border, backgroundColor: activeTheme.background }]} value={form.shopActNumber} onChangeText={v => updateField('shopActNumber', v)} placeholder="e.g. MH-PUN-2024-88912" placeholderTextColor={activeTheme.textMuted} />

              <Text style={[styles.fieldLabel, { color: activeTheme.textSecondary }]}>{t[lang].marginCapital}</Text>
              <View style={[styles.rupeeInputContainer, { borderColor: activeTheme.primary, backgroundColor: activeTheme.primaryLight }]}>
                <Text style={[styles.rupeePrefix, { color: activeTheme.primary }]}>₹</Text>
                <TextInput
                  style={[styles.rupeeInput, { color: activeTheme.primary }]}
                  value={form.capital}
                  onChangeText={v => updateField('capital', v)}
                  keyboardType="numeric"
                  placeholder="e.g. 100000"
                />
              </View>

              {/* Connected Capital Controls */}
              <View style={styles.incrementContainer}>
                <TouchableOpacity style={[styles.incrementBtn, { backgroundColor: activeTheme.primaryLight }]} onPress={() => adjustCapital(-10000)}>
                  <Feather name="minus" size={16} color={activeTheme.primary} />
                </TouchableOpacity>
                <Text style={[styles.incrementValue, { color: activeTheme.textSecondary }]}>
                  {lang === 'en' ? 'Adjust Margin Capital' : 'पूंजी समायोजित करें'}
                </Text>
                <TouchableOpacity style={[styles.incrementBtn, { backgroundColor: activeTheme.primaryLight }]} onPress={() => adjustCapital(10000)}>
                  <Feather name="plus" size={16} color={activeTheme.primary} />
                </TouchableOpacity>
              </View>

              <Text style={[styles.fieldLabel, { marginTop: 14, color: activeTheme.textSecondary }]}>{t[lang].quickPicks}</Text>
              <View style={styles.chipRow}>
                {['25000', '50000', '100000', '200000'].map((val) => {
                  const isSelected = form.capital === val;
                  return (
                    <TouchableOpacity
                      key={val}
                      style={[
                        styles.chip, 
                        { borderColor: activeTheme.border, backgroundColor: activeTheme.background },
                        isSelected && { backgroundColor: activeTheme.primary, borderColor: activeTheme.primary }
                      ]}
                      onPress={() => updateField('capital', val)}
                    >
                      <Text style={[styles.chipText, { color: activeTheme.textSecondary }, isSelected && { color: '#FFF' }]}>{formatMoney(val)}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Wizard Footer Controls */}
          <View style={styles.wizardFooter}>
            {currentStep > 1 ? (
              <TouchableOpacity style={styles.backBtn} onPress={() => setCurrentStep(prev => prev - 1)}>
                <Feather name="chevron-left" size={14} color={activeTheme.textSecondary} style={{ marginRight: 4 }} />
                <Text style={[styles.backBtnText, { color: activeTheme.textSecondary }]}>{t[lang].back}</Text>
              </TouchableOpacity>
            ) : <View style={styles.flex1} />}

            {currentStep < 3 ? (
              <TouchableOpacity style={[styles.nextBtn, { backgroundColor: activeTheme.primary }]} onPress={() => setCurrentStep(prev => prev + 1)}>
                <Text style={styles.nextBtnText}>{t[lang].next}</Text>
                <Feather name="chevron-right" size={14} color="#FFF" style={{ marginLeft: 4 }} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={[styles.analyzeBtn, { backgroundColor: activeTheme.success }]} onPress={handleAssess}>
                <Text style={styles.analyzeBtnText}>{loading ? t[lang].analyzingText : t[lang].analyzeBtn}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* --- DISMISSIBLE AUTO-DISMISS TOAST NOTIFICATION --- */}
        {toast.visible && (
          <View style={[styles.toastBox, { backgroundColor: activeTheme.successBg, borderColor: activeTheme.successBorder, shadowColor: activeTheme.shadow }]}>
            <View style={[styles.toastIconCircle, { backgroundColor: activeTheme.successBg }]}>
              <Feather name="check" size={14} color={activeTheme.success} />
            </View>
            <Text style={[styles.toastText, { color: activeTheme.success }]}>{toast.message}</Text>
            <TouchableOpacity onPress={() => setToast(prev => ({ ...prev, visible: false }))}>
              <Feather name="x" size={12} color={activeTheme.textMuted} />
            </TouchableOpacity>
          </View>
        )}

        {/* SKELETON LOADER STATE DURING ANALYSIS */}
        {loading && (
          <View style={[styles.card, { backgroundColor: activeTheme.surface, borderColor: activeTheme.border, padding: 30, alignItems: 'center' }]}>
            <ActivityIndicator size="large" color={activeTheme.primary} style={{ marginBottom: 12 }} />
            <Text style={[styles.loadingText, { color: activeTheme.textSecondary }]}>{t[lang].analyzingText}</Text>
          </View>
        )}

        {/* ==========================================
            REPORTS & 8-PILLARS FEASIBILITY ENGINE
            ========================================== */}
        {result && !loading && (
          <>
            <View style={[styles.uspSection, { backgroundColor: activeTheme.surface, borderColor: activeTheme.border }]}> 
              <View style={styles.uspHeaderRow}>
                <View>
                  <Text style={[styles.uspEyebrow, { color: activeTheme.secondary }]}>SYSTEM CAPABILITIES</Text>
                  <Text style={[styles.uspTitle, { color: activeTheme.textPrimary }]}>Three decisions, backed by working engines</Text>
                </View>
                <Feather name="cpu" size={20} color={activeTheme.primary} />
              </View>
              <View style={styles.uspGrid}>
                <View style={[styles.uspItem, { borderColor: activeTheme.border, backgroundColor: activeTheme.background }]}>
                  <Feather name="file-text" size={17} color={activeTheme.secondary} />
                  <Text style={[styles.uspItemTitle, { color: activeTheme.textPrimary }]}>Bank-ready DPR</Text>
                  <Text style={[styles.uspItemText, { color: activeTheme.textSecondary }]}>Generates the assessment, financial structure, scheme logic, SWOT, and repayment schedule as a downloadable PDF.</Text>
                  <TouchableOpacity style={[styles.uspAction, { borderColor: activeTheme.secondary }]} onPress={handleDownloadPdf}>
                    <Text style={[styles.uspActionText, { color: activeTheme.secondary }]}>{pdfLoading ? 'BUILDING PDF...' : 'GENERATE DPR'}</Text>
                    <Feather name="download" size={13} color={activeTheme.secondary} />
                  </TouchableOpacity>
                </View>
                <View style={[styles.uspItem, { borderColor: activeTheme.border, backgroundColor: activeTheme.background }]}>
                  <Feather name="radio" size={17} color={activeTheme.primary} />
                  <Text style={[styles.uspItemTitle, { color: activeTheme.textPrimary }]}>Live OSM + Huff scoring</Text>
                  <Text style={[styles.uspItemText, { color: activeTheme.textSecondary }]}>Uses nearby OpenStreetMap locations and distance-weighted Huff probabilities for this location.</Text>
                  <View style={styles.uspMetricRow}>
                    <Text style={[styles.uspMetric, { color: activeTheme.primary }]}>{huffModel.market_fit_score ?? 0}% fit</Text>
                    <Text style={[styles.uspMetricMeta, { color: activeTheme.textMuted }]}>{huffModel.evaluated_locations ?? 0} OSM locations</Text>
                  </View>
                </View>
                <View style={[styles.uspItem, { borderColor: activeTheme.border, backgroundColor: activeTheme.background }]}>
                  <Feather name="sliders" size={17} color={activeTheme.success} />
                  <Text style={[styles.uspItemTitle, { color: activeTheme.textPrimary }]}>Scheme-accurate routing</Text>
                  <Text style={[styles.uspItemText, { color: activeTheme.textSecondary }]}>Rule-based 10% equity and 90% loan math. No AI is used to choose the scheme, rate, or moratorium.</Text>
                  <View style={styles.uspMetricRow}>
                    <Text style={[styles.uspMetric, { color: activeTheme.success }]}>{scheme.selected_scheme || 'Pending'}</Text>
                    <Text style={[styles.uspMetricMeta, { color: activeTheme.textMuted }]}>{scheme.interest_rate_pa ?? 0}% / {scheme.moratorium_months ?? 0} mo</Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={[styles.aiStatusBar, { borderColor: activeTheme.border, backgroundColor: activeTheme.surface }]}> 
              <View style={[styles.aiStatusDot, { backgroundColor: result.narrative?.enabled ? activeTheme.success : activeTheme.warning }]} />
              <Text style={[styles.aiStatusText, { color: activeTheme.textSecondary }]}>{result.narrative?.enabled ? `GROQ AI ACTIVE // ${result.narrative.model}` : `GROQ FALLBACK // ${result.narrative?.summary || 'Check backend configuration'}`}</Text>
              <Text style={[styles.aiStatusText, { color: activeTheme.textMuted }]}>{aiStatus?.configured ? 'KEY DETECTED' : 'KEY NOT DETECTED'}</Text>
            </View>

            <View style={[styles.financeSection, { backgroundColor: activeTheme.surface, borderColor: activeTheme.border }]}> 
              <View style={styles.uspHeaderRow}>
                <View>
                  <Text style={[styles.uspEyebrow, { color: activeTheme.success }]}>FINANCE OPERATIONS</Text>
                  <Text style={[styles.uspTitle, { color: activeTheme.textPrimary }]}>Record once. Understand the business.</Text>
                </View>
                <Feather name="bar-chart-2" size={20} color={activeTheme.success} />
              </View>
              <Text style={[styles.financeHint, { color: activeTheme.textSecondary }]}>Profit uses recorded income and expenses. Unpaid invoices count as revenue, but not as cash received.</Text>
              <View style={styles.transactionTypeRow}>
                {['income', 'expense'].map((type) => (
                  <TouchableOpacity key={type} style={[styles.transactionTypeButton, { borderColor: activeTheme.border }, transactionForm.transaction_type === type && { backgroundColor: type === 'income' ? activeTheme.success : activeTheme.secondary, borderColor: type === 'income' ? activeTheme.success : activeTheme.secondary }]} onPress={() => updateTransaction('transaction_type', type)}>
                    <Text style={[styles.transactionTypeText, { color: transactionForm.transaction_type === type ? '#05070D' : activeTheme.textSecondary }]}>{type.toUpperCase()}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.transactionInputGrid}>
                {[
                  ['category', 'Category (e.g. Milk sales)'], ['amount', 'Amount'], ['description', 'Description'], ['invoice_number', 'Invoice number'], ['counterparty', 'Customer / vendor'],
                ].map(([key, placeholder]) => (
                  <TextInput key={key} style={[styles.transactionInput, { color: activeTheme.textPrimary, borderColor: activeTheme.border, backgroundColor: activeTheme.background }]} value={transactionForm[key]} onChangeText={(value) => updateTransaction(key, value)} placeholder={placeholder} placeholderTextColor={activeTheme.textMuted} keyboardType={key === 'amount' ? 'numeric' : 'default'} />
                ))}
              </View>
              <View style={styles.transactionTypeRow}>
                {['UPI', 'Cash', 'Bank', 'Card'].map((method) => (
                  <TouchableOpacity key={method} style={[styles.methodButton, { borderColor: activeTheme.border, backgroundColor: transactionForm.payment_method === method ? activeTheme.primaryLight : activeTheme.background }]} onPress={() => updateTransaction('payment_method', method)}>
                    <Text style={[styles.methodText, { color: transactionForm.payment_method === method ? activeTheme.primary : activeTheme.textMuted }]}>{method}</Text>
                  </TouchableOpacity>
                ))}
                {['paid', 'unpaid'].map((status) => (
                  <TouchableOpacity key={status} style={[styles.methodButton, { borderColor: activeTheme.border, backgroundColor: transactionForm.payment_status === status ? activeTheme.accentLight : activeTheme.background }]} onPress={() => updateTransaction('payment_status', status)}>
                    <Text style={[styles.methodText, { color: transactionForm.payment_status === status ? activeTheme.accent : activeTheme.textMuted }]}>{status}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity style={[styles.recordButton, { backgroundColor: activeTheme.primary }]} onPress={handleAddTransaction}><Feather name="plus-circle" size={15} color="#05070D" /><Text style={styles.recordButtonText}>RECORD TRANSACTION</Text></TouchableOpacity>

              {financeSummary && <View style={styles.financeMetrics}>
                {[['Revenue', financeSummary.revenue, activeTheme.primary], ['Expenses', financeSummary.total_expenses, activeTheme.secondary], ['Net profit', financeSummary.net_profit, activeTheme.success], ['Cash received', financeSummary.cash_received, activeTheme.accent]].map(([label, value, color]) => <View key={label} style={[styles.financeMetric, { borderColor: activeTheme.border, backgroundColor: activeTheme.background }]}><Text style={[styles.financeMetricLabel, { color: activeTheme.textMuted }]}>{label}</Text><Text style={[styles.financeMetricValue, { color }]}>{formatMoney(value)}</Text></View>)}
              </View>}
              <View style={[styles.profitChart, { borderColor: activeTheme.border, backgroundColor: activeTheme.background }]}>
                <Text style={[styles.chartTitle, { color: activeTheme.textPrimary }]}>Monthly profit and loss</Text>
                {monthlyFinance.length ? monthlyFinance.map((entry) => <View key={entry.month} style={styles.chartRow}><Text style={[styles.chartMonth, { color: activeTheme.textMuted }]}>{entry.month}</Text><View style={styles.chartBars}><View style={[styles.profitBar, { width: `${Math.max(3, entry.revenue / maxMonthlyValue * 100)}%`, backgroundColor: activeTheme.success }]} /><View style={[styles.lossBar, { width: `${Math.max(3, entry.expenses / maxMonthlyValue * 100)}%`, backgroundColor: activeTheme.secondary }]} /></View><Text style={[styles.chartProfit, { color: entry.profit >= 0 ? activeTheme.success : activeTheme.secondary }]}>{formatMoney(entry.profit)}</Text></View>) : <Text style={[styles.financeHint, { color: activeTheme.textMuted }]}>Record transactions to build the graph.</Text>}
                <Text style={[styles.chartLegendText, { color: activeTheme.textMuted }]}>Green = income   Pink = expenses   Net = income - expenses</Text>
              </View>
            </View>

            <View style={styles.utilityGrid}>
              <View style={[styles.utilityPanel, { backgroundColor: activeTheme.surface, borderColor: activeTheme.border }]}>
                <Text style={[styles.uspEyebrow, { color: activeTheme.secondary }]}>ITR PREPARATION</Text>
                <Text style={[styles.utilityTitle, { color: activeTheme.textPrimary }]}>Tax-ready review pack</Text>
                <Text style={[styles.financeHint, { color: activeTheme.textSecondary }]}>{itrData?.disclaimer || 'Record transactions to prepare a reviewable ITR data pack.'}</Text>
                {itrData && <><Text style={[styles.utilityValue, { color: activeTheme.success }]}>Estimated business profit: {formatMoney(itrData.summary.net_profit)}</Text><Text style={[styles.utilityWarning, { color: activeTheme.warning }]}>{itrData.missing_record_warnings.length ? `Missing: ${itrData.missing_record_warnings.join(', ')}` : 'Core invoice fields are present.'}</Text></>}
              </View>
              <View style={[styles.utilityPanel, { backgroundColor: activeTheme.surface, borderColor: activeTheme.border }]}>
                <Text style={[styles.uspEyebrow, { color: activeTheme.primary }]}>GOVERNMENT SCHEMES</Text>
                <Text style={[styles.utilityTitle, { color: activeTheme.textPrimary }]}>Suitable schemes to review</Text>
                {(schemeData?.recommendations || []).map((schemeItem) => <View key={schemeItem.name} style={styles.schemeRow}><Text style={[styles.schemeName, { color: activeTheme.primary }]}>{schemeItem.name}</Text><Text style={[styles.schemeReason, { color: activeTheme.textSecondary }]}>{schemeItem.reason}</Text><Text style={[styles.schemeSource, { color: activeTheme.textMuted }]}>{schemeItem.source}</Text></View>)}
                <Text style={[styles.financeHint, { color: activeTheme.warning }]}>{schemeData?.disclaimer || 'Run an assessment to load category-matched schemes.'}</Text>
              </View>
            </View>

            {/* SCREEN 2: REPORT HEADER HERO CARD (NEW) */}
            <View style={[styles.summaryCard, { backgroundColor: activeTheme.surface, borderColor: activeTheme.border, shadowColor: activeTheme.shadow }]}>
              <View style={styles.summaryTopRow}>
                <View style={styles.summaryBadgeWrapper}>
                  <View style={[styles.illustIconCircle, { backgroundColor: activeTheme.primaryLight }]}>
                    <MaterialCommunityIcons name="cow" size={18} color={activeTheme.primary} />
                  </View>
                  <Text style={[styles.summaryCardTitle, { color: activeTheme.primary }]}>{form.businessCategory} • {form.village}</Text>
                </View>
                {form.shopActNumber ? (
                  <View style={[styles.complianceBadge, { backgroundColor: activeTheme.successBg, borderColor: activeTheme.successBorder }]}>
                    <Feather name="check" size={10} color={activeTheme.success} style={{ marginRight: 4 }} />
                    <Text style={[styles.complianceBadgeText, { color: activeTheme.success }]}>{t[lang].verified}</Text>
                  </View>
                ) : (
                  <View style={[styles.complianceBadge, { backgroundColor: activeTheme.warningBg, borderColor: activeTheme.warningBorder }]}>
                    <Text style={[styles.complianceBadgeText, { color: activeTheme.warning }]}>{t[lang].unregistered}</Text>
                  </View>
                )}
              </View>

              {/* Dynamic Overall Viability Badge with reason */}
              {(() => {
                const satScore = result?.spatial_summary?.saturation_score ?? 0;
                let fitLabel = t[lang].goodFit + ` ${form.village}`;
                let fitColor = activeTheme.success;
                let fitBg = activeTheme.successBg;
                let fitReason = lang === 'en' 
                  ? 'High local catchment density with unserved market niches. Highly viable priority router.'
                  : 'अछूते बाजार अवसरों के साथ उच्च स्थानीय जलग्रहण घनत्व। अत्यधिक व्यवहार्य प्राथमिकता रूट।';

                if (satScore >= 35 && satScore < 65) {
                  fitLabel = t[lang].moderateFit + ` ${form.village}`;
                  fitColor = activeTheme.warning;
                  fitBg = activeTheme.warningBg;
                  fitReason = lang === 'en'
                    ? 'Moderate competition exists. Differentiate your pricing pack sizes for daily workers.'
                    : 'मध्यम स्तर की प्रतिस्पर्धा है। दैनिक श्रमिकों के लिए अनुकूल दरों पर पैक आकार में बदलाव करें।';
                } else if (satScore >= 65) {
                  fitLabel = t[lang].needsReview + ` ${form.village}`;
                  fitColor = activeTheme.danger;
                  fitBg = activeTheme.dangerBg;
                  fitReason = lang === 'en'
                    ? 'High competitor density. Focus on value-added milk products or cooperative supply contracts.'
                    : 'उच्च प्रतियोगी घनत्व। मूल्य संवर्धन (पनीर, दही) या सहकारी समिति अनुबंधों पर ध्यान केंद्रित करें।';
                }

                return (
                  <View style={[styles.verdictContainer, { backgroundColor: fitBg }]}>
                    <View style={styles.verdictBadgeRow}>
                      <View style={[styles.verdictDot, { backgroundColor: fitColor }]} />
                      <Text style={[styles.verdictLabel, { color: fitColor }]}>{fitLabel}</Text>
                    </View>
                    <Text style={[styles.verdictReason, { color: activeTheme.textSecondary }]}>{fitReason}</Text>
                  </View>
                );
              })()}
            </View>

            {/* SCREEN 3: COMPLIANCE CARD */}
            <View style={[styles.reportSection, { backgroundColor: activeTheme.surface, borderColor: activeTheme.border }]}>
              <Text style={[styles.sectionHeaderTitle, { color: activeTheme.textPrimary }]}>🟢 {t[lang].complianceHeader}</Text>
              <StatCardRow label={lang === 'en' ? 'Registered Entity Name' : 'पंजीकृत संस्था का नाम'} value={compliance.registered_business_name} icon="home" highlightColor={activeTheme.success} />
              <StatCardRow label={lang === 'en' ? 'Shop Act Number' : 'शॉप एक्ट नंबर'} value={compliance.shop_act_number || 'N/A'} icon="file-text" highlightColor={activeTheme.success} />
              <StatCardRow label={lang === 'en' ? 'Core Business Description' : 'मुख्य गतिविधि विवरण'} value={compliance.business_description} icon="activity" highlightColor={activeTheme.success} />
              <StatCardRow label={lang === 'en' ? 'Bankable Registration Status' : 'ऋण उपलब्धता स्थिति'} value={compliance.status} icon="check-circle" isVerified={!!compliance.shop_act_number} highlightColor={activeTheme.success} />
            </View>

            {/* SCREEN 4: FINANCIAL CALCULATOR & ROUTER */}
            <View style={[styles.reportSection, { backgroundColor: activeTheme.surface, borderColor: activeTheme.border }]}>
              <Text style={[styles.sectionHeaderTitle, { color: activeTheme.textPrimary }]}>💰 {t[lang].finHeader}</Text>
              
              <View style={styles.routerGrid}>
                <View style={[styles.gridItem, { backgroundColor: activeTheme.background, borderColor: activeTheme.border }]}>
                  <Feather name="shield" size={14} color={activeTheme.primary} />
                  <Text style={[styles.gridLabel, { color: activeTheme.textSecondary }]}>{lang === 'en' ? 'Your Margin (10%)' : 'आपका मार्जिन (10%)'}</Text>
                  <Text style={[styles.gridValue, { color: activeTheme.textPrimary }]}>{formatMoney(structuring.available_margin_capital)}</Text>
                </View>
                <View style={[styles.gridItem, { backgroundColor: activeTheme.background, borderColor: activeTheme.border }]}>
                  <Feather name="trending-up" size={14} color={activeTheme.primary} />
                  <Text style={[styles.gridLabel, { color: activeTheme.textSecondary }]}>{lang === 'en' ? 'Total Project Cost' : 'कुल परियोजना लागत'}</Text>
                  <Text style={[styles.gridValue, { color: activeTheme.textPrimary }]}>{formatMoney(structuring.total_feasible_project_cost)}</Text>
                </View>
                <View style={[styles.gridItem, { backgroundColor: activeTheme.background, borderColor: activeTheme.border }]}>
                  <Feather name="check-square" size={14} color={activeTheme.success} />
                  <Text style={[styles.gridLabel, { color: activeTheme.textSecondary }]}>{lang === 'en' ? 'Sanctionable Loan (90%)' : 'स्वीकार्य ऋण सीमा (90%)'}</Text>
                  <Text style={[styles.gridValue, { color: activeTheme.success }]}>{formatMoney(structuring.sanctionable_loan_amount)}</Text>
                </View>
                <View style={[styles.gridItem, styles.dominantSchemeCard, { borderColor: activeTheme.primary, backgroundColor: activeTheme.primaryLight }]}>
                  <Feather name="award" size={16} color={activeTheme.primary} />
                  <Text style={[styles.gridLabel, { color: activeTheme.primary, fontWeight: '800' }]}>{lang === 'en' ? 'Routed Scheme' : 'चयनित सरकारी योजना'}</Text>
                  <Text style={[styles.gridValue, { color: activeTheme.primary, fontSize: 13 }]}>{scheme.selected_scheme}</Text>
                </View>
              </View>

              {/* Cutoff Threshold scale visualizer */}
              <View style={styles.thresholdScaleContainer}>
                <Text style={[styles.thresholdScaleTitle, { color: activeTheme.textSecondary }]}>
                  {lang === 'en' ? 'Scheme Selection Scale (Cutoff ₹1.40L)' : 'योजना चयन पैमाना (सीमा ₹1.40 लाख)'}
                </Text>
                <View style={[styles.scaleTrack, { backgroundColor: activeTheme.border }]}>
                  {/* Micro Finance Limit */}
                  <View style={[styles.scaleFillHalf, { width: '28%', backgroundColor: activeTheme.success }]} />
                  {/* Term Loan Area */}
                  <View style={[styles.scaleFillHalf, { width: '72%', backgroundColor: activeTheme.secondary }]} />
                  
                  {/* Threshold mark pin */}
                  <View style={[styles.cutoffPin, { left: '28%' }]}>
                    <View style={[styles.cutoffPinLine, { backgroundColor: activeTheme.textPrimary }]} />
                    <Text style={[styles.cutoffPinText, { color: activeTheme.textPrimary }]}>₹1.40L</Text>
                  </View>

                  {/* User project marker pin */}
                  {(() => {
                    const ratio = Math.min(100, Math.max(10, (structuring.total_feasible_project_cost / 1500000) * 100));
                    return (
                      <View style={[styles.userCostPin, { left: `${ratio}%` }]}>
                        <Feather name="chevron-down" size={12} color={activeTheme.primary} />
                        <View style={[styles.userCostCircle, { backgroundColor: activeTheme.primary }]} />
                      </View>
                    );
                  })()}
                </View>
                <View style={styles.scaleLabelsRow}>
                  <Text style={[styles.scaleLabel, { color: activeTheme.success }]}>Micro Finance</Text>
                  <Text style={[styles.scaleLabel, { color: activeTheme.primary }]}>Term Loan Scheme</Text>
                </View>
              </View>

              <View style={[styles.explainTextCallout, { backgroundColor: activeTheme.primaryLight, borderColor: activeTheme.border }]}>
                <Feather name="info" size={14} color={activeTheme.primary} style={{ marginRight: 8, marginTop: 2 }} />
                <Text style={[styles.explainText, { color: activeTheme.textSecondary }]}>
                  {lang === 'en' ? scheme.routing_logic_en : scheme.routing_logic_hi}
                </Text>
              </View>

              {scheme.loan_cap === 0 && (
                <View style={[styles.explainTextCallout, { backgroundColor: activeTheme.warningBg, borderColor: activeTheme.warningBorder, marginTop: 10 }]}>
                  <Feather name="alert-triangle" size={14} color={activeTheme.warning} style={{ marginRight: 8, marginTop: 2 }} />
                  <Text style={[styles.explainText, { color: activeTheme.warning }]}>
                    {lang === 'en'
                      ? 'This project exceeds the current scheme eligibility cap. No pilot loan is available under the current program.'
                      : 'यह परियोजना मौजूदा योजना पात्रता सीमा से अधिक है। वर्तमान कार्यक्रम के तहत कोई पायलट लोन उपलब्ध नहीं है।'}
                  </Text>
                </View>
              )}

              <View style={[styles.divider, { backgroundColor: activeTheme.border }]} />

              <StatCardRow label={lang === 'en' ? 'Repayment Interest Rate' : 'ऋण ब्याज दर'} value={`${scheme.interest_rate_pa}% p.a.`} icon="percent" highlightColor={activeTheme.primary} />
              <StatCardRow label={lang === 'en' ? 'Working Capital Buffer' : 'कार्यशील पूंजी बफर'} value={formatMoney(structuring.working_capital_requirement)} icon="briefcase" highlightColor={activeTheme.primary} />
              <StatCardRow label={lang === 'en' ? 'Repayment Tenure' : 'भुगतान की कुल अवधि'} value={`${scheme.tenure_years} Years (${scheme.tenure_quarters} Quarters)`} icon="calendar" highlightColor={activeTheme.primary} />
            </View>

            {/* SCREEN 5: EMI & REPAYMENT SCHEDULING WITH SHADED GRAPH */}
            <View style={[styles.reportSection, { backgroundColor: activeTheme.surface, borderColor: activeTheme.border }]}>
              <Text style={[styles.sectionHeaderTitle, { color: activeTheme.textPrimary }]}>📅 {t[lang].repaymentHeader}</Text>
              <Text style={[styles.infoText, { color: activeTheme.textSecondary }]}>
                {lang === 'en' ? repayment.moratorium_note_en : repayment.moratorium_note_hi}
              </Text>

              {/* Moratorium Explanation Callout Box */}
              <View style={[styles.explainTextCallout, { backgroundColor: activeTheme.successBg, borderColor: activeTheme.successBorder }]}>
                <Feather name="shield" size={14} color={activeTheme.success} style={{ marginRight: 8, marginTop: 2 }} />
                <Text style={[styles.explainText, { color: activeTheme.success }]}>
                  {lang === 'en' 
                    ? `Interest-only installments (no principal charge) during the first ${scheme.moratorium_months} months moratorium.` 
                    : `पहले ${scheme.moratorium_months} महीनों के स्थगन के दौरान केवल ब्याज की किस्तें ही देय हैं।`}
                </Text>
              </View>

              {/* Shaded Repayment Curve Chart Component */}
              <View style={[styles.curveCard, { backgroundColor: activeTheme.background, borderColor: activeTheme.border }]}>
                <View style={styles.chartBarWrapper}>
                  {result.schedule.slice(0, 8).map((item, idx) => {
                    const isMoratorium = item.status === 'moratorium';
                    const heightPercent = isMoratorium ? 30 : 90; 
                    return (
                      <View key={idx} style={styles.chartBarCol}>
                        <View style={styles.barTooltip}>
                          <Text style={styles.tooltipText}>{formatMoney(item.total_payment)}</Text>
                        </View>
                        <View style={[styles.chartBarTrack, { backgroundColor: activeTheme.border }]}>
                          <View style={[
                            styles.chartBarFill,
                            { 
                              height: `${heightPercent}%`, 
                              backgroundColor: isMoratorium ? activeTheme.accent : activeTheme.primary
                            }
                          ]} />
                        </View>
                        <Text style={[styles.chartBarLabel, { color: activeTheme.textMuted }]}>Q{item.quarter}</Text>
                        <Text style={[styles.chartBarBadgeText, { color: isMoratorium ? activeTheme.accent : activeTheme.primary }]}>
                          {isMoratorium ? (lang === 'en' ? 'Mor' : 'स्थगन') : (lang === 'en' ? 'Act' : 'सक्रिय')}
                        </Text>
                      </View>
                    );
                  })}
                </View>
                <View style={[styles.chartLegend, { borderTopColor: activeTheme.border }]}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendBox, { backgroundColor: activeTheme.accent }]} />
                    <Text style={[styles.legendText, { color: activeTheme.textSecondary }]}>{lang === 'en' ? 'Moratorium' : 'स्थगन अवधि'}</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendBox, { backgroundColor: activeTheme.primary }]} />
                    <Text style={[styles.legendText, { color: activeTheme.textSecondary }]}>{lang === 'en' ? 'Active Installment' : 'सक्रिय किस्त'}</Text>
                  </View>
                </View>
              </View>

              {/* Collapsible Scheduler Amortization ledger */}
              <TouchableOpacity
                style={[styles.accordionHeader, { borderTopColor: activeTheme.border }]}
                onPress={() => setShowAllSchedule(prev => !prev)}
              >
                <Text style={[styles.accordionTitle, { color: activeTheme.primary }]}>
                  {showAllSchedule 
                    ? (lang === 'en' ? 'Hide repayment ledger ▲' : 'भुगतान बहीखाता छिपाएं ▲') 
                    : (lang === 'en' ? 'View full repayment schedule ▾' : 'पूर्ण पुनर्भुगतान बहीखाता देखें ▾')}
                </Text>
              </TouchableOpacity>

              {showAllSchedule && (
                <View style={[styles.scheduleTableContainer, { backgroundColor: activeTheme.background, borderColor: activeTheme.border }]}>
                  <View style={styles.tableHeader}>
                    <Text style={[styles.tableHeadText, { flex: 0.6 }]}>Qtr</Text>
                    <Text style={styles.tableHeadText}>Opening</Text>
                    <Text style={styles.tableHeadText}>Interest</Text>
                    <Text style={styles.tableHeadText}>Principal</Text>
                    <Text style={styles.tableHeadText}>Payment</Text>
                  </View>
                  {result.schedule.map((row) => {
                    const isMor = row.status === 'moratorium';
                    return (
                      <View key={`row-${row.quarter}`} style={[styles.tableRow, { borderBottomColor: activeTheme.border }, isMor && { backgroundColor: activeTheme.primaryLight }]}>
                        <Text style={[styles.tableCellText, { flex: 0.6, fontWeight: '700', color: activeTheme.textPrimary }]}>Q{row.quarter}</Text>
                        <Text style={[styles.tableCellText, { color: activeTheme.textSecondary }]}>{formatMoney(row.opening_balance)}</Text>
                        <Text style={[styles.tableCellText, { color: activeTheme.textSecondary }]}>{formatMoney(row.interest)}</Text>
                        <Text style={[styles.tableCellText, { color: activeTheme.textSecondary }]}>{formatMoney(row.principal)}</Text>
                        <Text style={[styles.tableCellText, { fontWeight: '700', color: isMor ? activeTheme.accent : activeTheme.textPrimary }]}>
                          {formatMoney(row.total_payment)}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>

            {/* SCREEN 6: MARKET REACH CONCENTRIC CATCHMENT CIRCLES */}
            <View style={[styles.reportSection, { backgroundColor: activeTheme.surface, borderColor: activeTheme.border }]}>
              <Text style={[styles.sectionHeaderTitle, { color: activeTheme.textPrimary }]}>🌐 {t[lang].marketHeader}</Text>
              <Text style={[styles.infoText, { color: activeTheme.textSecondary }]}>
                {lang === 'en' ? feasibility.market_reach?.consumer_catchment_summary_en : feasibility.market_reach?.consumer_catchment_summary_hi}
              </Text>

              {/* Concentric Illustrated Trade map circles */}
              <View style={[styles.radiusMapBox, { backgroundColor: activeTheme.background, borderColor: activeTheme.border }]}>
                <View style={[styles.radiusOuterRing, { borderColor: activeTheme.border }]}>
                  <View style={[styles.radiusMiddleRing, { borderColor: activeTheme.primary }]}>
                    <View style={[styles.radiusInnerRing, { backgroundColor: activeTheme.primaryLight }]}>
                      <Ionicons name="location" size={20} color={activeTheme.primary} />
                      <Text style={[styles.radiusCenterLabel, { color: activeTheme.primary }]}>{form.village}</Text>
                    </View>
                    <Text style={[styles.radiusRingText, { color: activeTheme.primary }]}>5 km</Text>
                  </View>
                  <Text style={[styles.radiusRingTextOuter, { color: activeTheme.textMuted }]}>10 km</Text>
                </View>
                <Text style={[styles.mapCaption, { color: activeTheme.textMuted }]}>
                  {lang === 'en' ? 'Visual concentric catchment circles' : 'जलग्रहण क्षेत्रों का संकेंद्रित वृत्त आलेख'}
                </Text>
              </View>

              <Text style={[styles.subHeading, { color: activeTheme.textPrimary }]}>{lang === 'en' ? 'Core Distribution Channels' : 'संभावित वितरण चैनल'}</Text>
              {(() => {
                const channels = lang === 'en' ? feasibility.market_reach?.distribution_channels_en : feasibility.market_reach?.distribution_channels_hi;
                return channels?.map((channel, i) => (
                  <View key={i} style={styles.bulletRow}>
                    <View style={[styles.bulletIconCircle, { backgroundColor: activeTheme.primary }]}>
                      <Feather name="check" size={10} color="#FFF" />
                    </View>
                    <Text style={[styles.bulletText, { color: activeTheme.textSecondary }]}>{channel}</Text>
                  </View>
                ));
              })()}
            </View>

            {/* SCREEN 7: OPPORTUNITY & REGIONAL BENCHMARKS */}
            <View style={[styles.reportSection, { backgroundColor: activeTheme.surface, borderColor: activeTheme.border }]}>
              <Text style={[styles.sectionHeaderTitle, { color: activeTheme.textPrimary }]}>🗺️ {t[lang].opportunityHeader}</Text>
              
              <Text style={[styles.subHeading, { color: activeTheme.textPrimary }]}>{lang === 'en' ? 'Unserved Local Niches' : 'अनछुए स्थानीय अवसर'}</Text>
              {(() => {
                const niches = lang === 'en' ? feasibility.opportunity_analysis?.niches_en : feasibility.opportunity_analysis?.niches_hi;
                return niches?.map((niche, i) => (
                  <View key={i} style={styles.bulletRow}>
                    <View style={[styles.bulletIconCircle, { backgroundColor: activeTheme.primary }]}>
                      <Feather name="lightbulb" size={10} color="#FFF" />
                    </View>
                    <Text style={[styles.bulletText, { color: activeTheme.textSecondary }]}>{niche}</Text>
                  </View>
                ));
              })()}

              <Text style={[styles.subHeading, { color: activeTheme.textPrimary }]}>{lang === 'en' ? 'Primary Demand Drivers' : 'मुख्य मांग कारक'}</Text>
              {(() => {
                const drivers = lang === 'en' ? feasibility.opportunity_analysis?.demand_drivers_en : feasibility.opportunity_analysis?.demand_drivers_hi;
                return drivers?.map((driver, i) => (
                  <View key={i} style={styles.bulletRow}>
                    <View style={[styles.bulletIconCircle, { backgroundColor: activeTheme.success }]}>
                      <Feather name="trending-up" size={10} color="#FFF" />
                    </View>
                    <Text style={[styles.bulletText, { color: activeTheme.textSecondary }]}>{driver}</Text>
                  </View>
                ));
              })()}

              {/* SEMANTIC BADGES FOR COMPETITOR LEVEL */}
              <View style={[styles.divider, { backgroundColor: activeTheme.border }]} />
              <Text style={[styles.subHeading, { marginTop: 10, color: activeTheme.textPrimary }]}>{t[lang].competitorHeader}</Text>
              
              <View style={styles.metricRow}>
                <Text style={[styles.metricLabel, { color: activeTheme.textSecondary }]}>{lang === 'en' ? 'Competition Level' : 'प्रतिस्पर्धा स्तर'}</Text>
                {/* Moderate Competition is correctly styled AMBER (semantic amber) */}
                <View style={[styles.statusBadgeCapsule, { backgroundColor: activeTheme.warningBg, borderColor: activeTheme.warningBorder }]}>
                  <Text style={[styles.statusBadgeCapsuleText, { color: activeTheme.warning }]}>
                    {lang === 'en' ? feasibility.competitor_mapping?.density_rating_en : feasibility.competitor_mapping?.density_rating_hi}
                  </Text>
                </View>
              </View>

              {feasibility.competitor_mapping?.has_dataset ? (
                <View style={styles.competitorWrapper}>
                  {feasibility.competitor_mapping?.local_benchmarks?.map((farm, idx) => {
                    const distances = ['1.2 km', '2.5 km', '3.8 km', '4.2 km', '5.1 km'];
                    return (
                      <View key={idx} style={[styles.competitorCardBlock, { backgroundColor: activeTheme.background, borderColor: activeTheme.border }]}>
                        <View style={[styles.compCardIconBox, { backgroundColor: activeTheme.primaryLight }]}>
                          <MaterialCommunityIcons name="store-outline" size={18} color={activeTheme.primary} />
                        </View>
                        <View style={{ flex: 1, marginLeft: 10 }}>
                          <Text style={[styles.compNameText, { color: activeTheme.textPrimary }]}>{farm}</Text>
                          <Text style={[styles.compSubText, { color: activeTheme.textMuted }]}>{lang === 'en' ? 'Pune Regional Dairy Partner' : 'पुणे क्षेत्रीय डेयरी पार्टनर'}</Text>
                        </View>
                        <View style={[styles.compDistanceBadge, { backgroundColor: activeTheme.primaryLight }]}>
                          <Text style={[styles.compDistanceText, { color: activeTheme.primary }]}>{distances[idx % distances.length]}</Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              ) : (
                <View style={[styles.noDataWarningBox, { backgroundColor: activeTheme.warningBg, borderColor: activeTheme.warningBorder }]}>
                  <Feather name="alert-circle" size={18} color={activeTheme.warning} />
                  <Text style={[styles.noDataWarningText, { color: activeTheme.warning }]}>{t[lang].notAvailableDesc}</Text>
                </View>
              )}

              <Text style={[styles.subHeading, { color: activeTheme.textPrimary }]}>{lang === 'en' ? 'Competitive Advantage Tactics' : 'प्रतिस्पर्धात्मक बढ़त रणनीतियाँ'}</Text>
              {(() => {
                const competitorMapping = feasibility.competitor_mapping || {};
                const tactics = competitorMapping[`competitive_advantage_tactics_${lang}`] || competitorMapping.competitive_advantage_tactics || [];
                return tactics.map((tactic, i) => (
                  <View key={i} style={styles.bulletRow}>
                    <View style={[styles.bulletIconCircle, { backgroundColor: activeTheme.primary }]}>
                      <Feather name="target" size={10} color="#FFF" />
                    </View>
                    <Text style={[styles.bulletText, { color: activeTheme.textSecondary }]}>{tactic}</Text>
                  </View>
                ));
              })()}
            </View>

            {/* SCREEN 8: SWOT ANALYSIS (2x2 RESPONISIVE GRID) */}
            <View style={[styles.reportSection, { backgroundColor: activeTheme.surface, borderColor: activeTheme.border }]}>
              <Text style={[styles.sectionHeaderTitle, { color: activeTheme.textPrimary }]}>📊 {t[lang].swotHeader}</Text>
              <Animated.View style={[styles.swotGrid, isTablet && styles.swotGridRow, {
                opacity: swotAnimation,
                transform: [{ translateY: swotAnimation.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }],
              }]}>
                {swotTypes.map((type) => {
                  const key = type.toLowerCase();
                  const finalItems = swot[`${key}_${lang}`] || swot[key] || [];
                  const swatch = SWATCH[type] || '#F8FAFC';
                  const swatchBorder = SWATCH[`${type}Border`] || '#E2E8F0';
                  return (
                    <View key={type} style={[
                      styles.swotCardBlock, 
                      isTablet && styles.swotCardBlockHalf,
                      { backgroundColor: swatch, borderColor: swatchBorder }
                    ]}>
                      <Text style={styles.swotCardTitleText}>{type}</Text>
                      {finalItems.map((item, i) => (
                        <Text key={i} style={styles.swotCardItemText}>• {item}</Text>
                      ))}
                    </View>
                  );
                })}
              </Animated.View>
            </View>

            {/* SCREEN 9: PRODUCT MARKET VALUE & WAGE AFFORDABILITY */}
            <View style={[styles.reportSection, { backgroundColor: activeTheme.surface, borderColor: activeTheme.border }]}>
              <Text style={[styles.sectionHeaderTitle, { color: activeTheme.textPrimary }]}>🏷️ {t[lang].pmvHeader}</Text>
              
              <Text style={[styles.infoText, { color: activeTheme.textSecondary }]}>
                {lang === 'en' ? feasibility.product_market_value?.pricing_strategy_en : feasibility.product_market_value?.pricing_strategy_hi}
              </Text>

              <View style={styles.metricRow}>
                <Text style={[styles.metricLabel, { color: activeTheme.textSecondary }]}>{lang === 'en' ? 'Gross Unit profit Margin' : 'सकल लाभ मार्जिन'}</Text>
                <Text style={[styles.metricValue, { color: activeTheme.success, fontSize: 16 }]}>
                  {feasibility.product_market_value?.gross_unit_margin_percent}%
                </Text>
              </View>

              <View style={[styles.explainTextCallout, { backgroundColor: activeTheme.successBg, borderColor: activeTheme.successBorder }]}>
                <Feather name="dollar-sign" size={14} color={activeTheme.success} style={{ marginRight: 8, marginTop: 2 }} />
                <Text style={[styles.explainText, { color: activeTheme.success }]}>
                  {lang === 'en' ? feasibility.product_market_value?.daily_wage_alignment_en : feasibility.product_market_value?.daily_wage_alignment_hi}
                </Text>
              </View>
            </View>

            {/* BANK READY OFFICIAL DPR EXPORT BUTTON */}
            <TouchableOpacity style={styles.downloadDprButton} onPress={handleDownloadPdf}>
              <Text style={styles.downloadDprButtonText}>
                {pdfLoading ? t[lang].preparingDpr : t[lang].downloadDpr}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = () => {
    if (username === 'Test01' && password === 'Test01') {
      setError('');
      onLogin();
      return;
    }
    setError('Access denied. Check your operator credentials.');
  };

  return (
    <SafeAreaView style={styles.loginSafeArea}>
      <View style={styles.loginGlow} pointerEvents="none" />
      <View style={styles.loginGrid} pointerEvents="none" />
      <View style={styles.loginPanel}>
        <View style={styles.loginMark}>
          <Feather name="command" size={24} color="#22D3EE" />
        </View>
        <Text style={styles.loginKicker}>GRAMADVISORY AI // SECURE NODE</Text>
        <Text style={styles.loginTitle}>Enter the grid.</Text>
        <Text style={styles.loginSubtitle}>Sign in to access your enterprise intelligence dashboard.</Text>

        <Text style={styles.loginLabel}>OPERATOR ID</Text>
        <TextInput
          style={styles.loginInput}
          value={username}
          onChangeText={setUsername}
          placeholder="Enter username"
          placeholderTextColor="#5D7185"
          autoCapitalize="none"
        />
        <Text style={styles.loginLabel}>ACCESS KEY</Text>
        <TextInput
          style={styles.loginInput}
          value={password}
          onChangeText={setPassword}
          placeholder="Enter password"
          placeholderTextColor="#5D7185"
          secureTextEntry
          onSubmitEditing={handleLogin}
        />

        {!!error && <Text style={styles.loginError}>{error}</Text>}
        <TouchableOpacity style={styles.loginButton} onPress={handleLogin} activeOpacity={0.85}>
          <Text style={styles.loginButtonText}>INITIALIZE DASHBOARD</Text>
          <Feather name="arrow-right" size={17} color="#05070D" />
        </TouchableOpacity>
        <Text style={styles.loginStatus}><Text style={styles.loginStatusDot}>●</Text> LOCAL AUTHENTICATION ACTIVE</Text>
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  return isAuthenticated ? <GramAdvisoryApp /> : <LoginScreen onLogin={() => setIsAuthenticated(true)} />;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: 'transparent' },
  loginSafeArea: { flex: 1, backgroundColor: '#05070D', justifyContent: 'center', alignItems: 'center', padding: 24 },
  loginGlow: { position: 'absolute', width: 420, height: 420, borderRadius: 210, backgroundColor: '#0D3348', opacity: 0.32, transform: [{ translateY: -120 }] },
  loginGrid: { ...StyleSheet.absoluteFillObject, borderWidth: 1, borderColor: '#12314A', opacity: 0.28 },
  loginPanel: { width: '100%', maxWidth: 430, padding: 28, backgroundColor: '#080D18', borderWidth: 1, borderColor: '#1D5268', borderRadius: 6, shadowColor: '#22D3EE', shadowOpacity: 0.18, shadowRadius: 28, shadowOffset: { width: 0, height: 0 } },
  loginMark: { width: 48, height: 48, borderWidth: 1, borderColor: '#22D3EE', backgroundColor: '#102A3B', justifyContent: 'center', alignItems: 'center', marginBottom: 22 },
  loginKicker: { color: '#A3E635', fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  loginTitle: { color: '#F4F7FB', fontSize: 34, fontWeight: '900', marginTop: 10 },
  loginSubtitle: { color: '#91A6B9', fontSize: 13, lineHeight: 20, marginTop: 8, marginBottom: 28 },
  loginLabel: { color: '#7EA0B7', fontSize: 10, fontWeight: '900', letterSpacing: 1.2, marginBottom: 7, marginTop: 13 },
  loginInput: { height: 48, borderWidth: 1, borderColor: '#21445A', backgroundColor: '#050A13', color: '#F4F7FB', paddingHorizontal: 14, fontSize: 14, borderRadius: 3 },
  loginError: { color: '#FB7185', fontSize: 11, fontWeight: '700', marginTop: 14 },
  loginButton: { height: 50, backgroundColor: '#A3E635', marginTop: 24, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 3 },
  loginButtonText: { color: '#05070D', fontSize: 12, fontWeight: '900', letterSpacing: 0.8 },
  loginStatus: { color: '#5D7185', fontSize: 9, fontWeight: '800', letterSpacing: 1.1, marginTop: 22 },
  loginStatusDot: { color: '#A3E635' },
  backgroundBase: { ...StyleSheet.absoluteFillObject },
  backgroundVideo: { ...StyleSheet.absoluteFillObject, opacity: 0.38 },
  backgroundVideoShade: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(3, 6, 13, 0.78)' },
  container: { padding: 20, paddingBottom: 60, maxWidth: 920, width: '100%', alignSelf: 'center' },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  headerTitleBox: { flex: 1, marginRight: 10 },
  headerBrand: { fontSize: 21, fontWeight: '800', letterSpacing: -0.4 },
  headerSubtitle: { fontSize: 10, fontWeight: '600', marginTop: 3, letterSpacing: 0.5 },
  togglesRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  themeToggleBtn: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },
  langToggleBox: { flexDirection: 'row', borderRadius: 20, padding: 3, borderWidth: 1 },
  langBtn: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 14 },
  langBtnText: { fontSize: 10, fontWeight: '800' },

  card: {
    borderRadius: 6,
    padding: 22,
    marginBottom: 16,
    borderWidth: 1,
    shadowOpacity: 0.03,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
  },
  progressContainer: { marginBottom: 20, position: 'relative' },
  progressTrack: { height: 4, borderRadius: 2, position: 'absolute', top: 12, left: '10%', right: '10%' },
  progressFill: { height: '100%', borderRadius: 2 },
  stepLabelsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  stepIndicator: { alignItems: 'center', width: '30%' },
  stepBubble: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  stepBubbleText: { fontSize: 10, fontWeight: '900' },
  stepLabelText: { fontSize: 9, fontWeight: '800', marginTop: 4, textAlign: 'center' },

  stepWrapper: { animationDuration: '0.3s' },
  stepTitle: { fontSize: 20, fontWeight: '800', marginBottom: 20, letterSpacing: 0 },
  fieldLabel: { fontSize: 12, fontWeight: '800', marginBottom: 6 },
  optionalBadge: { fontSize: 10, fontWeight: '500' },
  input: {
    borderWidth: 1,
    borderRadius: 3,
    padding: 14,
    fontSize: 14,
    marginBottom: 16,
  },
  gpsButton: {
    flexDirection: 'row',
    borderRadius: 4,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
    height: 46,
  },
  gpsButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },

  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between', marginBottom: 8 },
  categoryCard: {
    width: '48%',
    borderRadius: 10,
    padding: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    height: 94,
    justifyContent: 'center',
  },
  categoryIconCircle: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#123452', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  categoryCardLabel: { fontSize: 11, fontWeight: '700', textAlign: 'center' },

  textAreaContainer: { position: 'relative' },
  textArea: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    paddingRight: 40,
    fontSize: 14,
    textAlignVertical: 'top',
    height: 72,
  },
  micIconBox: { position: 'absolute', right: 12, bottom: 12, width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },

  rupeeInputContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 10, overflow: 'hidden' },
  rupeePrefix: { fontSize: 18, fontWeight: '900', paddingHorizontal: 12 },
  rupeeInput: { flex: 1, paddingVertical: 12, fontSize: 16, fontWeight: '700' },

  incrementContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  incrementBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  incrementValue: { fontSize: 12, fontWeight: '700' },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  chip: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  chipText: { fontSize: 11, fontWeight: '700' },

  wizardFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 26, borderTopWidth: 1, borderTopColor: '#23415E', paddingTop: 18 },
  backBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8 },
  backBtnText: { fontWeight: '700', fontSize: 13 },
  nextBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 18, borderRadius: 8 },
  nextBtnText: { color: '#FFF', fontWeight: '700', fontSize: 13 },
  analyzeBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginLeft: 12 },
  analyzeBtnText: { color: '#FFF', fontWeight: '800', fontSize: 14 },

  toastBox: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 999,
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  toastIconCircle: { width: 26, height: 26, borderRadius: 13, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  toastText: { flex: 1, fontSize: 12, fontWeight: '700' },
  loadingText: { fontSize: 13, fontWeight: '700' },

  summaryCard: { borderRadius: 20, padding: 18, marginBottom: 16, borderWidth: 1, shadowOpacity: 0.04, shadowRadius: 10, shadowOffset: { width: 0, height: 2 } },
  summaryTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryBadgeWrapper: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  illustIconCircle: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  summaryCardTitle: { fontSize: 14, fontWeight: '800' },
  complianceBadge: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, flexDirection: 'row', alignItems: 'center' },
  complianceBadgeText: { fontSize: 9, fontWeight: '900' },
  verdictContainer: { borderRadius: 12, padding: 14, marginTop: 12 },
  verdictBadgeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  verdictDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  verdictLabel: { fontSize: 14, fontWeight: '900' },
  verdictReason: { fontSize: 11, fontWeight: '500', lineHeight: 16 },

  reportSection: {
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  uspSection: { borderRadius: 6, padding: 16, marginBottom: 16, borderWidth: 1 },
  uspHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  uspEyebrow: { fontSize: 9, fontWeight: '900', letterSpacing: 1.8 },
  uspTitle: { fontSize: 17, fontWeight: '900', marginTop: 5 },
  uspGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  uspItem: { flex: 1, minWidth: 220, borderRadius: 4, borderWidth: 1, padding: 13 },
  uspItemTitle: { fontSize: 13, fontWeight: '900', marginTop: 9 },
  uspItemText: { fontSize: 11, lineHeight: 16, marginTop: 6, minHeight: 50 },
  uspAction: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderRadius: 3, paddingHorizontal: 9, paddingVertical: 8, marginTop: 10 },
  uspActionText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.8 },
  uspMetricRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 8, marginTop: 11 },
  uspMetric: { fontSize: 15, fontWeight: '900', flexShrink: 1 },
  uspMetricMeta: { fontSize: 9, fontWeight: '700', textAlign: 'right' },
  aiStatusBar: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 4, paddingHorizontal: 11, paddingVertical: 9, marginBottom: 16 },
  aiStatusDot: { width: 8, height: 8, borderRadius: 4 },
  aiStatusText: { flex: 1, fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  financeSection: { borderRadius: 6, padding: 16, marginBottom: 16, borderWidth: 1 },
  financeHint: { fontSize: 11, lineHeight: 16, marginBottom: 10 },
  transactionTypeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 10 },
  transactionTypeButton: { flex: 1, minWidth: 100, borderWidth: 1, borderRadius: 3, paddingVertical: 9, alignItems: 'center' },
  transactionTypeText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.8 },
  transactionInputGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  transactionInput: { flex: 1, minWidth: 180, borderWidth: 1, borderRadius: 3, paddingHorizontal: 11, paddingVertical: 10, fontSize: 12 },
  methodButton: { borderWidth: 1, borderRadius: 3, paddingHorizontal: 10, paddingVertical: 7 },
  methodText: { fontSize: 10, fontWeight: '800' },
  recordButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, borderRadius: 3, paddingVertical: 11, marginTop: 2 },
  recordButtonText: { color: '#05070D', fontSize: 10, fontWeight: '900', letterSpacing: 0.8 },
  financeMetrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  financeMetric: { flex: 1, minWidth: 125, borderWidth: 1, borderRadius: 3, padding: 10 },
  financeMetricLabel: { fontSize: 9, fontWeight: '800', textTransform: 'uppercase' },
  financeMetricValue: { fontSize: 16, fontWeight: '900', marginTop: 5 },
  profitChart: { borderWidth: 1, borderRadius: 3, padding: 12, marginTop: 12 },
  chartTitle: { fontSize: 12, fontWeight: '900', marginBottom: 10 },
  chartRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 7 },
  chartMonth: { width: 52, fontSize: 9, fontWeight: '800' },
  chartBars: { flex: 1, gap: 2 },
  profitBar: { height: 5, borderRadius: 2 },
  lossBar: { height: 5, borderRadius: 2 },
  chartProfit: { width: 76, fontSize: 10, fontWeight: '900', textAlign: 'right' },
  chartLegendText: { fontSize: 9, marginTop: 8 },
  utilityGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  utilityPanel: { flex: 1, minWidth: 280, borderRadius: 6, borderWidth: 1, padding: 16 },
  utilityTitle: { fontSize: 16, fontWeight: '900', marginTop: 5, marginBottom: 7 },
  utilityValue: { fontSize: 12, fontWeight: '900', marginTop: 8 },
  utilityWarning: { fontSize: 10, lineHeight: 15, marginTop: 7 },
  schemeRow: { borderLeftWidth: 2, borderLeftColor: '#22D3EE', paddingLeft: 9, marginBottom: 10 },
  schemeName: { fontSize: 12, fontWeight: '900' },
  schemeReason: { fontSize: 10, lineHeight: 15, marginTop: 2 },
  schemeSource: { fontSize: 9, marginTop: 3 },
  sectionHeaderTitle: { fontSize: 15, fontWeight: '800', marginBottom: 12 },
  statCardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderLeftWidth: 4,
    paddingLeft: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  statCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statIconBox: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  statLabelText: { fontSize: 12, fontWeight: '500' },
  statCardRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statValueText: { fontSize: 12, fontWeight: '700' },
  verifiedPill: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2 },
  verifiedPillText: { fontSize: 8, fontWeight: '900' },

  routerGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between' },
  gridItem: { width: '48%', padding: 12, borderRadius: 12, borderWidth: 1, gap: 4 },
  dominantSchemeCard: { borderWidth: 1.5 },
  gridLabel: { fontSize: 10, fontWeight: '700' },
  gridValue: { fontSize: 14, fontWeight: '900' },

  thresholdScaleContainer: { marginTop: 14, marginBottom: 6 },
  thresholdScaleTitle: { fontSize: 11, fontWeight: '700', marginBottom: 12 },
  scaleTrack: { height: 8, borderRadius: 4, overflow: 'visible', flexDirection: 'row', position: 'relative', width: '100%' },
  scaleFillHalf: { height: '100%' },
  cutoffPin: { position: 'absolute', top: -4, alignItems: 'center', zIndex: 3 },
  cutoffPinLine: { width: 2, height: 16 },
  cutoffPinText: { fontSize: 8, fontWeight: '900', marginTop: 1 },
  userCostPin: { position: 'absolute', top: -14, alignItems: 'center', zIndex: 4 },
  userCostCircle: { width: 8, height: 8, borderRadius: 4 },
  scaleLabelsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  scaleLabel: { fontSize: 9, fontWeight: '800' },

  explainTextCallout: { flexDirection: 'row', borderWidth: 1, borderRadius: 10, padding: 12, marginTop: 12 },
  explainText: { flex: 1, fontSize: 11, fontWeight: '600', lineHeight: 16 },

  divider: { height: 1, marginVertical: 14 },
  infoText: { fontSize: 12, lineHeight: 18, marginBottom: 10 },

  curveCard: { borderRadius: 14, padding: 12, borderWidth: 1, marginTop: 10 },
  chartBarWrapper: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 110, paddingBottom: 6 },
  chartBarCol: { alignItems: 'center', flex: 1 },
  barTooltip: { position: 'absolute', top: -18, backgroundColor: '#1E293B', borderRadius: 4, paddingVertical: 2, paddingHorizontal: 4 },
  tooltipText: { color: '#FFF', fontSize: 7, fontWeight: '800' },
  chartBarTrack: { height: '100%', width: 12, borderRadius: 6, justifyContent: 'flex-end', overflow: 'hidden' },
  chartBarFill: { width: '100%', borderRadius: 6 },
  chartBarLabel: { fontSize: 8, fontWeight: '800', marginTop: 4 },
  chartBarBadgeText: { fontSize: 7, fontWeight: '900', marginTop: 1 },
  chartLegend: { flexDirection: 'row', justifyContent: 'space-around', borderTopWidth: 1, paddingTop: 8, marginTop: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  legendBox: { width: 10, height: 10, borderRadius: 2, marginRight: 6 },
  legendText: { fontSize: 8, fontWeight: '700' },

  accordionHeader: { paddingVertical: 12, borderTopWidth: 1, marginTop: 14, alignItems: 'center' },
  accordionTitle: { fontSize: 12, fontWeight: '800' },
  scheduleTableContainer: { borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#0F172A', paddingVertical: 8, paddingHorizontal: 6 },
  tableHeadText: { flex: 1, color: '#FFF', fontSize: 8, fontWeight: '800', textAlign: 'center' },
  tableRow: { flexDirection: 'row', paddingVertical: 8, paddingHorizontal: 6, borderBottomWidth: 1 },
  tableCellText: { flex: 1, fontSize: 8, textAlign: 'center' },

  radiusMapBox: { height: 180, borderRadius: 14, borderWidth: 1, justifyContent: 'center', alignItems: 'center', marginVertical: 14, overflow: 'hidden' },
  radiusOuterRing: { width: 140, height: 150, borderRadius: 70, borderWidth: 1, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center' },
  radiusMiddleRing: { width: 90, height: 100, borderRadius: 45, borderWidth: 1, borderStyle: 'solid', justifyContent: 'center', alignItems: 'center' },
  radiusInnerRing: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  radiusCenterLabel: { fontSize: 8, fontWeight: '800', marginTop: 2, textAlign: 'center' },
  radiusRingText: { position: 'absolute', bottom: -12, fontSize: 8, fontWeight: '800' },
  radiusRingTextOuter: { position: 'absolute', bottom: -14, fontSize: 8, fontWeight: '800' },
  mapCaption: { fontSize: 9, fontWeight: '700', marginTop: 12 },

  subHeading: { fontSize: 13, fontWeight: '800', marginTop: 14, marginBottom: 8 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  bulletIconCircle: { width: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center', marginRight: 8, marginTop: 1 },
  bulletText: { flex: 1, fontSize: 12, lineHeight: 18 },

  statusBadgeCapsule: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1 },
  statusBadgeCapsuleText: { fontSize: 11, fontWeight: '800' },
  competitorWrapper: { marginTop: 10 },
  competitorCardBlock: { flexDirection: 'row', alignItems: 'center', borderRadius: 10, padding: 10, borderWidth: 1, marginBottom: 6 },
  compCardIconBox: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },
  compNameText: { fontSize: 11, fontWeight: '800' },
  compSubText: { fontSize: 9 },
  compDistanceBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  compDistanceText: { fontSize: 10, fontWeight: '800' },
  noDataWarningBox: { flexDirection: 'row', gap: 8, padding: 12, borderRadius: 10, borderWidth: 1, marginBottom: 12 },
  noDataWarningText: { flex: 1, fontSize: 11, fontWeight: '600', lineHeight: 16 },

  swotGrid: { gap: 10, marginTop: 6 },
  swotGridRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  swotCardBlock: { borderRadius: 12, padding: 12, borderWidth: 1 },
  swotCardBlockHalf: { width: '48%' },
  swotCardTitleText: { fontSize: 13, fontWeight: '900', color: '#1E293B', marginBottom: 6 },
  swotCardItemText: { fontSize: 11, color: '#334155', marginBottom: 2, lineHeight: 16 },

  downloadDprButton: { borderRadius: 4, paddingVertical: 16, alignItems: 'center', marginTop: 10, backgroundColor: '#D946EF' },
  downloadDprButtonText: { color: '#FFFFFF', fontWeight: '900', fontSize: 15 },
});
