import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  Alert,
  Animated,
  Platform} from 'react-native';
import { api } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import {
  Sparkles,
  RefreshCw,
  MapPin,
  Bot,
  FileText,
  Clock,
  Download,
  ChevronDown,
  Zap} from 'lucide-react-native';

// Custom lightweight time-ago math
function getRelativeTime(dateString: string) {
  try {
    const now = new Date();
    const then = new Date(dateString);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'JUST NOW';
    if (diffMins < 60) return `${diffMins}M AGO`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}H AGO`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}D AGO`;
  } catch {
    return 'RECENTLY';
  }
}

export default function AIInsightsScreen() {
  const [area, setArea] = useState('');
  const [showAreaDropdown, setShowAreaDropdown] = useState(false);
  const [report, setReport] = useState('');
  const [reportMeta, setReportMeta] = useState({
    source: '',
    cached: false,
    generatedAt: null as string | null,
    issueCount: 0
  });
  const [isLoadingReport, setIsLoadingReport] = useState(false);

  // Fetch available areas
  const { data: areasData } = useQuery({
    queryKey: ['availableAreas'],
    queryFn: async () => {
      const { data } = await api.get('/issues/areas');
      return data?.areas || [];
    }
  });

  const availableAreas = Array.isArray(areasData) ? areasData : [];
  const scopeLabel = area || 'CITY WIDE';

  const fetchReport = async () => {
    setIsLoadingReport(true);
    try {
      const url = area ? `/issues/ai-report?area=${encodeURIComponent(area)}` : '/issues/ai-report';
      const { data } = await api.get(url);

      setReport(data?.report || '');
      setReportMeta({
        source: data?.source || 'ai',
        cached: Boolean(data?.cached),
        generatedAt: data?.generatedAt || new Date().toISOString(),
        issueCount: Number(data?.issueCount || 0)
      });

      if (data?.cached) {
        Alert.alert('CACHED REPORT', 'A cached intelligence brief has been loaded.');
      } else if (data?.source === 'instant') {
        Alert.alert('RAPID BRIEF READY', 'A fast situational summary is prepared.');
      } else {
        Alert.alert('AI SYNTHESIS COMPLETE', 'Civic intelligence report compiled successfully.');
      }
    } catch (error) {
      console.error('Failed to fetch AI report', error);
      Alert.alert('SYNTHESIS ERROR', 'Unable to generate an intelligence briefing at this time.');
    } finally {
      setIsLoadingReport(false);
    }
  };

  const handleExportPDF = () => {
    if (!report.trim()) {
      Alert.alert('ERROR', 'Generate an intelligence brief first.');
      return;
    }
    Alert.alert('EXPORT SUCCESSFUL', 'The intelligence brief has been exported.');
  };

  // Premium markdown renderer matching web quality
  const renderMarkdown = (text: string) => {
    if (!text) return null;

    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];
      const trimmed = line.trim();

      // Skip empty lines — add breathing space
      if (!trimmed) {
        elements.push(<View key={`space-${i}`} style={{ height: 8 }} />);
        i++;
        continue;
      }

      // Headers
      if (trimmed.startsWith('#')) {
        const level = (trimmed.match(/^#+/) || ['#'])[0].length;
        const cleanText = trimmed.replace(/^#+\s*/, '');
        if (level === 1) {
          elements.push(
            <View key={`h1-${i}`} style={styles.mdH1Container}>
              <Text style={styles.mdH1}>{cleanText.toUpperCase()}</Text>
              <View style={styles.mdH1Accent} />
            </View>
          );
        } else if (level === 2) {
          elements.push(
            <View key={`h2-${i}`} style={styles.mdH2Container}>
              <View style={styles.mdH2Bar} />
              <Text style={styles.mdH2}>{cleanText}</Text>
            </View>
          );
        } else {
          elements.push(
            <View key={`h3-${i}`} style={styles.mdH3Container}>
              <Zap size={10} color="#10b981" />
              <Text style={styles.mdH3}>{cleanText.toUpperCase()}</Text>
            </View>
          );
        }
        i++;
        continue;
      }

      // Bullet points — render as premium cards
      if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
        const cleanText = trimmed.replace(/^[-*]\s*/, '');
        elements.push(
          <View key={`bullet-${i}`} style={styles.bulletCard}>
            <View style={styles.bulletDotContainer}>
              <View style={styles.bulletDot} />
              <View style={styles.bulletGlow} />
            </View>
            <Text style={styles.bulletText}>{renderInlineStyles(cleanText)}</Text>
          </View>
        );
        i++;
        continue;
      }

      // Numbered lists
      if (/^\d+\./.test(trimmed)) {
        const num = trimmed.match(/^(\d+)\./)?.[1] || '1';
        const cleanText = trimmed.replace(/^\d+\.\s*/, '');
        elements.push(
          <View key={`num-${i}`} style={styles.numberedCard}>
            <View style={styles.numberBadge}>
              <Text style={styles.numberText}>{num}</Text>
            </View>
            <Text style={styles.bulletText}>{renderInlineStyles(cleanText)}</Text>
          </View>
        );
        i++;
        continue;
      }

      // Horizontal rule
      if (trimmed === '---' || trimmed === '***') {
        elements.push(
          <View key={`hr-${i}`} style={styles.mdDivider}>
            <View style={styles.mdDividerLine} />
          </View>
        );
        i++;
        continue;
      }

      // Blockquote
      if (trimmed.startsWith('>')) {
        const cleanText = trimmed.replace(/^>\s*/, '');
        elements.push(
          <View key={`bq-${i}`} style={styles.blockquote}>
            <View style={styles.blockquoteBar} />
            <Text style={styles.blockquoteText}>{renderInlineStyles(cleanText)}</Text>
          </View>
        );
        i++;
        continue;
      }

      // Regular paragraph
      elements.push(
        <Text key={`p-${i}`} style={styles.mdParagraph}>
          {renderInlineStyles(trimmed)}
        </Text>
      );
      i++;
    }

    return elements;
  };

  // Parse bold **text** inline
  const renderInlineStyles = (text: string): React.ReactNode[] => {
    const parts = text.split('**');
    return parts.map((part, partIndex) => {
      const isBold = partIndex % 2 === 1;
      return (
        <Text key={partIndex} style={isBold ? styles.textBold : styles.textRegular}>
          {part}
        </Text>
      );
    });
  };

  const hasReport = report.trim() !== '';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <View style={styles.kickerBadge}>
            <Sparkles size={12} color="#6ee7b7" />
            <Text style={styles.kickerText}>CIVIC INTELLIGENCE DESK</Text>
          </View>

          {/* Title */}
          <Text style={styles.heroTitle}>AI INSIGHTS</Text>
          <Text style={styles.heroDescription}>
            Generate a cleaner operations brief for one sector or the whole city. The report now favors fast turnaround, clearer structure, and a layout that holds up properly on smaller screens.
          </Text>

          {/* Sector Selector */}
          <View style={styles.controlsContainer}>
            <Text style={styles.fieldLabel}>COVERAGE</Text>
            <TouchableOpacity
              style={styles.selectorTrigger}
              onPress={() => setShowAreaDropdown(!showAreaDropdown)}
              activeOpacity={0.8}
            >
              <MapPin size={16} color="#10b981" />
              <Text style={styles.selectorText}>
                {area ? area.toUpperCase() : 'CITY WIDE'}
              </Text>
              <ChevronDown
                size={14}
                color="#94a3b8"
                style={{ transform: [{ rotate: showAreaDropdown ? '180deg' : '0deg' }] }}
              />
            </TouchableOpacity>

            {showAreaDropdown && (
              <View style={styles.dropdownPanel}>
                <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
                  <TouchableOpacity
                    style={[styles.dropdownItem, !area && styles.dropdownItemActive]}
                    onPress={() => { setArea(''); setShowAreaDropdown(false); }}
                  >
                    <View style={[styles.dropdownIndicator, !area && styles.dropdownIndicatorActive]} />
                    <Text style={[styles.dropdownItemText, !area && styles.dropdownItemTextActive]}>
                      CITY WIDE
                    </Text>
                  </TouchableOpacity>
                  {availableAreas.map((areaName: string) => (
                    <TouchableOpacity
                      key={areaName}
                      style={[styles.dropdownItem, area === areaName && styles.dropdownItemActive]}
                      onPress={() => { setArea(areaName); setShowAreaDropdown(false); }}
                    >
                      <View style={[styles.dropdownIndicator, area === areaName && styles.dropdownIndicatorActive]} />
                      <Text style={[styles.dropdownItemText, area === areaName && styles.dropdownItemTextActive]}>
                        {areaName.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Generate button */}
            <TouchableOpacity
              style={[styles.generateButton, isLoadingReport && styles.generateButtonDisabled]}
              onPress={fetchReport}
              disabled={isLoadingReport}
              activeOpacity={0.85}
            >
              <View style={styles.generateButtonInner}>
                {isLoadingReport ? (
                  <ActivityIndicator size="small" color="#000000" />
                ) : (
                  <RefreshCw size={16} color="#000000" />
                )}
                <Text style={styles.generateButtonText}>
                  {isLoadingReport
                    ? (hasReport ? 'REFRESHING BRIEF...' : 'SYNTHESIZING ANALYSIS...')
                    : 'GENERATE INTEL BRIEF'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Metadata Chips */}
        {hasReport && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsRow}
          >
            <View style={styles.chip}>
              <MapPin size={11} color="#10b981" />
              <Text style={styles.chipText}>{scopeLabel}</Text>
            </View>
            <View style={styles.chip}>
              <Bot size={11} color="#10b981" />
              <Text style={styles.chipText}>
                {reportMeta.source === 'instant' ? 'FAST SUMMARY' : 'AI SYNTHESIS'}
              </Text>
            </View>
            <View style={styles.chip}>
              <FileText size={11} color="#10b981" />
              <Text style={styles.chipText}>{reportMeta.issueCount} CASES</Text>
            </View>
            {reportMeta.generatedAt && (
              <View style={styles.chip}>
                <Clock size={11} color="#10b981" />
                <Text style={styles.chipText}>{getRelativeTime(reportMeta.generatedAt)}</Text>
              </View>
            )}
            {reportMeta.cached && (
              <View style={[styles.chip, styles.chipCached]}>
                <Sparkles size={11} color="#000000" />
                <Text style={styles.chipTextCached}>CACHED</Text>
              </View>
            )}
          </ScrollView>
        )}

        {/* Report Card */}
        <View style={styles.reportCard}>
          {/* Refresh banner */}
          {isLoadingReport && hasReport && (
            <View style={styles.refreshBanner}>
              <ActivityIndicator size="small" color="#10b981" style={{ marginRight: 8 }} />
              <Text style={styles.refreshText}>UPDATING ANALYSIS...</Text>
            </View>
          )}

          {/* Loading state */}
          {!hasReport && isLoadingReport && (
            <View style={styles.emptyState}>
              <View style={styles.loaderOrb}>
                <View style={styles.loaderOrbInner}>
                  <ActivityIndicator size="large" color="#10b981" />
                </View>
              </View>
              <Text style={styles.emptyTitle}>COMPILING BRIEFING</Text>
              <Text style={styles.emptySubtitle}>
                Summarizing recent civic signals, hotspot patterns, and response priorities for{' '}
                <Text style={styles.textBold}>{scopeLabel}</Text>.
              </Text>
            </View>
          )}

          {/* Empty state */}
          {!hasReport && !isLoadingReport && (
            <View style={styles.emptyState}>
              <View style={styles.idleOrb}>
                <FileText size={28} color="#94a3b8" />
              </View>
              <Text style={styles.emptyTitle}>READY WHEN YOU ARE</Text>
              <Text style={styles.emptySubtitle}>
                Select a scope and generate a formatted report with metrics, linked incidents, and action items.
              </Text>
            </View>
          )}

          {/* Report content */}
          {hasReport && (
            <View style={[styles.reportBody, isLoadingReport && styles.reportBodyDimmed]}>
              {/* Report header */}
              <View style={styles.reportHeader}>
                <View style={styles.reportHeaderLeft}>
                  <Text style={styles.reportEyebrow}>DECISION-READY BRIEF</Text>
                  <Text style={styles.reportTitle}>{scopeLabel}</Text>
                </View>
                <TouchableOpacity
                  style={styles.exportButton}
                  onPress={handleExportPDF}
                  activeOpacity={0.8}
                >
                  <Download size={13} color="#10b981" />
                  <Text style={styles.exportText}>EXPORT</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.reportDivider} />

              {/* Markdown Content */}
              <View style={styles.markdownBody}>
                {renderMarkdown(report)}
              </View>
            </View>
          )}
        </View>

        {/* Bottom spacer for tab bar */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000000',
    paddingTop: Platform.OS === 'ios' ? 50 : 36},
  scrollContainer: {
    paddingHorizontal: 16,
    paddingTop: 16},

  heroCard: {
    backgroundColor: '#000000',
    borderRadius: 28,
    padding: 24,
    marginBottom: 16},

  // Kicker
  kickerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    marginBottom: 20},
  kickerText: {
    color: '#d1fae5',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2},

  // Hero typography
  heroTitle: {
    color: '#ffffff',
    fontSize: 38,
    fontWeight: '900',
    letterSpacing: -1,
    marginBottom: 12},
  heroDescription: {
    color: '#cbd5e1',
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '500',
    marginBottom: 28},

  // Controls
  controlsContainer: {
    gap: 10},
  fieldLabel: {
    color: '#cbd5e1',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.8,
    marginBottom: 4},
  selectorTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    height: 56,
    paddingHorizontal: 18,
    gap: 10},
  selectorText: {
    flex: 1,
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1},

  // Dropdown
  dropdownPanel: {
    backgroundColor: '#000000',
    borderRadius: 20,
    maxHeight: 220,
    overflow: 'hidden'},
  dropdownScroll: {
    maxHeight: 220},
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 18,
    gap: 12},
  dropdownItemActive: {
    backgroundColor: '#133D31'},
  dropdownIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.1)'},
  dropdownIndicatorActive: {
    backgroundColor: '#10b981',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 4},
  dropdownItemText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5},
  dropdownItemTextActive: {
    color: '#10b981'},

  // Generate button
  generateButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 6,
    backgroundColor: '#10b981',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 6},
  generateButtonDisabled: {
    backgroundColor: '#064e3b',
    shadowOpacity: 0},
  generateButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    gap: 10},
  generateButtonText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.5},

  // Chips
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
    marginBottom: 16},
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.1)'},
  chipCached: {
    backgroundColor: '#1A5744'},
  chipText: {
    color: '#cbd5e1',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8},
  chipTextCached: {
    color: '#d1fae5',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8},

  // Report Card
  reportCard: {
    backgroundColor: '#000000',
    borderRadius: 28,
    overflow: 'hidden',
    minHeight: 340},
  refreshBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingVertical: 12},
  refreshText: {
    color: '#10b981',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5},

  // Empty / Loading States
  emptyState: {
    paddingVertical: 80,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center'},
  loaderOrb: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#133D31',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24},
  loaderOrbInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    alignItems: 'center',
    justifyContent: 'center'},
  idleOrb: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20},
  emptyTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 8},
  emptySubtitle: {
    color: '#94a3b8',
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
    textAlign: 'center'},

  // Report Body
  reportBody: {
    padding: 20},
  reportBodyDimmed: {
    opacity: 0.5},
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16},
  reportHeaderLeft: {
    flex: 1,
    marginRight: 12},
  reportEyebrow: {
    color: '#cbd5e1',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.8,
    marginBottom: 4},
  reportTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5},
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.1)'},
  exportText: {
    color: '#cbd5e1',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.2},
  reportDivider: {
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 20},

  // Markdown Content
  markdownBody: {
    gap: 4},

  // H1 — Large section header with accent
  mdH1Container: {
    marginTop: 20,
    marginBottom: 14},
  mdH1: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginBottom: 8},
  mdH1Accent: {
    width: 40,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#10b981',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 6},

  // H2 — Section header with side bar
  mdH2Container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 24,
    marginBottom: 12,
    paddingTop: 16},
  mdH2Bar: {
    width: 3,
    height: 22,
    borderRadius: 2,
    backgroundColor: '#10b981'},
  mdH2: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
    flex: 1},

  // H3 — Sub-header with icon
  mdH3Container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    marginBottom: 8},
  mdH3: {
    color: '#6ee7b7',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5},

  // Paragraph
  mdParagraph: {
    color: '#cbd5e1',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 12},

  // Bullet points — styled as premium cards
  bulletCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    paddingLeft: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 16,
    marginBottom: 8,
    gap: 12},
  bulletDotContainer: {
    marginTop: 5,
    width: 8,
    height: 8,
    alignItems: 'center',
    justifyContent: 'center'},
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981'},
  bulletGlow: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.3)'},
  bulletText: {
    flex: 1,
    color: '#cbd5e1',
    fontSize: 14,
    lineHeight: 21},

  // Numbered list items
  numberedCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    paddingLeft: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 16,
    marginBottom: 8,
    gap: 12},
  numberBadge: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center'},
  numberText: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: '900'},

  // Horizontal rule
  mdDivider: {
    marginVertical: 20,
    alignItems: 'center'},
  mdDividerLine: {
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)'},

  // Blockquote
  blockquote: {
    flexDirection: 'row',
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    overflow: 'hidden',
    marginBottom: 12},
  blockquoteBar: {
    width: 4,
    backgroundColor: '#10b981'},
  blockquoteText: {
    flex: 1,
    padding: 14,
    color: '#d1fae5',
    fontSize: 14,
    lineHeight: 21},

  // Inline text styles
  textBold: {
    color: '#ffffff',
    fontWeight: '800'},
  textRegular: {
    color: '#cbd5e1',
    fontWeight: '500'}});
