import { Image } from "expo-image";
import { SymbolView } from "expo-symbols";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  useColorScheme,
} from "react-native";
import Animated, { FadeIn, FadeInDown, FadeOut } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { AdMobBanner } from "@/components/admob-banner";
import { LineCard } from "@/components/line-card";
import { SkeletonCard } from "@/components/skeleton-card";
import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { useCurpHistory } from "@/hooks/use-curp-history";
import { useCurpLookup } from "@/hooks/use-curp-lookup";
import { getCurpValidationError } from "@/lib/curp";
import { getRiskLevel } from "@/lib/lookup";
import { exportPDFReport } from "@/lib/pdf-export";
import type { FilterTab } from "@/types";

const TOTAL_PROVIDERS = 13;

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "confirmed", label: "Registradas" },
  { key: "possible", label: "Posibles" },
  { key: "errors", label: "Errores" },
];

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [curp, setCurp] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");
  const [isExporting, setIsExporting] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const { history, saveToHistory, removeFromHistory } = useCurpHistory();
  const { loading, timedOut, error, results, scannedCount, lookup, reset } =
    useCurpLookup(saveToHistory);

  const curpError = getCurpValidationError(curp);
  const curpIsValid = curp.length === 18 && !curpError;

  const handleLookup = () => {
    if (!curpIsValid) return;
    lookup(curp);
  };

  const handleReset = () => {
    reset();
    setCurp("");
    setActiveFilter("all");
  };

  const handleExportPDF = async () => {
    if (!results || !riskLevel) return;
    setIsExporting(true);
    try {
      await exportPDFReport(curp.toUpperCase(), results, riskLevel);
    } catch (err) {
      console.error("Error exporting PDF:", err);
    } finally {
      setIsExporting(false);
    }
  };

  const filteredResults = results?.filter((line) => {
    if (activeFilter === "confirmed")
      return (
        !line.isPossible &&
        !line.isNotFound &&
        !line.isError &&
        !line.isUnavailable
      );
    if (activeFilter === "possible") return line.isPossible;
    if (activeFilter === "errors") return line.isError || line.isUnavailable;
    return true;
  });

  const riskLevel = results ? getRiskLevel(results) : null;

  const confirmedCount =
    results?.filter(
      (l) => !l.isPossible && !l.isNotFound && !l.isError && !l.isUnavailable,
    ).length ?? 0;
  const possibleCount = results?.filter((l) => l.isPossible).length ?? 0;

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDark ? "#0A0A0F" : "#F8F9FC" },
      ]}
    >
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Image
              source={require("@/assets/images/icon.png")}
              style={styles.appIcon}
              contentFit="contain"
            />
            <ThemedText type="subtitle" style={styles.title}>
              MisLineas
            </ThemedText>
            <ThemedText
              type="small"
              style={[
                styles.subtitle,
                { color: isDark ? "#8888AA" : "#6B7280" },
              ]}
            >
              Consulta que lineas telefonicas estan registradas bajo tu CURP
            </ThemedText>
          </View>

          <View style={styles.formSection}>
            <View
              style={[
                styles.inputContainer,
                {
                  backgroundColor: isDark ? "#1A1A2E" : "#FFFFFF",
                  borderColor:
                    curpError && curp.length === 18
                      ? "#EF4444"
                      : isDark
                        ? "#2A2A3E"
                        : "#E0E2E8",
                },
              ]}
            >
              <SymbolView
                name="person.text.rectangle"
                size={20}
                tintColor={isDark ? "#6B7280" : "#9CA3AF"}
                weight="medium"
              />
              <TextInput
                ref={inputRef}
                value={curp}
                onChangeText={(text) => setCurp(text.toUpperCase())}
                placeholder="Ingresa tu CURP"
                placeholderTextColor={isDark ? "#4B5563" : "#9CA3AF"}
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={18}
                style={[
                  styles.input,
                  { color: isDark ? "#FFFFFF" : "#111827" },
                ]}
                onSubmitEditing={handleLookup}
                returnKeyType="search"
              />
              {curp.length > 0 && (
                <Pressable onPress={() => setCurp("")} hitSlop={8}>
                  <SymbolView
                    name="xmark.circle.fill"
                    size={18}
                    tintColor={isDark ? "#6B7280" : "#9CA3AF"}
                  />
                </Pressable>
              )}
            </View>

            {curpError && curp.length === 18 && (
              <ThemedText
                type="small"
                style={{ color: "#EF4444", paddingHorizontal: 4 }}
              >
                {curpError}
              </ThemedText>
            )}

            {history.length > 0 && curp.length === 0 && (
              <View style={styles.historySection}>
                <View style={styles.historyHeader}>
                  <ThemedText
                    type="small"
                    style={{
                      color: isDark ? "#8888AA" : "#6B7280",
                      fontWeight: "600",
                    }}
                  >
                    Consultas recientes
                  </ThemedText>
                </View>
                <View style={styles.historyChips}>
                  {history.slice(0, 3).map((item) => (
                    <View key={item.curp} style={styles.historyChipContainer}>
                      <Pressable
                        onPress={() => setCurp(item.curp)}
                        style={[
                          styles.historyChip,
                          { backgroundColor: isDark ? "#1A1A2E" : "#F3F4F6" },
                        ]}
                      >
                        <SymbolView
                          name="clock"
                          size={14}
                          tintColor={isDark ? "#8888AA" : "#6B7280"}
                        />
                        <ThemedText
                          type="small"
                          style={{
                            color: isDark ? "#E5E7EB" : "#374151",
                            fontFamily: "monospace",
                          }}
                        >
                          {item.curp}
                        </ThemedText>
                      </Pressable>
                      <Pressable
                        onPress={() => removeFromHistory(item.curp)}
                        hitSlop={8}
                        style={styles.historyRemoveButton}
                      >
                        <SymbolView
                          name="xmark.circle.fill"
                          size={16}
                          tintColor={isDark ? "#6B7280" : "#9CA3AF"}
                        />
                      </Pressable>
                    </View>
                  ))}
                </View>
              </View>
            )}

            <Pressable
              onPress={handleLookup}
              disabled={loading || !curpIsValid}
              style={[
                styles.button,
                (loading || !curpIsValid) && styles.buttonDisabled,
              ]}
            >
              {loading ? (
                <View style={styles.buttonContent}>
                  <ActivityIndicator color="#FFFFFF" size="small" />
                  <ThemedText style={styles.buttonText}>
                    Escaneando {scannedCount}/{TOTAL_PROVIDERS}...
                  </ThemedText>
                </View>
              ) : (
                <View style={styles.buttonContent}>
                  <SymbolView
                    name="magnifyingglass"
                    size={18}
                    tintColor="#FFFFFF"
                    weight="semibold"
                  />
                  <ThemedText style={styles.buttonText}>Consultar</ThemedText>
                </View>
              )}
            </Pressable>
          </View>

          {error && (
            <Animated.View
              entering={FadeIn.duration(300)}
              exiting={FadeOut.duration(200)}
              style={[
                styles.errorContainer,
                { backgroundColor: isDark ? "#450A0A" : "#FEF2F2" },
              ]}
            >
              <SymbolView
                name="exclamationmark.triangle.fill"
                size={18}
                tintColor="#EF4444"
              />
              <ThemedText type="small" style={{ color: "#EF4444", flex: 1 }}>
                {error}
              </ThemedText>
            </Animated.View>
          )}

          {timedOut && (
            <Animated.View
              entering={FadeIn.duration(300)}
              style={[
                styles.errorContainer,
                { backgroundColor: isDark ? "#1C1917" : "#FFFBEB" },
              ]}
            >
              <SymbolView name="clock.fill" size={18} tintColor="#F59E0B" />
              <ThemedText type="small" style={{ color: "#F59E0B", flex: 1 }}>
                La consulta tardo demasiado. Algunos proveedores pueden no estar
                disponibles.
              </ThemedText>
            </Animated.View>
          )}

          {results && results.length > 0 && (
            <Animated.View
              entering={FadeIn.duration(400)}
              style={styles.resultsSection}
            >
              {riskLevel && (
                <View
                  style={[
                    styles.riskBanner,
                    {
                      backgroundColor: isDark ? "#1A1A2E" : "#FFFFFF",
                      borderColor: isDark ? "#2A2A3E" : "#E8EAF0",
                    },
                  ]}
                >
                  <View style={styles.riskLeft}>
                    <View
                      style={[
                        styles.riskDot,
                        { backgroundColor: riskLevel.color },
                      ]}
                    />
                    <View>
                      <ThemedText type="smallBold">
                        Nivel de riesgo: {riskLevel.label}
                      </ThemedText>
                      <ThemedText
                        type="small"
                        style={{
                          color: isDark ? "#8888AA" : "#6B7280",
                          fontSize: 12,
                        }}
                      >
                        {riskLevel.description}
                      </ThemedText>
                    </View>
                  </View>
                  <View style={styles.riskCounts}>
                    {confirmedCount > 0 && (
                      <View
                        style={[
                          styles.countBadge,
                          { backgroundColor: isDark ? "#450A0A" : "#FEE2E2" },
                        ]}
                      >
                        <ThemedText
                          style={{
                            color: "#EF4444",
                            fontSize: 12,
                            fontWeight: "700",
                          }}
                        >
                          {confirmedCount}
                        </ThemedText>
                      </View>
                    )}
                    {possibleCount > 0 && (
                      <View
                        style={[
                          styles.countBadge,
                          { backgroundColor: isDark ? "#422006" : "#FEF3C7" },
                        ]}
                      >
                        <ThemedText
                          style={{
                            color: "#F59E0B",
                            fontSize: 12,
                            fontWeight: "700",
                          }}
                        >
                          {possibleCount}
                        </ThemedText>
                      </View>
                    )}
                  </View>
                </View>
              )}

              <View style={styles.filterRow}>
                {FILTER_TABS.map((tab) => {
                  const isActive = activeFilter === tab.key;
                  return (
                    <Pressable
                      key={tab.key}
                      onPress={() => setActiveFilter(tab.key)}
                      style={[
                        styles.filterChip,
                        {
                          backgroundColor: isActive
                            ? "#208AEF"
                            : isDark
                              ? "#1A1A2E"
                              : "#FFFFFF",
                          borderColor: isActive
                            ? "#208AEF"
                            : isDark
                              ? "#2A2A3E"
                              : "#E0E2E8",
                        },
                      ]}
                    >
                      <ThemedText
                        style={{
                          color: isActive
                            ? "#FFFFFF"
                            : isDark
                              ? "#8888AA"
                              : "#6B7280",
                          fontSize: 13,
                          fontWeight: isActive ? "700" : "500",
                        }}
                      >
                        {tab.label}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>

              <View style={styles.resultsList}>
                {filteredResults?.map((line, index) => (
                  <LineCard key={line.id} line={line} index={index} />
                ))}
                {filteredResults?.length === 0 && (
                  <ThemedText
                    type="small"
                    style={{
                      textAlign: "center",
                      color: isDark ? "#4B5563" : "#9CA3AF",
                      paddingVertical: Spacing.three,
                    }}
                  >
                    No hay resultados en esta categoria
                  </ThemedText>
                )}
              </View>

              <Pressable
                onPress={handleExportPDF}
                disabled={isExporting}
                style={[
                  styles.exportButton,
                  {
                    backgroundColor: isDark ? "#1A1A2E" : "#FFFFFF",
                    borderColor: isDark ? "#2A2A3E" : "#E0E2E8",
                  },
                  isExporting && styles.buttonDisabled,
                ]}
              >
                {isExporting ? (
                  <ActivityIndicator size="small" color="#208AEF" />
                ) : (
                  <SymbolView
                    name="doc.richtext"
                    size={18}
                    tintColor="#208AEF"
                    weight="semibold"
                  />
                )}
                <ThemedText
                  style={{ color: "#208AEF", fontSize: 14, fontWeight: "600" }}
                >
                  {isExporting ? "Generando PDF..." : "Exportar PDF"}
                </ThemedText>
              </Pressable>

              <Pressable onPress={handleReset} style={styles.resetButton}>
                <SymbolView
                  name="arrow.counterclockwise"
                  size={16}
                  tintColor="#208AEF"
                  weight="semibold"
                />
                <ThemedText
                  style={{ color: "#208AEF", fontSize: 14, fontWeight: "600" }}
                >
                  Nueva consulta
                </ThemedText>
              </Pressable>
            </Animated.View>
          )}

          {!loading && !results && !error && !timedOut && (
            <Animated.View
              entering={FadeInDown.delay(200).duration(500)}
              style={styles.emptyState}
            >
              <SymbolView
                name="doc.text.magnifyingglass"
                size={48}
                tintColor={isDark ? "#2A2A3E" : "#D1D5DB"}
                weight="light"
              />
              <ThemedText
                type="small"
                style={[
                  styles.emptyText,
                  { color: isDark ? "#4B5563" : "#9CA3AF" },
                ]}
              >
                Ingresa tu CURP para consultar
              </ThemedText>
            </Animated.View>
          )}

          {loading && results && results.length === 0 && (
            <Animated.View
              entering={FadeIn.duration(300)}
              style={styles.skeletonSection}
            >
              <View style={styles.skeletonHeader}>
                <ActivityIndicator size="small" color="#208AEF" />
                <ThemedText
                  type="small"
                  style={{
                    color: isDark ? "#8888AA" : "#6B7280",
                    fontWeight: "600",
                  }}
                >
                  Escaneando proveedores...
                </ThemedText>
              </View>
              <View style={styles.skeletonList}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <SkeletonCard key={i} index={i} />
                ))}
              </View>
            </Animated.View>
          )}

          {loading && results && results.length > 0 && (
            <Animated.View
              entering={FadeIn.duration(200)}
              style={styles.skeletonList}
            >
              {Array.from({
                length: Math.max(2, TOTAL_PROVIDERS - scannedCount),
              }).map((_, i) => (
                <SkeletonCard key={`pending-${i}`} index={i} />
              ))}
            </Animated.View>
          )}

          <View style={styles.credits}>
            <ThemedText
              type="small"
              style={{
                color: isDark ? "#6B7280" : "#9CA3AF",
                textAlign: "center",
              }}
            >
              Basado en{" "}
              <ThemedText
                type="small"
                style={{ color: "#208AEF", fontWeight: "600" }}
                onPress={() =>
                  Linking.openURL("https://github.com/moraxh/MisLineas")
                }
              >
                MisLineas
              </ThemedText>
              {" "}por Jorge Mora
            </ThemedText>
          </View>
        </ScrollView>
        <AdMobBanner />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.four,
  },
  header: {
    alignItems: "center",
    paddingTop: Spacing.four,
    paddingBottom: Spacing.three,
    gap: Spacing.two,
  },
  appIcon: {
    width: 72,
    height: 72,
    borderRadius: 18,
    marginBottom: Spacing.one,
    borderCurve: "continuous",
    boxShadow: "0 4px 12px rgba(32, 138, 239, 0.2)",
  },
  title: {
    textAlign: "center",
    fontSize: 28,
    lineHeight: 34,
  },
  subtitle: {
    textAlign: "center",
    fontSize: 15,
    lineHeight: 22,
  },
  formSection: {
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.three,
    height: 56,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: Spacing.two,
    borderCurve: "continuous",
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
    letterSpacing: 0.5,
    paddingVertical: 0,
  },
  button: {
    height: 54,
    borderRadius: 16,
    backgroundColor: "#208AEF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderCurve: "continuous",
    boxShadow: "0 4px 12px rgba(32, 138, 239, 0.3)",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.three,
    borderRadius: 12,
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  resultsSection: {
    gap: Spacing.three,
  },
  riskBanner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.three,
    borderRadius: 16,
    borderWidth: 1,
    borderCurve: "continuous",
  },
  riskLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    flex: 1,
  },
  riskDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  riskCounts: {
    flexDirection: "row",
    gap: 6,
  },
  countBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  filterRow: {
    flexDirection: "row",
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderCurve: "continuous",
  },
  resultsList: {
    gap: Spacing.two,
  },
  resetButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.one,
    paddingVertical: Spacing.two,
  },
  exportButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.one,
    paddingVertical: Spacing.two,
    borderRadius: 12,
    borderWidth: 1,
    borderCurve: "continuous",
    marginTop: Spacing.one,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.three,
    paddingBottom: Spacing.six,
  },
  emptyText: {
    textAlign: "center",
  },
  loadingState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.three,
    paddingBottom: Spacing.six,
  },
  skeletonSection: {
    gap: Spacing.three,
  },
  skeletonHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    paddingHorizontal: 4,
  },
  skeletonList: {
    gap: Spacing.two,
  },
  historySection: {
    gap: Spacing.one,
  },
  historyHeader: {
    paddingHorizontal: 4,
  },
  historyChips: {
    gap: Spacing.one,
  },
  historyChipContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.one,
  },
  historyChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.one,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: 8,
    flex: 1,
    borderCurve: "continuous",
  },
  historyRemoveButton: {
    padding: 4,
  },
  credits: {
    marginTop: Spacing.four,
    paddingTop: Spacing.three,
  },
});
