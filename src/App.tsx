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
import { ApiIntegrationModal } from './components/ApiIntegrationModal';
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

import { Sidebar, ModuleType } from './components/Sidebar';
import { ProfitCalculatorModule } from './components/ProfitCalculatorModule';
import { ExcelTransformerModule } from './components/ExcelTransformerModule';
import { SkuSettingsModule } from './components/SkuSettingsModule';
import { parseOAuthRedirectHash } from './utils/oauthHandler';
import { submitUpgradeRequest, checkEmailProRecord } from './utils/upgradeTracker';

import { getActiveDataset, saveDataset, switchPlatform as switchPlatformDataset, switchSource as switchSourceDataset, switchActiveShop } from './services/datasetManager';
import { ActiveDataset } from './types/dataset';

export function App() {
  const [user, setUser] = useState<UserState>(getUserState());
  const [currentLang, setCurrentLang] = useState<Language>(getInitialLanguage());
  
  // Active Dataset State Machine
  const [activeDataset, setActiveDataset] = useState<ActiveDataset>(() => getActiveDataset());
  const [platform, setPlatform] = useState<PlatformType>(() => activeDataset.platform);
  const [orders, setOrders] = useState<OrderItem[]>(() => activeDataset.orders);
  const [extractedSkus, setExtractedSkus] = useState<SKUData[]>([]);

  // Active Navigation Module State ('calc' | 'transformer' | 'inventory' | 'settings')
  const [activeModule, setActiveModule] = useState<ModuleType>('calc');

  // Data Source Provenance Tracking ('DEMO' | 'EXCEL' | 'API')
  const [dataSourceMode, setDataSourceMode] = useState<'DEMO' | 'EXCEL' | 'API'>(() => activeDataset.source);
  const [dataSourceName, setDataSourceName] = useState<string>(() => activeDataset.fileName || `Dữ Liệu Mẫu ${activeDataset.platform.toUpperCase()}`);

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
  const [showApiIntegrationModal, setShowApiIntegrationModal] = useState(false);

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

  // Platform Switcher Handler (Ensures Active Dataset sync)
  const handlePlatformSwitch = (targetPlatform: PlatformType) => {
    const switchedDataset = switchPlatformDataset(targetPlatform);
    setActiveDataset(switchedDataset);
    setPlatform(switchedDataset.platform);
    setOrders(switchedDataset.orders);
    setDataSourceMode(switchedDataset.source);
    setDataSourceName(
      switchedDataset.shopName
        ? `API · ${switchedDataset.shopName}`
        : switchedDataset.fileName || `Dữ Liệu Mẫu ${switchedDataset.platform.toUpperCase()}`
    );
    setExtractedSkus(extractSkus(switchedDataset.orders));
  };

  // Shop Switcher Handler for Multi-Shop Support
  const handleShopSwitch = (shopId: string) => {
    const switchedDataset = switchActiveShop(platform, shopId);
    setActiveDataset(switchedDataset);
    setOrders(switchedDataset.orders);
    setDataSourceMode('API');
    setDataSourceName(switchedDataset.shopName ? `API · ${switchedDataset.shopName}` : `Shop ID: ${shopId}`);
    setExtractedSkus(extractSkus(switchedDataset.orders));
  };

  // 1. Handle File Upload
  const handleFileUpload = async (file: File) => {
    try {
      const res = await parseUploadedFile(
        file,
        platform,
        settings.packagingCost,
        settings.feeThreshold
      );

      const { orders: parsed, detectedPlatform, isPlatformMismatch } = res;

      if (isPlatformMismatch) {
        setPlatform(detectedPlatform);
        alert(`⚡ PHÁT HIỆN ĐỊNH DẠNG FILE BÁO CÁO SÀN ${detectedPlatform.toUpperCase()}!\n\nHệ thống đã tự động chuyển đổi gian hàng sang ${detectedPlatform === 'shopee' ? '🟧 Shopee Mall' : '⬛ TikTok Shop'} để bóc tách chính xác tỷ lệ phí sàn & thuế 1.5%.`);
      }

      const newDataset: ActiveDataset = {
        datasetId: `FILE_${detectedPlatform.toUpperCase()}`,
        platform: detectedPlatform,
        source: 'EXCEL',
        environment: 'PRODUCTION',
        status: 'SYNCED',
        lastSyncedAt: new Date().toISOString(),
        recordCount: parsed.length,
        fileName: file.name,
        orders: parsed,
      };

      saveDataset(newDataset);
      setActiveDataset(newDataset);
      setOrders(parsed);
      setDataSourceMode('EXCEL');
      setDataSourceName(file.name);

      const skus = extractSkus(parsed);
      setExtractedSkus(skus);
      
      setShowCogsModal(true);

      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });

      const fileSummary = calculateSummary(parsed, settings.packagingCost, settings.feeThreshold);
      saveAuditHistorySnapshot(file.name, detectedPlatform, fileSummary);
      trackEventSilent({
        eventName: 'upload_report',
        platform: detectedPlatform,
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
    const cloned = JSON.parse(JSON.stringify(demoData)) as OrderItem[];

    const newDataset: ActiveDataset = {
      datasetId: `DEMO_${targetPlatform.toUpperCase()}`,
      platform: targetPlatform,
      source: 'DEMO',
      environment: 'SANDBOX',
      status: 'SYNCED',
      lastSyncedAt: new Date().toISOString(),
      recordCount: cloned.length,
      fileName: `Dữ Liệu Mẫu ${targetPlatform.toUpperCase()}`,
      orders: cloned,
    };

    saveDataset(newDataset);
    setActiveDataset(newDataset);
    setOrders(cloned);
    setDataSourceMode('DEMO');
    setDataSourceName(`Dữ Liệu Mẫu ${targetPlatform.toUpperCase()}`);

    const skus = extractSkus(cloned);
    setExtractedSkus(skus);

    confetti({
      particleCount: 60,
      spread: 60,
      origin: { y: 0.6 },
    });

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
      lastTokenReset: user.lastTokenReset || new Date().toISOString(),
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

  // Auto-load initial demo data if orders list is empty
  useEffect(() => {
    if (orders.length === 0) {
      handleLoadDemo('shopee');
    }
  }, []);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#0a0d14] text-white selection:bg-emerald-500 selection:text-navy-950 font-sans relative">
      
      {/* 1. SIDEBAR TRÁI - Cố định không cuộn */}
      <Sidebar
        activeModule={activeModule}
        onSelectModule={setActiveModule}
        user={user}
        currentLang={currentLang}
        onLanguageChange={handleLanguageChange}
        onOpenAuth={() => setShowAuthModal(true)}
        onOpenUpgradeModal={() => setShowPricingModal(true)}
        onOpenTerms={() => setShowTermsModal(true)}
        onOpenApiIntegration={() => setShowApiIntegrationModal(true)}
        onLogout={handleLogout}
      />

      {/* 2. KHU VỰC NỘI DUNG CHÍNH - Tự động cuộn dọc khi dài */}
      <main className="flex-1 h-full overflow-y-auto flex flex-col justify-between bg-[#0a0d14]">
        
        {/* CONTAINER CHỨA UI CỦA TỪNG TAB */}
        <div className="p-6 lg:p-8 flex-1 w-full max-w-7xl mx-auto space-y-8">
          {/* Mobile Smartphone Optimization Banner */}
          <MobileNotice />

          {/* Security Client-Side Banner */}
          <DemoBanner />

          {/* MODULE 1: TÍNH LỢI NHUẬN & THUẾ (/calculator) */}
          {(activeModule === 'calc' || activeModule === '/calculator') && (
            <ProfitCalculatorModule
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
              onPlatformChange={handlePlatformSwitch}
              onFileUpload={handleFileUpload}
              onLoadDemo={handleLoadDemo}
              onOpenApiIntegration={() => setShowApiIntegrationModal(true)}
              dataSourceMode={dataSourceMode}
              dataSourceName={dataSourceName}
              currentLang={currentLang}
            />
          )}

          {/* MODULE 2: XỬ LÝ FILE VẬN CHUYỂN (/excel-transformer) */}
          {(activeModule === 'transformer' || activeModule === '/excel-transformer') && (
            <ExcelTransformerModule
              platform={platform}
              onPlatformChange={setPlatform}
              onFileUpload={handleFileUpload}
              orders={orders}
              onOpenShippingModal={() => setShowShippingModal(true)}
            />
          )}

          {/* MODULE 3: CẢNH BÁO TỒN KHO (/inventory-alert) */}
          {(activeModule === 'inventory' || activeModule === '/inventory-alert') && (
            <LowStockAlert
              skus={extractedSkus}
              user={user}
              onUpdateThreshold={handleUpdateThreshold}
              onOpenUpgradeModal={() => setShowPricingModal(true)}
              currentLang={currentLang}
              onOrdersUpdated={() => {
                const current = getActiveDataset();
                setOrders(current.orders || []);
              }}
            />
          )}

          {/* MODULE 4: CẤU HÌNH & BẢNG GIÁ VỐN (/sku-settings) */}
          {(activeModule === 'settings' || activeModule === '/sku-settings') && (
            <SkuSettingsModule
              packagingCost={settings.packagingCost}
              feeThreshold={settings.feeThreshold}
              onPackagingCostChange={handlePackagingCostChange}
              onFeeThresholdChange={handleFeeThresholdChange}
              onOpenCogsModal={() => setShowCogsModal(true)}
            />
          )}

        </div>

        {/* FOOTER DASHBOARD CỐ ĐỊNH Ở ĐÁY MÀN HÌNH NỘI DUNG */}
        <footer className="w-full border-t border-slate-800/80 bg-[#07090e] p-8 mt-auto">
          <Footer />
        </footer>
      </main>

      {/* MODAL DIALOGS */}
      {showCogsModal && (
        <CogsModal
          skus={extractedSkus}
          onClose={() => setShowCogsModal(false)}
          onConfirm={handleConfirmCOGS}
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

      {showApiIntegrationModal && (
        <ApiIntegrationModal
          onClose={() => setShowApiIntegrationModal(false)}
          onSyncSuccess={(apiOrders) => {
            const freshDataset = getActiveDataset();
            setActiveDataset(freshDataset);
            setPlatform(freshDataset.platform);
            setOrders(apiOrders);
            setDataSourceMode('API');
            setDataSourceName(freshDataset.shopName ? `API · ${freshDataset.shopName}` : 'Direct API Connection');
            setExtractedSkus(extractSkus(apiOrders));
            setShowApiIntegrationModal(false);
          }}
        />
      )}

    </div>
  );
}
