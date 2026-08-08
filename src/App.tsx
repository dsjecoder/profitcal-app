import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Navbar } from './components/Navbar';
import { DemoBanner } from './components/DemoBanner';
import { FileUpload } from './components/FileUpload';
import { CogsModal } from './components/CogsModal';
import { ExecutiveDashboard } from './components/ExecutiveDashboard';
import { AdPerformanceTable } from './components/AdPerformanceTable';
import { GrowthComparison } from './components/GrowthComparison';
import { AnomalyTables } from './components/AnomalyTables';
import { LowStockAlert } from './components/LowStockAlert';
import { ShippingExportModal } from './components/ShippingExportModal';
import { DisputeClaimModal } from './components/DisputeClaimModal';
import { PricingModal } from './components/PricingModal';
import { AuthModal } from './components/AuthModal';
import { AdminDashboard } from './components/AdminDashboard';
import { ContactWidget } from './components/ContactWidget';
import { MobileNotice } from './components/MobileNotice';
import { TermsModal } from './components/TermsModal';
import { Footer } from './components/Footer';

import { OrderItem, PlatformType, SKUData, UserState } from './types';
import {
  getUserState,
  saveUserState,
  getAppSettings,
  saveAppSettings,
  getSavedCOGS,
  saveCOGS,
} from './utils/storage';
import { SAMPLE_SHOPEE_ORDERS, SAMPLE_TIKTOK_ORDERS, calculateSummary } from './utils/mockData';
import { parseUploadedFile } from './utils/parser';
import { exportAuditedExcel } from './utils/export';
import { trackEventSilent } from './utils/analytics';
import { saveAuditHistorySnapshot } from './utils/historyTracker';
import { getInitialLanguage, saveLanguagePreference, Language } from './utils/i18n';

import { TabNavigation, MainTabType } from './components/TabNavigation';
import { parseOAuthRedirectHash } from './utils/oauthHandler';
import { submitUpgradeRequest } from './utils/upgradeTracker';

export function App() {
  const [user, setUser] = useState<UserState>(getUserState());
  const [currentLang, setCurrentLang] = useState<Language>(getInitialLanguage());
  const [platform, setPlatform] = useState<PlatformType>('shopee');
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [extractedSkus, setExtractedSkus] = useState<SKUData[]>([]);

  // Main Dashboard Tab Navigation
  const [activeMainTab, setActiveMainTab] = useState<MainTabType>('financial');

  // Settings
  const [settings, setSettings] = useState(getAppSettings());

  // Modals
  const [showCogsModal, setShowCogsModal] = useState(false);
  const [showShippingModal, setShowShippingModal] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  // Auto detect `/admin` route or Google OAuth `#access_token=` in URL
  useEffect(() => {
    if (window.location.pathname.includes('/admin') || window.location.hash === '#admin') {
      setShowAdminDashboard(true);
    }

    // Catch Real Google OAuth Token Callback
    const oauthUser = parseOAuthRedirectHash();
    if (oauthUser) {
      const proRecord = checkEmailProRecord(oauthUser.email);
      const isPro = proRecord.isPro || user.tier === 'pro';

      const updatedUser: UserState = {
        ...user,
        isLoggedIn: true,
        email: oauthUser.email,
        name: oauthUser.name,
        tier: isPro ? 'pro' : 'free',
        tokens: isPro ? 9999 : (user.tokens ?? 20),
        proExpiresAt: proRecord.proExpiresAt || user.proExpiresAt,
        lastTokenReset: user.lastTokenReset || new Date().toISOString(),
      };
      setUser(updatedUser);
      saveUserState(updatedUser);
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    }
  }, []);

  const handleLogout = () => {
    const loggedOutUser: UserState = {
      isLoggedIn: false,
      email: '',
      name: 'Khách',
      tier: 'free',
      tokens: 20,
      lastTokenReset: new Date().toISOString(),
    };
    setUser(loggedOutUser);
    saveUserState(loggedOutUser);
  };

  const handleLanguageChange = (lang: Language) => {
    setCurrentLang(lang);
    saveLanguagePreference(lang);
  };

  // Auto-recalculate summary whenever orders, packagingCost, or feeThreshold change
  const summary = calculateSummary(orders, settings.packagingCost, settings.feeThreshold);

  // Helper to extract distinct SKUs from order list
  const extractSkus = (orderList: OrderItem[]): SKUData[] => {
    const map = new Map<string, SKUData>();
    const savedCOGS = getSavedCOGS();

    orderList.forEach((o) => {
      if (!map.has(o.sku)) {
        const mockStock = Math.floor(Math.random() * 12) + 1;
        map.set(o.sku, {
          sku: o.sku,
          productName: o.productName,
          cogs: savedCOGS[o.sku] !== undefined ? savedCOGS[o.sku] : Math.round((o.grossRevenue / o.quantity) * 0.45),
          quantitySold: o.quantity,
          stockCount: mockStock,
          safetyThreshold: 3,
        });
      } else {
        const existing = map.get(o.sku)!;
        existing.quantitySold += o.quantity;
      }
    });

    return Array.from(map.values());
  };

  // 1. Handle File Upload
  const handleFileUpload = async (file: File) => {
    try {
      const parsed = await parseUploadedFile(
        file,
        platform,
        settings.packagingCost,
        settings.feeThreshold
      );

      setOrders(parsed);
      const skus = extractSkus(parsed);
      setExtractedSkus(skus);
      
      // Open COGS input modal to let user confirm/adjust cost price
      setShowCogsModal(true);

      // Confetti celebration
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });

      // Track Silent Analytics & Save Period Snapshot
      const fileSummary = calculateSummary(parsed, settings.packagingCost, settings.feeThreshold);
      saveAuditHistorySnapshot(file.name, platform, fileSummary);
      trackEventSilent({
        eventName: 'upload_report',
        platform,
        summary: fileSummary,
        uniqueSkusCount: skus.length,
        fileName: file.name,
      });
    } catch (err: any) {
      alert(err.message || 'Lỗi xử lý file Excel!');
    }
  };

  // 2. Load Instant Demo Data (Shopee / TikTok Shop)
  const handleLoadDemo = (targetPlatform: PlatformType) => {
    setPlatform(targetPlatform);
    const demoData = targetPlatform === 'shopee' ? SAMPLE_SHOPEE_ORDERS : SAMPLE_TIKTOK_ORDERS;
    
    // Deep clone demo data
    const cloned = JSON.parse(JSON.stringify(demoData)) as OrderItem[];
    setOrders(cloned);

    const skus = extractSkus(cloned);
    setExtractedSkus(skus);

    confetti({
      particleCount: 60,
      spread: 60,
      origin: { y: 0.6 },
    });

    // Track Silent Analytics
    const demoSummary = calculateSummary(cloned, settings.packagingCost, settings.feeThreshold);
    saveAuditHistorySnapshot(`Demo_${targetPlatform.toUpperCase()}_Data.xlsx`, targetPlatform, demoSummary);
    trackEventSilent({
      eventName: 'load_demo',
      platform: targetPlatform,
      summary: demoSummary,
      uniqueSkusCount: skus.length,
    });
  };

  // 3. Confirm COGS Modal
  const handleConfirmCOGS = (cogsMap: Record<string, number>) => {
    saveCOGS(cogsMap);

    // Update COGS for existing order list
    const updatedOrders = orders.map((o) => {
      const cogsPerUnit = cogsMap[o.sku] !== undefined ? cogsMap[o.sku] : Math.round((o.grossRevenue / o.quantity) * 0.45);
      const totalCogs = cogsPerUnit * o.quantity;
      const taxAmount = Math.round(o.grossRevenue * 0.015);
      const netProfit = o.netSettlement - totalCogs - settings.packagingCost - taxAmount;

      return {
        ...o,
        cogs: totalCogs,
        taxAmount,
        netProfit,
        isNegativeProfit: netProfit < 0,
      };
    });

    setOrders(updatedOrders);
    setShowCogsModal(false);
  };

  // 4. Update SKU Threshold
  const handleUpdateThreshold = (sku: string, newThreshold: number) => {
    setExtractedSkus((prev) =>
      prev.map((item) => (item.sku === sku ? { ...item, safetyThreshold: newThreshold } : item))
    );
  };

  // 5. Settings Adjusters
  const handlePackagingCostChange = (cost: number) => {
    const newSettings = { ...settings, packagingCost: cost };
    setSettings(newSettings);
    saveAppSettings(newSettings);
  };

  const handleFeeThresholdChange = (threshold: number) => {
    const newSettings = { ...settings, feeThreshold: threshold };
    setSettings(newSettings);
    saveAppSettings(newSettings);
  };

  // 6. Export Excel Report
  const handleExportExcel = () => {
    const filename = `ProfitCal_${platform.toUpperCase()}_BaoCaoLoiNhuan_${new Date().toISOString().split('T')[0]}.xlsx`;
    exportAuditedExcel(orders, filename);
    trackEventSilent({
      eventName: 'export_excel',
      platform,
      summary,
      uniqueSkusCount: extractedSkus.length,
    });
  };

  // 7. Login Success
  const handleLoginSuccess = (email: string, name: string) => {
    const proRecord = checkEmailProRecord(email);
    const isPro = proRecord.isPro || user.tier === 'pro';

    const updated: UserState = {
      ...user,
      isLoggedIn: true,
      email,
      name,
      tier: isPro ? 'pro' : 'free',
      tokens: isPro ? 9999 : (user.tokens ?? 20),
      proExpiresAt: proRecord.proExpiresAt || user.proExpiresAt,
    };
    saveUserState(updated);
    setUser(updated);
    setShowAuthModal(false);
  };

  // 8. Submit Pro Upgrade Request for Admin Approval
  const handleConfirmUpgrade = (plan: 'monthly' | 'yearly', paymentMethod: string, amount: number) => {
    submitUpgradeRequest({
      userEmail: user.email || 'guest@tagki.com',
      userName: user.name || 'Chủ Shop',
      plan,
      amount,
      paymentMethod,
    });

    const updated: UserState = {
      ...user,
      upgradeStatus: 'pending',
      pendingPlan: plan,
    };
    saveUserState(updated);
    setUser(updated);
    setShowPricingModal(false);

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.5 },
    });

    alert('🎉 Yêu cầu nâng cấp Gói PRO của bạn đã được gửi tới Admin!\n\nAdmin sẽ kiểm tra giao dịch chuyển khoản và kích hoạt tài khoản PRO của bạn trong 5-15 phút.');
  };

  return (
    <div className="min-h-screen bg-navy-950 text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-navy-950 font-sans relative">
      
      {/* Mobile Smartphone Optimization Banner */}
      <MobileNotice />

      {/* Header & Navigation */}
      <Navbar
        user={user}
        currentLang={currentLang}
        onLanguageChange={handleLanguageChange}
        onOpenAuth={() => setShowAuthModal(true)}
        onOpenAdmin={() => setShowAdminDashboard(true)}
        onOpenTerms={() => setShowTermsModal(true)}
        onLogout={handleLogout}
        onOpenUpgradeModal={() => setShowPricingModal(true)}
      />

      {/* Security Banner & Quick Demo Loaders */}
      <DemoBanner onLoadDemo={handleLoadDemo} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-10">
        
        {/* Upload Zone */}
        <FileUpload
          platform={platform}
          onPlatformChange={setPlatform}
          onFileUpload={handleFileUpload}
          onLoadDemo={handleLoadDemo}
        />

        {/* Dashboard Results (Only shown when orders are parsed/loaded) */}
        {orders.length > 0 && (
          <div className="animate-fade-in space-y-8">
            
            {/* Feature Modular Tab Navigation */}
            <TabNavigation
              activeTab={activeMainTab}
              onTabChange={setActiveMainTab}
              currentLang={currentLang}
              onOpenShippingModal={() => setShowShippingModal(true)}
            />

            {/* TAB 1: EXECUTIVE FINANCIAL AUDIT DASHBOARD */}
            {activeMainTab === 'financial' && (
              <ExecutiveDashboard
                summary={summary}
                orders={orders}
                packagingCost={settings.packagingCost}
                feeThreshold={settings.feeThreshold}
                onPackagingCostChange={handlePackagingCostChange}
                onFeeThresholdChange={handleFeeThresholdChange}
                onOpenCogsModal={() => setShowCogsModal(true)}
                onExportExcel={handleExportExcel}
                onOpenShippingModal={() => setShowShippingModal(true)}
                platform={platform}
                currentLang={currentLang}
              />
            )}

            {/* TAB 2: AD ROAS & CIR PERFORMANCE */}
            {activeMainTab === 'ads' && (
              <AdPerformanceTable orders={orders} currentLang={currentLang} />
            )}

            {/* TAB 3: GROWTH COMPARISON & ANOMALY TABLES */}
            {activeMainTab === 'growth' && (
              <div className="space-y-8">
                <GrowthComparison summary={summary} />
                <div className="space-y-4">
                  <div className="flex justify-end">
                    <button
                      onClick={() => setShowDisputeModal(true)}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-orange-500 text-white font-bold text-xs shadow-lg shadow-rose-500/20 hover:scale-105 transition-all"
                    >
                      <span>Tự Động Lập Hồ Sơ Kháng Nại CSKH Sàn 🚀</span>
                    </button>
                  </div>

                  <AnomalyTables
                    orders={orders}
                    summary={summary}
                    feeThreshold={settings.feeThreshold}
                    onExportExcel={handleExportExcel}
                  />
                </div>
              </div>
            )}

            {/* TAB 4: LOW-STOCK RED ALERT */}
            {activeMainTab === 'inventory' && (
              <LowStockAlert
                skus={extractedSkus}
                user={user}
                onUpdateThreshold={handleUpdateThreshold}
                onOpenUpgradeModal={() => setShowPricingModal(true)}
                currentLang={currentLang}
              />
            )}

          </div>
        )}

      </main>

      {/* Floating Support Widget (Zalo, FB, WhatsApp, Telegram) */}
      <ContactWidget />

      {/* Modals */}
      {showCogsModal && (
        <CogsModal
          skus={extractedSkus}
          onConfirm={handleConfirmCOGS}
          onClose={() => setShowCogsModal(false)}
        />
      )}

      {showShippingModal && (
        <ShippingExportModal
          orders={orders}
          user={user}
          onClose={() => setShowShippingModal(false)}
          onOpenUpgradeModal={() => {
            setShowShippingModal(false);
            setShowPricingModal(true);
          }}
        />
      )}

      {showDisputeModal && (
        <DisputeClaimModal
          orders={orders}
          onClose={() => setShowDisputeModal(false)}
        />
      )}

      {showPricingModal && (
        <PricingModal
          user={user}
          onClose={() => setShowPricingModal(false)}
          onConfirmUpgrade={handleConfirmUpgrade}
        />
      )}

      {showAuthModal && (
        <AuthModal
          user={user}
          onClose={() => setShowAuthModal(false)}
          onLoginSuccess={handleLoginSuccess}
        />
      )}

      {showAdminDashboard && (
        <AdminDashboard
          onClose={() => setShowAdminDashboard(false)}
        />
      )}

      {showTermsModal && (
        <TermsModal
          onClose={() => setShowTermsModal(false)}
        />
      )}

      {/* Footer */}
      <Footer />

    </div>
  );
}
