import React from 'react';
import { SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';

const formatMoney = (value) => `₹${Math.round(Number(value || 0)).toLocaleString('en-IN')}`;

const Metric = ({ icon, label, value, detail, accent = '#67e8f9' }) => (
  <View style={styles.metricCard}>
    <View style={styles.metricTop}>
      <View style={[styles.metricIcon, { borderColor: `${accent}55`, backgroundColor: `${accent}14` }]}><Feather name={icon} size={16} color={accent} /></View>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
    <Text style={styles.metricValue}>{value}</Text>
    <Text style={styles.metricDetail}>{detail}</Text>
  </View>
);

const DetailRow = ({ label, value }) => (
  <View style={styles.detailRow}><Text style={styles.detailLabel}>{label}</Text><Text style={styles.detailValue}>{value}</Text></View>
);

export default function FinCompassDashboard({ report, form }) {
  const { width } = useWindowDimensions();
  const isCompact = width < 760;
  const financial = report?.financial_roadmap?.financial_structuring || {};
  const scheme = report?.financial_roadmap?.scheme_auto_selection || {};
  const repayment = report?.financial_roadmap?.emi_moratorium_generator || {};
  const feasibility = report?.feasibility_report || {};
  const compliance = report?.compliance || {};
  const market = feasibility.market_reach || {};
  const schemeLimit = scheme.selected_scheme === 'Micro Finance Scheme' ? 125000 : scheme.selected_scheme === 'Term Loan Scheme' ? 4500000 : 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <View style={styles.backgroundGrid} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.brandRow}><View style={styles.logo}><Feather name="compass" size={21} color="#67e8f9" /></View><View><Text style={styles.brand}>GramAdvisory</Text><Text style={styles.subtitle}>BUSINESS ASSESSMENT</Text></View></View>
          <View style={styles.locationPill}><Feather name="map-pin" size={13} color="#67e8f9" /><Text style={styles.locationText}>{form?.village || 'Business location'}, {form?.district || 'District'}</Text></View>
        </View>

        <View style={styles.hero}>
          <View style={styles.heroCopy}><Text style={styles.eyebrow}>ASSESSMENT SUMMARY</Text><Text style={styles.title}>{compliance.registered_business_name || 'Your business assessment'}</Text><Text style={styles.heroText}>{form?.businessCategory || 'Micro-enterprise'} project planning based on your available margin capital and selected location.</Text></View>
          <View style={styles.schemeBadge}><Text style={styles.badgeLabel}>RECOMMENDED SCHEME</Text><Text style={styles.badgeValue}>{scheme.selected_scheme || 'Assessment pending'}</Text><Text style={styles.badgeMeta}>{scheme.interest_rate_pa || 0}% annual interest</Text></View>
        </View>

        <View style={[styles.metricsGrid, isCompact && styles.metricsGridCompact]}>
          <Metric icon="briefcase" label="Project cost" value={formatMoney(financial.total_feasible_project_cost)} detail="Total feasible project cost" />
          <Metric icon="credit-card" label="Sanctionable loan" value={formatMoney(financial.sanctionable_loan_amount)} detail="Within scheme and loan limits" accent="#5eead4" />
          <Metric icon="pie-chart" label="Margin capital" value={formatMoney(financial.available_margin_capital)} detail="Your available contribution" accent="#fbbf24" />
          <Metric icon="activity" label="Working capital" value={formatMoney(financial.working_capital_requirement)} detail="Estimated operating requirement" accent="#a5b4fc" />
        </View>

        <View style={[styles.columns, isCompact && styles.columnsCompact]}>
          <View style={styles.panel}><View style={styles.panelHeader}><View><Text style={styles.panelEyebrow}>LOAN ROUTING</Text><Text style={styles.panelTitle}>Funding structure</Text></View><Feather name="trending-up" size={19} color="#67e8f9" /></View><DetailRow label="Maximum loan capacity" value={formatMoney(financial.maximum_loan_amount)} /><DetailRow label="Promoter equity" value={formatMoney(financial.promoter_equity)} /><DetailRow label="Scheme limit" value={formatMoney(schemeLimit)} /><DetailRow label="Eligibility" value={scheme.selected_scheme ? (scheme.selected_scheme === 'No Pilot Scheme' ? 'Review required' : 'Eligible') : 'Pending'} /></View>
          <View style={styles.panel}><View style={styles.panelHeader}><View><Text style={styles.panelEyebrow}>REPAYMENT OUTLOOK</Text><Text style={styles.panelTitle}>What repayment looks like</Text></View><Feather name="calendar" size={19} color="#5eead4" /></View><DetailRow label="Tenure" value={`${scheme.tenure_years || 0} years`} /><DetailRow label="Moratorium" value={`${scheme.moratorium_months || 0} months`} /><DetailRow label="First active quarter" value={formatMoney(repayment.first_active_quarter_payment)} /><DetailRow label="Average active quarter" value={formatMoney(repayment.average_active_quarter_payment)} /></View>
        </View>

        <View style={styles.bottomPanel}><View style={styles.bottomHeader}><View><Text style={styles.panelEyebrow}>LOCAL BUSINESS CONTEXT</Text><Text style={styles.panelTitle}>Market reach</Text></View><View style={styles.radius}><Feather name="radio" size={13} color="#67e8f9" /><Text style={styles.radiusText}>{market.catchment_radius_km || 'Not available'}</Text></View></View><Text style={styles.marketText}>{market.consumer_catchment_summary_en || 'Market reach details will appear after assessment.'}</Text><View style={styles.contextRow}><View style={styles.contextItem}><Text style={styles.contextLabel}>BUSINESS</Text><Text style={styles.contextValue}>{form?.businessCategory || 'Not provided'}</Text></View><View style={styles.contextItem}><Text style={styles.contextLabel}>OPERATING COST / MONTH</Text><Text style={styles.contextValue}>{formatMoney(financial.monthly_operational_cost)}</Text></View><View style={styles.contextItem}><Text style={styles.contextLabel}>REGISTRATION</Text><Text style={styles.contextValue}>{compliance.status || 'Not checked'}</Text></View></View></View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#071426' }, backgroundGrid: { ...StyleSheet.absoluteFillObject, opacity: 0.28, backgroundColor: '#0b1d35' }, content: { padding: 22, paddingBottom: 50, maxWidth: 1280, width: '100%', alignSelf: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 26, gap: 16 }, brandRow: { flexDirection: 'row', alignItems: 'center', gap: 11 }, logo: { width: 42, height: 42, borderRadius: 12, borderWidth: 1, borderColor: '#164e63', backgroundColor: '#0c2a43', justifyContent: 'center', alignItems: 'center' }, brand: { color: '#f1f5f9', fontSize: 19, fontWeight: '800' }, subtitle: { color: '#67e8f9', fontSize: 9, letterSpacing: 2, fontWeight: '700', marginTop: 2 }, locationPill: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 12, paddingVertical: 9, borderWidth: 1, borderColor: '#183b58', backgroundColor: '#0c2038', borderRadius: 18 }, locationText: { color: '#cbd5e1', fontSize: 12 }, hero: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', gap: 24, padding: 24, borderRadius: 17, backgroundColor: '#0c233d', borderWidth: 1, borderColor: '#1b506b', marginBottom: 16 }, heroCopy: { flex: 1 }, eyebrow: { color: '#67e8f9', fontSize: 10, letterSpacing: 2, fontWeight: '800', marginBottom: 9 }, title: { color: '#f8fafc', fontSize: 28, lineHeight: 34, fontWeight: '800' }, heroText: { color: '#a9bdd0', fontSize: 14, lineHeight: 21, marginTop: 9, maxWidth: 680 }, schemeBadge: { minWidth: 210, padding: 15, borderRadius: 12, backgroundColor: '#092037', borderWidth: 1, borderColor: '#1c6076' }, badgeLabel: { color: '#7893aa', fontSize: 9, letterSpacing: 1.5, fontWeight: '800' }, badgeValue: { color: '#c8f7ff', fontSize: 16, fontWeight: '800', marginTop: 7 }, badgeMeta: { color: '#5eead4', fontSize: 12, marginTop: 5 },
  metricsGrid: { flexDirection: 'row', gap: 12, marginBottom: 16 }, metricsGridCompact: { flexWrap: 'wrap' }, metricCard: { flex: 1, minWidth: 170, padding: 16, borderRadius: 13, backgroundColor: '#0b1d35', borderWidth: 1, borderColor: '#183653' }, metricTop: { flexDirection: 'row', alignItems: 'center', gap: 9 }, metricIcon: { width: 31, height: 31, borderRadius: 9, borderWidth: 1, alignItems: 'center', justifyContent: 'center' }, metricLabel: { color: '#9fb4c8', fontSize: 11, fontWeight: '700' }, metricValue: { color: '#f8fafc', fontSize: 22, fontWeight: '800', marginTop: 16 }, metricDetail: { color: '#607d96', fontSize: 11, marginTop: 5 }, columns: { flexDirection: 'row', gap: 16, marginBottom: 16 }, columnsCompact: { flexDirection: 'column' }, panel: { flex: 1, padding: 19, borderRadius: 14, backgroundColor: '#0b1d35', borderWidth: 1, borderColor: '#183653' }, panelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 13 }, panelEyebrow: { color: '#6687a0', fontSize: 9, letterSpacing: 1.7, fontWeight: '800' }, panelTitle: { color: '#edf6ff', fontSize: 18, fontWeight: '800', marginTop: 5 }, detailRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 14, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: '#16324d' }, detailLabel: { color: '#91a9bd', fontSize: 12, flex: 1 }, detailValue: { color: '#e5f4ff', fontSize: 12, fontWeight: '700', textAlign: 'right' }, bottomPanel: { padding: 19, borderRadius: 14, backgroundColor: '#0b1d35', borderWidth: 1, borderColor: '#183653' }, bottomHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }, radius: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, backgroundColor: '#0c2a43' }, radiusText: { color: '#c8f7ff', fontSize: 11, fontWeight: '700' }, marketText: { color: '#b5c7d7', fontSize: 13, lineHeight: 21, marginTop: 16 }, contextRow: { flexDirection: 'row', gap: 12, marginTop: 18, flexWrap: 'wrap' }, contextItem: { flex: 1, minWidth: 150, padding: 12, borderRadius: 9, backgroundColor: '#09182b' }, contextLabel: { color: '#607d96', fontSize: 9, letterSpacing: 1.2, fontWeight: '800' }, contextValue: { color: '#d9efff', fontSize: 13, fontWeight: '700', marginTop: 6 },
});
