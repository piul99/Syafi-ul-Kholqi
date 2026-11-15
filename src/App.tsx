/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { TabType, PortfolioItem, LogoTier, SingleService } from './types';
import { PORTFOLIO_ITEMS } from './data/portfolioData';
import { LOGO_TIERS, SINGLE_SERVICES } from './data/servicesData';
import { TopHeader } from './components/TopHeader';
import { BottomNav } from './components/BottomNav';
import { WorkView } from './components/WorkView';
import { ServicesView } from './components/ServicesView';
import { OrderView } from './components/OrderView';
import { SpreadsheetMenuModal } from './components/SpreadsheetMenuModal';
import { normalizeImageUrl } from './utils/imageUrlHelper';
import {
  DEFAULT_SPREADSHEET_KEY,
  getCmsServerConfig,
  saveCmsServerConfig,
  fetchPublicOrAuthSheetData,
} from './services/sheetsService';

const LOCAL_PORTFOLIO_CACHE = 'piulistrator_cached_portfolio';
const LOCAL_SERVICES_CACHE = 'piulistrator_cached_services';
const LOCAL_PROFILE_PHOTO_CACHE = 'piulistrator_cached_profile_photo';
const LOCAL_HEADING_LOGO_CACHE = 'piulistrator_cached_heading_logo';

const DEFAULT_PROFILE_PHOTO =
  'https://lh3.googleusercontent.com/a/ACg8ocKpq8olx-Ng7YTnZ81M_Zw3gzwHIl61bGJMYPtTsj2yqzn9iNdD=s96-c';

// Initial CMS config injected by server into HTML (for 0ms instant mobile hydration)
const initialConfig = (typeof window !== 'undefined' && (window as any).__INITIAL_CMS_CONFIG__) || null;

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('work');
  const [selectedCategoryForOrder, setSelectedCategoryForOrder] = useState<string>(
    'Paket Logo Gold (Rp200.000)'
  );
  const [isSpreadsheetModalOpen, setIsSpreadsheetModalOpen] = useState<boolean>(false);
  const [isAutoSyncing, setIsAutoSyncing] = useState<boolean>(false);
  const [activeSpreadsheetId, setActiveSpreadsheetId] = useState<string>(() => {
    if (initialConfig?.spreadsheetId) return initialConfig.spreadsheetId;
    try {
      return localStorage.getItem(DEFAULT_SPREADSHEET_KEY) || '';
    } catch {
      return '';
    }
  });

  // Dynamic profile photo
  const [profilePhoto, setProfilePhoto] = useState<string>(() => {
    if (initialConfig?.profilePhoto) return normalizeImageUrl(initialConfig.profilePhoto);
    try {
      const cached = localStorage.getItem(LOCAL_PROFILE_PHOTO_CACHE);
      if (cached) return normalizeImageUrl(cached);
    } catch {
      // Fallback
    }
    return DEFAULT_PROFILE_PHOTO;
  });

  // Dynamic heading logo (Navbar top logo)
  const [headingLogo, setHeadingLogo] = useState<string>(() => {
    if (initialConfig?.headingLogo) return normalizeImageUrl(initialConfig.headingLogo);
    try {
      const cached = localStorage.getItem(LOCAL_HEADING_LOGO_CACHE);
      if (cached) return normalizeImageUrl(cached);
    } catch {
      // Fallback
    }
    return '/piulistrator-logo.jpg';
  });

  // Dynamic portfolio items (from Google Sheets or fallback)
  const [portfolioList, setPortfolioList] = useState<PortfolioItem[]>(() => {
    if (initialConfig?.portfolioList && Array.isArray(initialConfig.portfolioList) && initialConfig.portfolioList.length > 0) {
      return initialConfig.portfolioList.map((item: PortfolioItem) => ({
        ...item,
        imageUrl: normalizeImageUrl(item.imageUrl),
        hiResImageUrl: normalizeImageUrl(item.hiResImageUrl || item.imageUrl),
      }));
    }
    try {
      const cached = localStorage.getItem(LOCAL_PORTFOLIO_CACHE);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((item: PortfolioItem) => ({
            ...item,
            imageUrl: normalizeImageUrl(item.imageUrl),
            hiResImageUrl: normalizeImageUrl(item.hiResImageUrl || item.imageUrl),
          }));
        }
      }
    } catch {
      // Fallback
    }
    return PORTFOLIO_ITEMS;
  });

  // Dynamic services data (from Google Sheets or fallback)
  const [servicesData, setServicesData] = useState<{
    tiers: LogoTier[];
    singles: SingleService[];
  }>(() => {
    if (initialConfig?.servicesData && initialConfig.servicesData.tiers?.length > 0) {
      return initialConfig.servicesData;
    }
    try {
      const cached = localStorage.getItem(LOCAL_SERVICES_CACHE);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.tiers && parsed.singles) return parsed;
      }
    } catch {
      // Fallback
    }
    return { tiers: LOGO_TIERS, singles: SINGLE_SERVICES };
  });

  // Auto-sync function that pulls fresh data from connected spreadsheet
  const syncFromSheet = useCallback(
    async (sheetId: string) => {
      if (!sheetId) return;
      try {
        setIsAutoSyncing(true);
        const fresh = await fetchPublicOrAuthSheetData(sheetId, null);

        let hasNewPortfolio = false;
        let finalPortfolio = portfolioList;

        if (fresh.portfolio && fresh.portfolio.length > 0) {
          const normalized = fresh.portfolio.map((item) => ({
            ...item,
            imageUrl: normalizeImageUrl(item.imageUrl),
            hiResImageUrl: normalizeImageUrl(item.hiResImageUrl || item.imageUrl),
          }));
          setPortfolioList(normalized);
          finalPortfolio = normalized;
          hasNewPortfolio = true;
          try {
            localStorage.setItem(LOCAL_PORTFOLIO_CACHE, JSON.stringify(normalized));
          } catch {
            // Ignore
          }
        }

        let hasNewServices = false;
        let finalServices = servicesData;

        if (fresh.services && fresh.services.tiers && fresh.services.tiers.length > 0) {
          setServicesData(fresh.services);
          finalServices = fresh.services;
          hasNewServices = true;
          try {
            localStorage.setItem(LOCAL_SERVICES_CACHE, JSON.stringify(fresh.services));
          } catch {
            // Ignore
          }
        }

        let hasNewHeadingLogo = false;
        if (fresh.settings?.headingLogo) {
          const norm = normalizeImageUrl(fresh.settings.headingLogo);
          setHeadingLogo(norm);
          hasNewHeadingLogo = true;
          try {
            localStorage.setItem(LOCAL_HEADING_LOGO_CACHE, norm);
          } catch {}
        }

        let hasNewProfilePhoto = false;
        if (fresh.settings?.profilePhoto) {
          const norm = normalizeImageUrl(fresh.settings.profilePhoto);
          setProfilePhoto(norm);
          hasNewProfilePhoto = true;
          try {
            localStorage.setItem(LOCAL_PROFILE_PHOTO_CACHE, norm);
          } catch {}
        }

        if (hasNewPortfolio || hasNewServices || hasNewHeadingLogo || hasNewProfilePhoto) {
          // Keep server configuration in sync so other devices get it immediately
          saveCmsServerConfig({
            spreadsheetId: sheetId,
            portfolioList: finalPortfolio,
            servicesData: finalServices,
            headingLogo: fresh.settings?.headingLogo || headingLogo,
            profilePhoto: fresh.settings?.profilePhoto || profilePhoto,
          }).catch(() => {});
        }
      } catch (err) {
        console.warn('Auto-sync from sheet error:', err);
      } finally {
        setIsAutoSyncing(false);
      }
    },
    [portfolioList, servicesData]
  );

  // Initialize and auto-sync on component mount (critical for mobile/HP)
  useEffect(() => {
    let isCancelled = false;

    async function initApp() {
      // 1. Fetch server state (enables HP to load what was setup on desktop/PC)
      let targetSheetId = localStorage.getItem(DEFAULT_SPREADSHEET_KEY) || '';

      try {
        const serverState = await getCmsServerConfig();
        if (serverState && !isCancelled) {
          if (serverState.spreadsheetId) {
            targetSheetId = serverState.spreadsheetId;
            setActiveSpreadsheetId(serverState.spreadsheetId);
            try {
              localStorage.setItem(DEFAULT_SPREADSHEET_KEY, serverState.spreadsheetId);
            } catch {
              // Ignore
            }
          }

          if (serverState.headingLogo) {
            setHeadingLogo(normalizeImageUrl(serverState.headingLogo));
            try {
              localStorage.setItem(LOCAL_HEADING_LOGO_CACHE, serverState.headingLogo);
            } catch {
              // Ignore
            }
          }

          if (serverState.profilePhoto) {
            setProfilePhoto(normalizeImageUrl(serverState.profilePhoto));
            try {
              localStorage.setItem(LOCAL_PROFILE_PHOTO_CACHE, serverState.profilePhoto);
            } catch {
              // Ignore
            }
          }

          if (serverState.portfolioList && serverState.portfolioList.length > 0) {
            const normalized = serverState.portfolioList.map((item: PortfolioItem) => ({
              ...item,
              imageUrl: normalizeImageUrl(item.imageUrl),
              hiResImageUrl: normalizeImageUrl(item.hiResImageUrl || item.imageUrl),
            }));
            setPortfolioList(normalized);
            try {
              localStorage.setItem(LOCAL_PORTFOLIO_CACHE, JSON.stringify(normalized));
            } catch {
              // Ignore
            }
          }

          if (serverState.servicesData && serverState.servicesData.tiers?.length > 0) {
            setServicesData(serverState.servicesData);
            try {
              localStorage.setItem(LOCAL_SERVICES_CACHE, JSON.stringify(serverState.servicesData));
            } catch {
              // Ignore
            }
          }
        }
      } catch (err) {
        console.warn('Could not fetch server CMS state:', err);
      }

      // 2. If we have a connected spreadsheetId, auto-pull latest Google Sheets data in background!
      if (targetSheetId && !isCancelled) {
        syncFromSheet(targetSheetId);
      }
    }

    initApp();

    return () => {
      isCancelled = true;
    };
  }, []); // Run once on initial mount

  const isCustomLoaded =
    portfolioList !== PORTFOLIO_ITEMS ||
    servicesData.tiers !== LOGO_TIERS ||
    servicesData.singles !== SINGLE_SERVICES;

  const handleUpdatePortfolio = (newItems: PortfolioItem[]) => {
    const normalized = newItems.map((item) => ({
      ...item,
      imageUrl: normalizeImageUrl(item.imageUrl),
      hiResImageUrl: normalizeImageUrl(item.hiResImageUrl || item.imageUrl),
    }));
    setPortfolioList(normalized);
    try {
      localStorage.setItem(LOCAL_PORTFOLIO_CACHE, JSON.stringify(normalized));
    } catch {
      // Ignore storage error
    }

    // Persist to server
    saveCmsServerConfig({
      spreadsheetId: activeSpreadsheetId,
      portfolioList: normalized,
    }).catch(() => {});
  };

  const handleUpdateProfilePhoto = (newPhotoUrl: string) => {
    const cleanUrl = normalizeImageUrl(newPhotoUrl);
    setProfilePhoto(cleanUrl);
    try {
      localStorage.setItem(LOCAL_PROFILE_PHOTO_CACHE, cleanUrl);
    } catch {
      // Ignore storage error
    }

    // Persist to server
    saveCmsServerConfig({
      spreadsheetId: activeSpreadsheetId,
      profilePhoto: cleanUrl,
    }).catch(() => {});
  };

  const handleUpdateHeadingLogo = (newLogoUrl: string) => {
    const cleanUrl = newLogoUrl ? normalizeImageUrl(newLogoUrl) : '';
    setHeadingLogo(cleanUrl);
    try {
      if (cleanUrl) {
        localStorage.setItem(LOCAL_HEADING_LOGO_CACHE, cleanUrl);
      } else {
        localStorage.removeItem(LOCAL_HEADING_LOGO_CACHE);
      }
    } catch {
      // Ignore storage error
    }

    // Persist to server
    saveCmsServerConfig({
      spreadsheetId: activeSpreadsheetId,
      headingLogo: cleanUrl,
    }).catch(() => {});
  };

  const handleUpdateServices = (data: { tiers: LogoTier[]; singles: SingleService[] }) => {
    setServicesData(data);
    try {
      localStorage.setItem(LOCAL_SERVICES_CACHE, JSON.stringify(data));
    } catch {
      // Ignore storage error
    }

    // Persist to server
    saveCmsServerConfig({
      spreadsheetId: activeSpreadsheetId,
      servicesData: data,
    }).catch(() => {});
  };

  const handleManualRefresh = () => {
    if (activeSpreadsheetId) {
      syncFromSheet(activeSpreadsheetId);
    }
  };

  const handleNavigateTab = (tab: TabType, categoryToSelect?: string) => {
    if (categoryToSelect) {
      setSelectedCategoryForOrder(categoryToSelect);
    }
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectPackageFromServices = (categoryValue: string) => {
    setSelectedCategoryForOrder(categoryValue);
    setActiveTab('order');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#faf8ff] text-[#131b2e] font-['Plus_Jakarta_Sans',sans-serif] relative overflow-x-hidden antialiased flex flex-col items-center">
      {/* Ambient Ethereal Glow Background Layer */}
      <div
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
      >
        <div className="absolute -top-24 -left-20 w-80 h-80 rounded-full bg-[#e2dfff] opacity-70 blur-3xl animate-orb-1"></div>
        <div className="absolute top-72 -right-24 w-72 h-72 rounded-full bg-[#acedff] opacity-50 blur-3xl animate-orb-2"></div>
        <div className="absolute top-[520px] left-8 w-80 h-80 rounded-full bg-[#e2e7ff] opacity-80 blur-3xl"></div>
        <div className="absolute bottom-28 right-4 w-60 h-60 rounded-full bg-[#6ffbbe] opacity-35 blur-3xl"></div>
        <div className="absolute inset-0 bg-[radial-gradient(rgba(79,70,229,0.035)_1px,transparent_1px)] [background-size:20px_20px] opacity-70"></div>
      </div>

      {/* Centered Mobile-First Frame Container (Max 420px for pixel-perfect design) */}
      <div className="w-full max-w-[420px] relative z-10 flex flex-col min-h-screen shadow-2xl shadow-indigo-950/5 bg-[#faf8ff]/85 backdrop-blur-xs">
        {/* Top Header App Bar */}
        <TopHeader
          activeTab={activeTab}
          profilePhotoUrl={profilePhoto}
          onOpenSpreadsheetMenu={() => setIsSpreadsheetModalOpen(true)}
          isSyncing={isAutoSyncing}
          onRefreshClick={activeSpreadsheetId ? handleManualRefresh : undefined}
        />

        {/* Main Content Area based on Active Tab */}
        <main className="px-4 pt-3 flex-1 pb-28">
          {activeTab === 'work' && (
            <WorkView
              onNavigateTab={handleNavigateTab}
              items={portfolioList}
              onOpenSpreadsheetMenu={() => setIsSpreadsheetModalOpen(true)}
              isCustomLoaded={isCustomLoaded}
            />
          )}

          {activeTab === 'services' && (
            <ServicesView
              onSelectPackage={handleSelectPackageFromServices}
              onNavigateTab={handleNavigateTab}
              tiers={servicesData.tiers}
              singles={servicesData.singles}
              onOpenSpreadsheetMenu={() => setIsSpreadsheetModalOpen(true)}
              isCustomLoaded={isCustomLoaded}
            />
          )}

          {activeTab === 'order' && (
            <OrderView initialCategory={selectedCategoryForOrder} />
          )}
        </main>

        {/* Google Sheets CMS Menu Modal */}
        <SpreadsheetMenuModal
          isOpen={isSpreadsheetModalOpen}
          onClose={() => setIsSpreadsheetModalOpen(false)}
          onUpdatePortfolio={handleUpdatePortfolio}
          onUpdateServices={handleUpdateServices}
          profilePhotoUrl={profilePhoto}
          onUpdateProfilePhoto={handleUpdateProfilePhoto}
          headingLogoUrl={headingLogo}
          onUpdateHeadingLogo={handleUpdateHeadingLogo}
          currentPortfolioCount={portfolioList.length}
          currentServicesCount={servicesData.tiers.length + servicesData.singles.length}
        />
      </div>

      {/* Floating Bottom Navigation Bar */}
      <BottomNav activeTab={activeTab} onChangeTab={handleNavigateTab} />
    </div>
  );
}
