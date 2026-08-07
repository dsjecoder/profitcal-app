import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Navbar } from './components/Navbar';
import { DemoBanner } from './components/DemoBanner';
import { FileUpload } from './components/FileUpload';
import { CogsModal } from './components/CogsModal';
import { ExecutiveDashboard } from './components/ExecutiveDashboard';
import { AnomalyTables } from './components/AnomalyTables';
import { UpgradeModal } from './components/UpgradeModal';
import { AuthModal } from './components/AuthModal';
import { Footer } from './components/Footer';

import { OrderItem, PlatformType, SKUData, UserState } from './types';
import {
  getUserState,
  saveUserState,
  deductToken,
  getAppSettings,
  saveAppSettings,
  getSavedCOGS,
  saveCOGS,
} from './utils/storage';
import { SAMPLE_SHOPEE_ORDERS, SAMPLE_TIKTOK_ORDERS, calculateSummary } from './utils/mockData';
import { parseUploadedFile } from './utils/parser';
import { exportAuditedExcel } from './utils/export';
import { trackEventSilent } from './utils/analytics';

export function App() {
  const [user, setUser] = useState<UserState>(getUserState());
  const [platform, setPlatform] = useState<PlatformType>('shopee');
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [extractedSkus, setExtractedSkus] = useState<SKUData[]>([]);

  // Settings
  const [settings, setSettings] = useState(getAppSettings());

  // Modals
  const [showCogsModal, setShowCogsModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Auto-recalculate summary whenever orders, packagingCost, or feeThreshold change
  const summary = calculateSummary(orders, settings.packagingCost, settings.feeThreshold);

  // Helper to extract distinct SKUs from order list
  const extractSkus = (orderList: OrderItem[]): SKUData[] => {
    const map = new Map<string, SKUData>();
    const savedCOGS = getSavedCOGS();

    orderList.forEach((o) => {
      if (!map.has(o.sku)) {
        map.set(o.sku, {
          sku: o.sku,
          productName: o.productName,
          cogs: savedCOGS[o.sku] !== undefined ? savedCOGS[o.sku] : Math.round((o.grossRevenue / o.quantity) * 0.45),
          quantitySold: o.quantity,
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

      // Track Silent Analytics
      const fileSummary = calculateSummary(parsed, settings.packagingCost, settings.feeThreshold);
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
      const netProfit = o.netSettlement - totalCogs - settings.packagingCost;

      return {
        ...o,
        cogs: totalCogs,
        netProfit,
        isNegativeProfit: netProfit < 0,
      };
    });

    setOrders(updatedOrders);
    setShowCogsModal(false);
  };

  // 4. Settings Adjusters
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

  // 5. Export Excel Report
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

  // 6. Dev Mode Switcher (Free <-> Pro)
  const handleToggleTier = () => {
    const updated: UserState = {
      ...user,
      tier: user.tier === 'free' ? 'pro' : 'free',
      tokens: user.tier === 'free' ? 999 : 2,
    };
    saveUserState(updated);
    setUser(updated);
  };

  // 7. Login Success
  const handleLoginSuccess = (email: string, name: string) => {
    const updated: UserState = {
      ...user,
      isLoggedIn: true,
      email,
      name,
    };
    saveUserState(updated);
    setUser(updated);
    setShowAuthModal(false);
  };

  // 8. Confirm Pro Upgrade
  const handleConfirmUpgrade = () => {
    const updated: UserState = {
      ...user,
      tier: 'pro',
      tokens: 999,
    };
    saveUserState(updated);
    setUser(updated);
    setShowUpgradeModal(false);

    confetti({
      particleCount: 150,
      spread: 90,
      origin: { y: 0.5 },
    });
  };

  return (
    <div className="min-h-screen bg-navy-950 text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-navy-950 font-sans">
      
      {/* Header & Navigation */}
      <Navbar
        user={user}
        onOpenAuth={() => setShowAuthModal(true)}
        onOpenUpgrade={() => setShowUpgradeModal(true)}
        onToggleTier={handleToggleTier}
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
          user={user}
          onOpenUpgrade={() => setShowUpgradeModal(true)}
        />

        {/* Dashboard Results (Only shown when orders are parsed/loaded) */}
        {orders.length > 0 && (
          <div className="animate-fade-in space-y-12">
            
            {/* Executive Dashboard & KPI Cards */}
            <ExecutiveDashboard
              summary={summary}
              orders={orders}
              packagingCost={settings.packagingCost}
              feeThreshold={settings.feeThreshold}
              onPackagingCostChange={handlePackagingCostChange}
              onFeeThresholdChange={handleFeeThresholdChange}
              onOpenCogsModal={() => setShowCogsModal(true)}
              onExportExcel={handleExportExcel}
              platform={platform}
            />

            {/* Anomalies & Loss Detection Engine Tables */}
            <AnomalyTables
              orders={orders}
              summary={summary}
              feeThreshold={settings.feeThreshold}
              onExportExcel={handleExportExcel}
            />

          </div>
        )}

      </main>

      {/* Modals */}
      {showCogsModal && (
        <CogsModal
          skus={extractedSkus}
          onConfirm={handleConfirmCOGS}
          onClose={() => setShowCogsModal(false)}
        />
      )}

      {showUpgradeModal && (
        <UpgradeModal
          user={user}
          onClose={() => setShowUpgradeModal(false)}
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

      {/* Footer */}
      <Footer />

    </div>
  );
}
