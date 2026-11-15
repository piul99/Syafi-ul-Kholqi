import React, { useState, useEffect, useRef } from 'react';
import { User } from 'firebase/auth';
import {
  googleSignIn,
  googleSignOut,
  getAccessToken,
  initAuth,
} from '../services/googleAuth';
import {
  DEFAULT_SPREADSHEET_KEY,
  extractSpreadsheetId,
  readSheetRange,
  createTemplateSpreadsheet,
  appendPortfolioRow,
  appendServiceRow,
  parsePortfolioRows,
  parseServicesRows,
  fetchPublicOrAuthSheetData,
  getCmsServerConfig,
  saveCmsServerConfig,
  uploadImageToGoogleDrive,
} from '../services/sheetsService';
import { PortfolioItem, LogoTier, SingleService } from '../types';
import {
  normalizeImageUrl,
  inspectImageUrl,
  getDriveThumbnailUrl,
  FALLBACK_PORTFOLIO_IMAGE,
} from '../utils/imageUrlHelper';
import { SmartImage } from './SmartImage';

const AUTHORIZED_ADMIN_EMAILS = ['sykholqi@gmail.com'];
const DEFAULT_ADMIN_PIN = '1650';
const DEFAULT_STUDIO_PHOTO =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCxqQ-ucN89fxi5enfUfAbocuKUJ3zy0SVofUCngWraRtGgi8zEDPqy3okNfJMzrtclj7EV9gCyH4adTUVDa2Rpi1BuaPyKeTbNWC3O2mEwZvP1eAMy0BVuCsyXsqIZYq4hYrQYtWc74x9i_MY_l8hkiPMDNZNGC29OoKmmwB0d-SXz65x-ERv_VYlrCO8GRWaO_bqphw5ijBjA6cQ0XkhALO6YWwtJFiHz0Qj4s4EeKd1uYCLBII0f';

interface SpreadsheetMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdatePortfolio: (items: PortfolioItem[]) => void;
  onUpdateServices: (data: { tiers: LogoTier[]; singles: SingleService[] }) => void;
  profilePhotoUrl: string;
  onUpdateProfilePhoto: (newUrl: string) => void;
  headingLogoUrl?: string;
  onUpdateHeadingLogo?: (newUrl: string) => void;
  currentPortfolioCount: number;
  currentServicesCount: number;
}

export const SpreadsheetMenuModal: React.FC<SpreadsheetMenuModalProps> = ({
  isOpen,
  onClose,
  onUpdatePortfolio,
  onUpdateServices,
  profilePhotoUrl,
  onUpdateProfilePhoto,
  headingLogoUrl = '',
  onUpdateHeadingLogo,
  currentPortfolioCount,
  currentServicesCount,
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [spreadsheetInput, setSpreadsheetInput] = useState<string>('');
  const [activeSubTab, setActiveSubTab] = useState<
    'connect' | 'profile_photo' | 'add_portfolio' | 'add_service' | 'guide'
  >('connect');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);
  const [createdSheetUrl, setCreatedSheetUrl] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  // Security and Admin Gatekeeper state
  const [isAdminUnlocked, setIsAdminUnlocked] = useState<boolean>(() => {
    return sessionStorage.getItem('piulistrator_admin_unlocked') === 'true';
  });
  const [enteredPin, setEnteredPin] = useState<string>('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [showPinTab, setShowPinTab] = useState<boolean>(false);
  const [isUnauthorizedEmail, setIsUnauthorizedEmail] = useState<string | null>(null);

  // Branding & Photos form state
  const [photoInputUrl, setPhotoInputUrl] = useState<string>(profilePhotoUrl);
  const [logoInputUrl, setLogoInputUrl] = useState<string>(headingLogoUrl || '');

  // Custom PIN in settings
  const [customPinInput, setCustomPinInput] = useState<string>('');

  // Form states for quick add portfolio & service
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Logo');
  const [newClient, setNewClient] = useState('');
  const [newYear, setNewYear] = useState<string>(() => new Date().getFullYear().toString());
  const [newImgUrl, setNewImgUrl] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const [newSvcName, setNewSvcName] = useState('');
  const [newSvcCat, setNewSvcCat] = useState('Paket Logo');
  const [newSvcPrice, setNewSvcPrice] = useState('Rp 150.000');
  const [newSvcTimeline, setNewSvcTimeline] = useState('1-2 Hari');
  const [newSvcDesc, setNewSvcDesc] = useState('');

  // Confirmation dialog for modifying Google Sheet
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  } | null>(null);

  // Reference to modal scrollable content to ensure it always starts at the very top
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const gatekeeperContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
      }
      if (gatekeeperContainerRef.current) {
        gatekeeperContainerRef.current.scrollTop = 0;
      }
    }
  }, [isOpen, activeSubTab, isAdminUnlocked]);

  useEffect(() => {
    setPhotoInputUrl(profilePhotoUrl);
  }, [profilePhotoUrl]);

  useEffect(() => {
    if (headingLogoUrl) {
      setLogoInputUrl(headingLogoUrl);
    }
  }, [headingLogoUrl]);

  useEffect(() => {
    const savedId = localStorage.getItem(DEFAULT_SPREADSHEET_KEY);
    if (savedId) {
      setSpreadsheetInput(savedId);
    } else {
      getCmsServerConfig().then((cfg) => {
        if (cfg?.spreadsheetId) {
          setSpreadsheetInput(cfg.spreadsheetId);
          try {
            localStorage.setItem(DEFAULT_SPREADSHEET_KEY, cfg.spreadsheetId);
          } catch {
            // Ignore
          }
        }
      });
    }

    const unsubscribe = initAuth(
      (user) => {
        setCurrentUser(user);
        if (user?.email) {
          const isOwner = AUTHORIZED_ADMIN_EMAILS.includes(user.email.toLowerCase());
          if (isOwner) {
            setIsAdminUnlocked(true);
            sessionStorage.setItem('piulistrator_admin_unlocked', 'true');
            setIsUnauthorizedEmail(null);
          } else {
            setIsUnauthorizedEmail(user.email);
          }
        }
      },
      () => {
        setCurrentUser(null);
      }
    );

    return () => unsubscribe();
  }, []);

  if (!isOpen) return null;

  // Google sign in with Owner check
  const handleSignIn = async () => {
    setIsLoading(true);
    setStatusMessage(null);
    setIsUnauthorizedEmail(null);
    try {
      const res = await googleSignIn();
      if (res?.user) {
        setCurrentUser(res.user);
        const userEmail = res.user.email?.toLowerCase() || '';
        if (AUTHORIZED_ADMIN_EMAILS.includes(userEmail)) {
          setIsAdminUnlocked(true);
          sessionStorage.setItem('piulistrator_admin_unlocked', 'true');
          setStatusMessage({
            type: 'success',
            text: `Selamat datang Syafi'ul Kholqi! Akses Admin terverifikasi (${res.user.email}).`,
          });
        } else {
          setIsUnauthorizedEmail(res.user.email || '');
          setStatusMessage({
            type: 'error',
            text: `Akses Ditolak: Akun (${res.user.email}) bukan pemilik portofolio ini. Silakan masuk menggunakan SyKholqi@gmail.com.`,
          });
        }
      }
    } catch (err: any) {
      console.error('Login error:', err);
      const isNetworkError =
        err.code === 'auth/network-request-failed' ||
        err.message?.includes('network-request-failed');

      if (isNetworkError) {
        setShowPinTab(true);
        setStatusMessage({
          type: 'error',
          text: 'Gagal terhubung ke Google Auth (Network Request Failed). Hal ini biasa terjadi jika preview dibuka di dalam iframe AI Studio atau diblokir oleh AdBlocker/Brave Shield. Silakan buka aplikasi di Tab Baru (ikon di pojok kanan atas) atau gunakan PIN Admin (1650) di bawah.',
        });
      } else if (err.code === 'auth/popup-closed-by-user') {
        setStatusMessage({
          type: 'info',
          text: 'Jendela login Google ditutup sebelum selesai.',
        });
      } else if (err.code === 'auth/popup-blocked') {
        setShowPinTab(true);
        setStatusMessage({
          type: 'error',
          text: 'Jendela popup login diblokir oleh browser. Harap izinkan popup atau gunakan PIN Admin (1650) di bawah.',
        });
      } else {
        setStatusMessage({
          type: 'error',
          text: err.message || 'Gagal login dengan Google Workspace.',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await googleSignOut();
    setCurrentUser(null);
    setIsAdminUnlocked(false);
    sessionStorage.removeItem('piulistrator_admin_unlocked');
    setIsUnauthorizedEmail(null);
    setStatusMessage({ type: 'info', text: 'Telah keluar dan akses admin dikunci.' });
  };

  // Admin PIN verification
  const handleVerifyPin = (e: React.FormEvent) => {
    e.preventDefault();
    const savedPin = localStorage.getItem('piulistrator_admin_pin') || DEFAULT_ADMIN_PIN;
    if (enteredPin.trim() === savedPin.trim()) {
      setIsAdminUnlocked(true);
      sessionStorage.setItem('piulistrator_admin_unlocked', 'true');
      setPinError(null);
      setStatusMessage({
        type: 'success',
        text: 'Akses Admin berhasil dibuka menggunakan PIN Rahasia.',
      });
    } else {
      setPinError('PIN Admin salah. Silakan coba lagi atau gunakan login Google.');
    }
  };

  const handleLockAdmin = () => {
    setIsAdminUnlocked(false);
    sessionStorage.removeItem('piulistrator_admin_unlocked');
    setEnteredPin('');
    setStatusMessage({
      type: 'info',
      text: 'Akses admin telah dikunci kembali.',
    });
  };

  const handleChangeAdminPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (customPinInput.trim().length < 4) {
      setStatusMessage({ type: 'error', text: 'PIN baru minimal harus 4 digit angka.' });
      return;
    }
    localStorage.setItem('piulistrator_admin_pin', customPinInput.trim());
    setCustomPinInput('');
    setStatusMessage({
      type: 'success',
      text: 'PIN Rahasia Admin berhasil diperbarui!',
    });
  };

  // Profile Photo Handlers
  const handleSaveProfilePhoto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoInputUrl.trim()) {
      setStatusMessage({
        type: 'error',
        text: 'Harap masukkan URL foto profil yang valid.',
      });
      return;
    }
    const cleanUrl = normalizeImageUrl(photoInputUrl.trim());
    onUpdateProfilePhoto(cleanUrl);
    saveCmsServerConfig({ profilePhoto: cleanUrl }).catch(() => {});
    setStatusMessage({
      type: 'success',
      text: 'Foto profil berhasil diperbarui dan tersinkronisasi ke semua perangkat!',
    });
  };

  const handleUseGooglePhoto = () => {
    if (currentUser?.photoURL) {
      setPhotoInputUrl(currentUser.photoURL);
      onUpdateProfilePhoto(currentUser.photoURL);
      saveCmsServerConfig({ profilePhoto: currentUser.photoURL }).catch(() => {});
      setStatusMessage({
        type: 'success',
        text: 'Foto profil dari akun Google Anda berhasil diterapkan dan tersinkronisasi!',
      });
    } else {
      setStatusMessage({
        type: 'error',
        text: 'Akun Google Anda tidak memiliki foto profil publik atau belum login.',
      });
    }
  };

  const handleResetPhoto = () => {
    setPhotoInputUrl(DEFAULT_STUDIO_PHOTO);
    onUpdateProfilePhoto(DEFAULT_STUDIO_PHOTO);
    saveCmsServerConfig({ profilePhoto: DEFAULT_STUDIO_PHOTO }).catch(() => {});
    setStatusMessage({
      type: 'success',
      text: 'Foto profil dikembalikan ke foto bawaan studio.',
    });
  };

  // Heading Logo Handlers
  const handleSaveHeadingLogo = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!logoInputUrl.trim()) {
      setStatusMessage({
        type: 'error',
        text: 'Harap masukkan URL logo Piulistrator atau unggah file logo.',
      });
      return;
    }
    const cleanUrl = normalizeImageUrl(logoInputUrl.trim());
    if (onUpdateHeadingLogo) {
      onUpdateHeadingLogo(cleanUrl);
    }
    saveCmsServerConfig({ headingLogo: cleanUrl }).catch(() => {});
    setStatusMessage({
      type: 'success',
      text: 'Logo Piulistrator berhasil diterapkan pada Heading atas dan tersinkronisasi!',
    });
  };

  const handleResetHeadingLogo = () => {
    setLogoInputUrl('');
    if (onUpdateHeadingLogo) {
      onUpdateHeadingLogo('');
    }
    saveCmsServerConfig({ headingLogo: '' }).catch(() => {});
    setStatusMessage({
      type: 'success',
      text: 'Logo Heading dikembalikan ke ikon standar.',
    });
  };

  const handleUploadLogoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      setStatusMessage({
        type: 'error',
        text: 'Ukuran file logo maksimal 3MB.',
      });
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setLogoInputUrl(dataUrl);
        if (onUpdateHeadingLogo) {
          onUpdateHeadingLogo(dataUrl);
        }
        saveCmsServerConfig({ headingLogo: dataUrl }).catch(() => {});
        setStatusMessage({
          type: 'success',
          text: 'Logo Piulistrator berhasil diunggah dan langsung tampil di Heading!',
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUploadProfileFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      setStatusMessage({
        type: 'error',
        text: 'Ukuran file foto maksimal 3MB.',
      });
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setPhotoInputUrl(dataUrl);
        onUpdateProfilePhoto(dataUrl);
        saveCmsServerConfig({ profilePhoto: dataUrl }).catch(() => {});
        setStatusMessage({
          type: 'success',
          text: 'Foto profil berhasil diunggah dan tersinkronisasi!',
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUploadPortfolioFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      setStatusMessage({
        type: 'error',
        text: 'Ukuran file gambar maksimal 15MB.',
      });
      return;
    }
    
    const token = await getAccessToken();
    if (!token) {
      setStatusMessage({
        type: 'error',
        text: 'Silakan login dengan Google (tombol Connect di atas) untuk mengunggah otomatis ke Google Drive.',
      });
      return;
    }

    try {
      setStatusMessage({
        type: 'info',
        text: 'Sedang mengunggah gambar ke Google Drive Anda...',
      });
      
      const driveUrl = await uploadImageToGoogleDrive(file, token);
      
      setNewImgUrl(driveUrl);
      setStatusMessage({
        type: 'success',
        text: 'Gambar berhasil diunggah ke Google Drive dan siap ditambahkan ke Sheet!',
      });
    } catch (err: any) {
      console.error('Drive upload error:', err);
      setStatusMessage({
        type: 'error',
        text: err.message || 'Gagal mengunggah ke Google Drive',
      });
    }
  };

  // Google Sheets Handlers
  const handleSyncSpreadsheet = async () => {
    const sheetId = extractSpreadsheetId(spreadsheetInput);
    if (!sheetId) {
      setStatusMessage({
        type: 'error',
        text: 'Harap masukkan ID atau URL Google Spreadsheet yang valid.',
      });
      return;
    }

    setIsLoading(true);
    setStatusMessage({ type: 'info', text: 'Mengambil data dari Google Sheets...' });

    try {
      let token = await getAccessToken();

      // If token is missing and user is logged in as admin, try refreshing token via Google sign in
      if (!token && currentUser && AUTHORIZED_ADMIN_EMAILS.includes(currentUser.email?.toLowerCase() || '')) {
        try {
          const authRes = await googleSignIn();
          if (authRes?.accessToken) {
            token = authRes.accessToken;
          }
        } catch {
          // popup closed or ignored
        }
      }

      const freshData = await fetchPublicOrAuthSheetData(sheetId, token);

      let updatedCount = 0;
      let finalPortfolio: PortfolioItem[] | undefined = undefined;
      let finalServices: { tiers: LogoTier[]; singles: SingleService[] } | null | undefined = undefined;
      let updatedLogo: string = logoInputUrl || headingLogoUrl || '/piulistrator-logo.jpg';
      let updatedProfilePhoto: string = photoInputUrl || profilePhotoUrl;

      if (freshData.portfolio && freshData.portfolio.length > 0) {
        onUpdatePortfolio(freshData.portfolio);
        finalPortfolio = freshData.portfolio;
        updatedCount = freshData.portfolio.length;
      }

      if (freshData.services && freshData.services.tiers && freshData.services.tiers.length > 0) {
        onUpdateServices(freshData.services);
        finalServices = freshData.services;
      }

      if (freshData.settings?.headingLogo) {
        updatedLogo = freshData.settings.headingLogo;
        setLogoInputUrl(freshData.settings.headingLogo);
        if (onUpdateHeadingLogo) {
          onUpdateHeadingLogo(freshData.settings.headingLogo);
        }
      }

      if (freshData.settings?.profilePhoto) {
        updatedProfilePhoto = freshData.settings.profilePhoto;
        setPhotoInputUrl(freshData.settings.profilePhoto);
        onUpdateProfilePhoto(freshData.settings.profilePhoto);
      }

      localStorage.setItem(DEFAULT_SPREADSHEET_KEY, sheetId);

      // Save to server so mobile/HP & visitors auto-load this immediately
      await saveCmsServerConfig({
        spreadsheetId: sheetId,
        portfolioList: finalPortfolio,
        servicesData: finalServices,
        headingLogo: updatedLogo,
        profilePhoto: updatedProfilePhoto,
      });

      const timeStr = new Date().toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
      });
      setLastSyncTime(timeStr);

      setStatusMessage({
        type: 'success',
        text: `Sukses sinkronisasi! ${
          updatedCount > 0 ? `${updatedCount} karya portofolio` : 'Data'
        } berhasil dimuat dan tersimpan untuk semua perangkat (HP & Desktop).`,
      });
    } catch (err: any) {
      const errMsg = err.message || '';
      const isAuthError =
        errMsg.includes('401') ||
        errMsg.includes('Privat') ||
        errMsg.includes('Dibatasi') ||
        errMsg.includes('izin');

      setStatusMessage({
        type: 'error',
        text: isAuthError
          ? 'Google Sheet Anda berstatus "Dibatasi/Privat" (401). Agar HP & pengunjung dapat sinkron otomatis tanpa login: Buka Google Sheet > Klik "Bagikan" (Share) > Ubah Akses Umum menjadi "Siapa saja yang memiliki link: Pelihat".'
          : `Sinkronisasi gagal: ${errMsg || 'Periksa koneksi spreadsheet Anda.'}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTemplate = async () => {
    const token = await getAccessToken();
    if (!token) {
      setStatusMessage({
        type: 'error',
        text: 'Silakan login dengan Google terlebih dahulu untuk membuat Spreadsheet di Google Drive Anda.',
      });
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: 'Buat Spreadsheet Baru di Google Drive?',
      description:
        'Aplikasi akan membuat file Google Spreadsheet baru berjudul "Piulistrator - Data Portofolio & Services (CMS)" di Google Drive Anda lengkap dengan tab Portofolio & Services.',
      onConfirm: async () => {
        setConfirmModal(null);
        setIsLoading(true);
        setStatusMessage({ type: 'info', text: 'Membuat file template spreadsheet...' });
        try {
          const result = await createTemplateSpreadsheet(token);
          setSpreadsheetInput(result.id);
          localStorage.setItem(DEFAULT_SPREADSHEET_KEY, result.id);
          setCreatedSheetUrl(result.url);
          setStatusMessage({
            type: 'success',
            text: 'Spreadsheet template berhasil dibuat di Google Drive Anda!',
          });
        } catch (err: any) {
          setStatusMessage({
            type: 'error',
            text: err.message || 'Gagal membuat template spreadsheet.',
          });
        } finally {
          setIsLoading(false);
        }
      },
    });
  };

  const handleAppendPortfolio = async (e: React.FormEvent) => {
    e.preventDefault();
    const sheetId = extractSpreadsheetId(spreadsheetInput);
    if (!sheetId) {
      setStatusMessage({
        type: 'error',
        text: 'Harap tentukan Google Spreadsheet ID terlebih dahulu.',
      });
      return;
    }

    const token = await getAccessToken();
    if (!token) {
      setStatusMessage({
        type: 'error',
        text: 'Login Google diperlukan untuk menambahkan data ke spreadsheet.',
      });
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: `Tambahkan "${newTitle}" ke Spreadsheet?`,
      description: `Data portofolio ini akan ditambahkan sebagai baris baru pada tab "Portofolio" di Google Spreadsheet Anda.`,
      onConfirm: async () => {
        setConfirmModal(null);
        setIsLoading(true);
        try {
          const cleanPortfolioImg = normalizeImageUrl(newImgUrl.trim());
          await appendPortfolioRow(
            sheetId,
            {
              title: newTitle,
              category: newCategory,
              description: newDesc,
              imageUrl: cleanPortfolioImg || FALLBACK_PORTFOLIO_IMAGE,
              client: newClient || 'Klien Baru',
              year: newYear.trim() || new Date().getFullYear().toString(),
            },
            token
          );

          setStatusMessage({
            type: 'success',
            text: `Karya "${newTitle}" berhasil ditambahkan ke Google Sheet! Menyinkronkan...`,
          });

          setNewTitle('');
          setNewDesc('');
          setNewImgUrl('');
          setNewClient('');
          setNewYear(new Date().getFullYear().toString());

          await handleSyncSpreadsheet();
        } catch (err: any) {
          setStatusMessage({
            type: 'error',
            text: err.message || 'Gagal menambahkan ke spreadsheet.',
          });
        } finally {
          setIsLoading(false);
        }
      },
    });
  };

  const handleAppendService = async (e: React.FormEvent) => {
    e.preventDefault();
    const sheetId = extractSpreadsheetId(spreadsheetInput);
    if (!sheetId) {
      setStatusMessage({
        type: 'error',
        text: 'Harap tentukan Google Spreadsheet ID terlebih dahulu.',
      });
      return;
    }

    const token = await getAccessToken();
    if (!token) {
      setStatusMessage({
        type: 'error',
        text: 'Login Google diperlukan untuk menambahkan data ke spreadsheet.',
      });
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: `Tambahkan Layanan "${newSvcName}" ke Spreadsheet?`,
      description: `Layanan ini akan ditambahkan ke tab "Services" di Google Spreadsheet Anda.`,
      onConfirm: async () => {
        setConfirmModal(null);
        setIsLoading(true);
        try {
          await appendServiceRow(
            sheetId,
            {
              packageName: newSvcName,
              category: newSvcCat,
              price: newSvcPrice,
              timeline: newSvcTimeline,
              description: newSvcDesc,
            },
            token
          );

          setStatusMessage({
            type: 'success',
            text: `Layanan "${newSvcName}" berhasil ditambahkan ke Google Sheet!`,
          });

          setNewSvcName('');
          setNewSvcDesc('');

          await handleSyncSpreadsheet();
        } catch (err: any) {
          setStatusMessage({
            type: 'error',
            text: err.message || 'Gagal menambahkan layanan.',
          });
        } finally {
          setIsLoading(false);
        }
      },
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-[#131b2e]/60 backdrop-blur-xl p-3 sm:p-5 overflow-y-auto transition-all duration-300"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[430px] bg-white rounded-3xl sm:rounded-[28px] overflow-hidden shadow-2xl border border-white/90 max-h-[92vh] flex flex-col mt-2 sm:mt-6 mb-auto animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between px-5 py-3.5 bg-white/95 backdrop-blur-md border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#006e4b] flex items-center justify-center border border-emerald-200/60 shadow-2xs">
              <span className="material-symbols-outlined text-[18px]">
                {isAdminUnlocked ? 'table_chart' : 'lock'}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-[14px] font-bold text-[#131b2e] leading-tight">
                  Google Sheets CMS
                </h2>
                {isAdminUnlocked ? (
                  <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 text-[#006e4b] text-[9px] font-bold">
                    Admin
                  </span>
                ) : (
                  <span className="px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 text-[9px] font-bold">
                    Terkunci
                  </span>
                )}
              </div>
              <p className="text-[10px] text-[#464555]">
                {isAdminUnlocked
                  ? 'Kelola Portofolio, Layanan & Profil'
                  : 'Area Khusus Pemilik Studio (SyKholqi@gmail.com)'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {isAdminUnlocked && (
              <button
                type="button"
                onClick={handleLockAdmin}
                title="Kunci / Keluar Akses Admin"
                className="p-1.5 rounded-full bg-slate-100 text-[#ba1a1a] hover:bg-rose-50 text-[11px] font-bold flex items-center justify-center cursor-pointer"
              >
                <span className="material-symbols-outlined text-[17px]">lock</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup"
              className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[#131b2e] hover:bg-slate-200 transition-colors active:scale-90 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        </div>

        {/* Status Message Notification */}
        {statusMessage && (
          <div
            className={`mx-4 mt-3 p-2.5 rounded-xl text-[11px] flex items-start gap-2 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 text-[#005338] border border-emerald-200'
                : statusMessage.type === 'error'
                ? 'bg-rose-50 text-[#93000a] border border-rose-200'
                : 'bg-indigo-50 text-[#3525cd] border border-indigo-200'
            }`}
          >
            <span className="material-symbols-outlined text-[16px] shrink-0 mt-0.5">
              {statusMessage.type === 'success'
                ? 'check_circle'
                : statusMessage.type === 'error'
                ? 'error'
                : 'info'}
            </span>
            <span className="leading-snug">{statusMessage.text}</span>
          </div>
        )}

        {/* SECURITY GATEKEEPER: If user is NOT verified Admin */}
        {!isAdminUnlocked ? (
          <div ref={gatekeeperContainerRef} className="overflow-y-auto no-scrollbar p-5 space-y-4 text-[12px]">
            <div className="text-center py-2 space-y-2">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#3525cd] shadow-sm">
                <span className="material-symbols-outlined text-[28px]">verified_user</span>
              </div>
              <h3 className="text-[16px] font-bold text-[#131b2e]">
                Verifikasi Pemilik Studio
              </h3>
              <p className="text-[11px] text-[#464555] max-w-xs mx-auto leading-relaxed">
                Halaman Google Sheets CMS ini hanya dapat diakses oleh pemilik portofolio:{' '}
                <strong className="text-[#131b2e]">SyKholqi@gmail.com</strong> untuk menjaga keamanan data.
              </p>
            </div>

            {/* Unauthorized email warning */}
            {isUnauthorizedEmail && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-[#ba1a1a] text-[11px] space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold">
                  <span className="material-symbols-outlined text-[16px]">block</span>
                  <span>Akses Ditolak</span>
                </div>
                <p>
                  Akun Google <strong>{isUnauthorizedEmail}</strong> bukan pemilik portofolio ini.
                  Silakan ganti akun dengan <strong>SyKholqi@gmail.com</strong>.
                </p>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="mt-1 px-3 py-1 rounded-lg bg-[#ba1a1a] text-white font-bold text-[10px] hover:bg-rose-700 cursor-pointer"
                >
                  Keluar & Ganti Akun Google
                </button>
              </div>
            )}

            {/* Method 1: Sign in with Google (SyKholqi@gmail.com) */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#464555] block">
                Metode Utama: Google Workspace
              </span>
              <p className="text-[11px] text-[#464555] leading-relaxed">
                Masuk dengan akun Google Anda untuk membuka akses instan ke seluruh data portofolio & spreadsheet.
              </p>
              <button
                type="button"
                onClick={handleSignIn}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-full bg-white hover:bg-slate-100 text-[#131b2e] border border-slate-300 font-bold text-[12px] shadow-xs active:scale-[0.98] transition-all cursor-pointer"
              >
                <svg
                  version="1.1"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 48 48"
                  className="w-4 h-4 shrink-0"
                >
                  <path
                    fill="#EA4335"
                    d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                  ></path>
                  <path
                    fill="#4285F4"
                    d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                  ></path>
                  <path
                    fill="#FBBC05"
                    d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                  ></path>
                  <path
                    fill="#34A853"
                    d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                  ></path>
                </svg>
                <span>Masuk dengan Google (SyKholqi@gmail.com)</span>
              </button>

              {typeof window !== 'undefined' && window.self !== window.top && (
                <div className="pt-1 text-center">
                  <a
                    href={window.location.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#3525cd] hover:underline"
                  >
                    <span>Buka di Tab Baru (Disarankan jika Login Terkendala)</span>
                    <span className="material-symbols-outlined text-[13px]">open_in_new</span>
                  </a>
                </div>
              )}
            </div>

            {/* Method 2: Master Admin PIN */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#464555]">
                  Metode Alternatif: PIN Rahasia
                </span>
                <button
                  type="button"
                  onClick={() => setShowPinTab(!showPinTab)}
                  className="text-[11px] font-bold text-[#3525cd] hover:underline cursor-pointer"
                >
                  {showPinTab ? 'Tutup Form' : 'Gunakan PIN'}
                </button>
              </div>

              {showPinTab ? (
                <form onSubmit={handleVerifyPin} className="space-y-2 pt-1">
                  <p className="text-[10px] text-[#464555]">
                    Masukkan PIN rahasia admin pemilik portofolio (Default: <strong>1650</strong>):
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      maxLength={8}
                      placeholder="Masukkan PIN"
                      value={enteredPin}
                      onChange={(e) => {
                        setEnteredPin(e.target.value);
                        setPinError(null);
                      }}
                      className="glass-input flex-1 rounded-xl px-3 py-2 text-[12px] text-[#131b2e] tracking-widest text-center"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-[#3525cd] text-white font-bold text-[12px] hover:bg-[#4f46e5] cursor-pointer shrink-0"
                    >
                      Buka
                    </button>
                  </div>
                  {pinError && (
                    <p className="text-[10px] text-[#ba1a1a] font-semibold">{pinError}</p>
                  )}
                </form>
              ) : (
                <p className="text-[10px] text-[#464555]">
                  Dapat digunakan jika Anda membuka website di perangkat lain tanpa login akun Google.
                </p>
              )}
            </div>
          </div>
        ) : (
          /* UNLOCKED ADMIN CMS VIEW */
          <>
            {/* Sub-tabs switcher */}
            <div className="flex border-b border-slate-100 bg-slate-50/70 px-3 pt-1 gap-1 text-[11px] font-semibold overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => setActiveSubTab('connect')}
                className={`py-2 px-2.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  activeSubTab === 'connect'
                    ? 'border-[#3525cd] text-[#3525cd] font-bold'
                    : 'border-transparent text-[#464555] hover:text-[#131b2e]'
                }`}
              >
                Koneksi Sheet
              </button>
              <button
                type="button"
                onClick={() => setActiveSubTab('profile_photo')}
                className={`py-2 px-2.5 border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                  activeSubTab === 'profile_photo'
                    ? 'border-[#3525cd] text-[#3525cd] font-bold'
                    : 'border-transparent text-[#464555] hover:text-[#131b2e]'
                }`}
              >
                <span className="material-symbols-outlined text-[14px]">palette</span>
                <span>Foto & Logo</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveSubTab('add_portfolio')}
                className={`py-2 px-2.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  activeSubTab === 'add_portfolio'
                    ? 'border-[#3525cd] text-[#3525cd] font-bold'
                    : 'border-transparent text-[#464555] hover:text-[#131b2e]'
                }`}
              >
                + Karya Baru
              </button>
              <button
                type="button"
                onClick={() => setActiveSubTab('add_service')}
                className={`py-2 px-2.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  activeSubTab === 'add_service'
                    ? 'border-[#3525cd] text-[#3525cd] font-bold'
                    : 'border-transparent text-[#464555] hover:text-[#131b2e]'
                }`}
              >
                + Layanan Baru
              </button>
              <button
                type="button"
                onClick={() => setActiveSubTab('guide')}
                className={`py-2 px-2.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  activeSubTab === 'guide'
                    ? 'border-[#3525cd] text-[#3525cd] font-bold'
                    : 'border-transparent text-[#464555] hover:text-[#131b2e]'
                }`}
              >
                Panduan & PIN
              </button>
            </div>

            {/* Modal Body */}
            <div ref={scrollContainerRef} className="overflow-y-auto no-scrollbar p-5 space-y-4 text-[12px]">
              {/* TAB 1: KONEKSI SPREADSHEET */}
              {activeSubTab === 'connect' && (
                <div className="space-y-4">
                  {/* Google Account Card */}
                  <div className="p-3.5 rounded-2xl bg-slate-50/90 border border-slate-200/80 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-[#464555] uppercase tracking-wider">
                        Akun Pemilik (Admin)
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#006e4b] bg-emerald-100/60 px-2 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#006e4b]"></span>
                        Terverifikasi
                      </span>
                    </div>

                    {currentUser ? (
                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-2.5 min-w-0">
                          {currentUser.photoURL ? (
                            <img
                              src={currentUser.photoURL}
                              alt={currentUser.displayName || ''}
                              className="w-9 h-9 rounded-full object-cover border border-slate-200"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-[#3525cd] text-white flex items-center justify-center font-bold text-xs">
                              SK
                            </div>
                          )}
                          <div className="truncate">
                            <p className="font-bold text-[#131b2e] truncate leading-tight">
                              {currentUser.displayName || "Syafi'ul Kholqi"}
                            </p>
                            <p className="text-[10px] text-[#464555] truncate">
                              {currentUser.email}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleSignOut}
                          className="px-2.5 py-1 text-[11px] text-[#ba1a1a] bg-rose-50 hover:bg-rose-100 rounded-lg font-semibold transition-colors cursor-pointer shrink-0"
                        >
                          Keluar
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[#3525cd] text-[20px]">
                            lock_open
                          </span>
                          <div>
                            <p className="font-bold text-[#131b2e]">Mode PIN Admin Aktif</p>
                            <p className="text-[10px] text-[#464555]">
                              Login Google untuk sinkronisasi otomatis Google Drive.
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleSignIn}
                          className="px-2.5 py-1 text-[11px] text-[#3525cd] bg-indigo-50 hover:bg-indigo-100 rounded-lg font-bold transition-colors cursor-pointer shrink-0"
                        >
                          Login Google
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Spreadsheet ID / Link Form */}
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label
                        htmlFor="sheet-url"
                        className="block text-[11px] font-bold text-[#131b2e]"
                      >
                        Tautan atau ID Google Spreadsheet:
                      </label>
                      <input
                        id="sheet-url"
                        type="text"
                        placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs.../edit atau ID"
                        value={spreadsheetInput}
                        onChange={(e) => setSpreadsheetInput(e.target.value)}
                        className="glass-input w-full rounded-xl px-3 py-2 text-[12px] text-[#131b2e] placeholder:text-slate-400"
                      />
                      <p className="text-[10px] text-[#464555]">
                        Pastikan spreadsheet memiliki tab <strong>Portofolio</strong> dan/atau{' '}
                        <strong>Services</strong>.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={handleSyncSpreadsheet}
                        disabled={isLoading || !spreadsheetInput}
                        className="py-2.5 px-3 rounded-xl bg-[#3525cd] hover:bg-[#4f46e5] text-white font-bold text-[12px] shadow-sm flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">sync</span>
                        <span>Sinkronkan Sekarang</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleCreateTemplate}
                        disabled={isLoading || !currentUser}
                        className="py-2.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#006e4b] border border-emerald-200/80 font-bold text-[12px] flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">add_box</span>
                        <span>Buat Template Baru</span>
                      </button>
                    </div>

                    {createdSheetUrl && (
                      <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/60 flex items-center justify-between">
                        <span className="text-[11px] text-[#006e4b] font-medium truncate max-w-[240px]">
                          Spreadsheet Anda telah siap!
                        </span>
                        <a
                          href={createdSheetUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 rounded-lg bg-[#006e4b] text-white text-[11px] font-bold inline-flex items-center gap-1 hover:bg-[#005338]"
                        >
                          <span>Buka Sheet</span>
                          <span className="material-symbols-outlined text-[13px]">
                            open_in_new
                          </span>
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Status Ringkasan */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-[11px] space-y-1 text-[#464555]">
                    <div className="flex justify-between">
                      <span>Jumlah Karya Portofolio Aktif:</span>
                      <strong className="text-[#131b2e]">{currentPortfolioCount} item</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Jumlah Layanan Aktif:</span>
                      <strong className="text-[#131b2e]">{currentServicesCount} item</strong>
                    </div>
                    {lastSyncTime && (
                      <div className="flex justify-between pt-1 border-t border-slate-200/40 text-[10px]">
                        <span>Sinkronisasi Terakhir:</span>
                        <span className="text-[#006e4b] font-semibold">{lastSyncTime} WIB</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: BRANDING - FOTO PROFIL & LOGO HEADING */}
              {activeSubTab === 'profile_photo' && (
                <div className="space-y-6">
                  {/* SEKSI 1: LOGO PIULISTRATOR DI HEADING ATAS */}
                  <div className="p-4 rounded-2xl bg-white border border-indigo-100/80 shadow-xs space-y-3.5">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#3525cd] text-[18px]">
                          brush
                        </span>
                        <h4 className="font-bold text-[#131b2e] text-[13px]">
                          Logo Piulistrator (Heading Atas)
                        </h4>
                      </div>
                      <span className="text-[10px] font-semibold text-[#3525cd] bg-indigo-50 px-2 py-0.5 rounded-full">
                        Navbar Header
                      </span>
                    </div>

                    <div className="flex items-center gap-3.5">
                      <div className="relative shrink-0">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#3525cd] via-[#4f46e5] to-[#57dffe] p-[2px] shadow-sm overflow-hidden flex items-center justify-center">
                          {logoInputUrl.trim() ? (
                            <SmartImage
                              src={logoInputUrl}
                              alt="Logo Preview"
                              eager={true}
                              className="w-full h-full object-cover rounded-full"
                            />
                          ) : (
                            <span className="material-symbols-outlined text-white text-[20px]">
                              palette
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-semibold text-[#131b2e]">
                          Pratinjau Logo di Header Atas
                        </p>
                        <p className="text-[10px] text-[#464555] mt-0.5">
                          Tampil di sebelah tulisan "Piulistrator" pada bar navigasi atas.
                        </p>
                      </div>
                    </div>

                    {/* Upload File or URL for Logo */}
                    <div className="space-y-2 pt-1">
                      <label className="block text-[11px] font-bold text-[#131b2e]">
                        Unggah File Logo dari Perangkat (HP / Laptop):
                      </label>
                      <label className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-dashed border-[#3525cd]/40 bg-indigo-50/40 hover:bg-indigo-50/80 text-[#3525cd] text-[11px] font-bold cursor-pointer transition-colors">
                        <span className="material-symbols-outlined text-[16px]">upload_file</span>
                        <span>Pilih Gambar Logo (.png, .jpg, .svg)</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleUploadLogoFile}
                          className="hidden"
                        />
                      </label>
                      <p className="text-[9px] text-[#e04d01] leading-tight flex items-start gap-1">
                        <span className="material-symbols-outlined text-[10px] mt-0.5">warning</span>
                        <span>
                          <strong>Perhatian:</strong> Upload file bersifat sementara dan akan reset jika server mati. Untuk hasil permanen, gunakan <strong>Tautan URL</strong> di bawah ini atau pada tab <strong>Pengaturan</strong> di Google Sheet Anda.
                        </span>
                      </p>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-[#131b2e]">
                        Atau Tautan URL Logo (Direct link / Google Drive):
                      </label>
                      <input
                        type="url"
                        placeholder="https://... (Direct image link PNG/JPG atau link Google Drive)"
                        value={logoInputUrl}
                        onChange={(e) => setLogoInputUrl(e.target.value)}
                        className="glass-input w-full rounded-xl px-3 py-2 text-[12px] text-[#131b2e]"
                      />
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleSaveHeadingLogo()}
                        className="flex-1 py-2 px-3 rounded-xl bg-[#3525cd] hover:bg-[#4f46e5] text-white font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[15px]">check_circle</span>
                        <span>Terapkan Logo Heading</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleResetHeadingLogo}
                        className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#464555] text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[14px]">refresh</span>
                        <span>Reset</span>
                      </button>
                    </div>
                  </div>

                  {/* SEKSI 2: FOTO PROFIL DESAINER */}
                  <div className="p-4 rounded-2xl bg-white border border-indigo-100/80 shadow-xs space-y-3.5">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#3525cd] text-[18px]">
                          account_circle
                        </span>
                        <h4 className="font-bold text-[#131b2e] text-[13px]">
                          Foto Profil Desainer (Hero Beranda)
                        </h4>
                      </div>
                      <span className="text-[10px] font-semibold text-[#006e4b] bg-emerald-50 px-2 py-0.5 rounded-full">
                        Kartu Utama
                      </span>
                    </div>

                    <div className="flex items-start gap-3.5">
                      <div className="relative shrink-0">
                        <div className="w-16 h-16 rounded-2xl border-2 border-[#3525cd] ring-2 ring-indigo-100/80 shadow-md overflow-hidden bg-white p-[2px]">
                          <SmartImage
                            src={photoInputUrl || DEFAULT_STUDIO_PHOTO}
                            alt="Preview Profile"
                            eager={true}
                            className="w-full h-full object-cover rounded-[12px] bg-white"
                          />
                        </div>
                      </div>
                      <div className="min-w-0 flex-1 pt-0.5">
                        <h4 className="font-bold text-[#131b2e] text-[13px] flex items-center gap-1">
                          <span>Syafi'ul Kholqi</span>
                          <span
                            className="material-symbols-outlined text-[#3525cd] text-[15px] shrink-0 select-none inline-flex items-center"
                            style={{ fontVariationSettings: "'FILL' 1" }}
                            title="Terverifikasi"
                          >
                            verified
                          </span>
                        </h4>
                        <p className="text-[11px] text-[#4f46e5] font-semibold">
                          Graphic Designer & Illustrator
                        </p>
                        <p className="text-[10px] text-[#464555] mt-0.5">
                          Tampil di kartu pengenalan profil utama beranda.
                        </p>
                      </div>
                    </div>

                    {/* Upload File for Profile Photo */}
                    <div className="space-y-2 pt-1">
                      <label className="block text-[11px] font-bold text-[#131b2e]">
                        Unggah Foto dari Galeri (HP / Komputer):
                      </label>
                      <label className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-dashed border-[#3525cd]/40 bg-indigo-50/40 hover:bg-indigo-50/80 text-[#3525cd] text-[11px] font-bold cursor-pointer transition-colors">
                        <span className="material-symbols-outlined text-[16px]">add_a_photo</span>
                        <span>Pilih Foto dari Galeri</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleUploadProfileFile}
                          className="hidden"
                        />
                      </label>
                      <p className="text-[9px] text-[#e04d01] leading-tight flex items-start gap-1">
                        <span className="material-symbols-outlined text-[10px] mt-0.5">warning</span>
                        <span>
                          <strong>Perhatian:</strong> Upload file bersifat sementara dan akan reset jika server mati. Untuk hasil permanen, gunakan <strong>Tautan URL</strong> di bawah ini atau pada tab <strong>Pengaturan</strong> di Google Sheet Anda.
                        </span>
                      </p>
                    </div>

                    <form onSubmit={handleSaveProfilePhoto} className="space-y-3 pt-1">
                      <div className="space-y-1">
                        <label className="block text-[11px] font-bold text-[#131b2e]">
                          Atau Tautan URL Foto Profil:
                        </label>
                        <input
                          type="url"
                          required
                          placeholder="https://... (Direct image link JPG / PNG)"
                          value={photoInputUrl}
                          onChange={(e) => setPhotoInputUrl(e.target.value)}
                          className="glass-input w-full rounded-xl px-3 py-2 text-[12px] text-[#131b2e]"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                          type="button"
                          onClick={handleUseGooglePhoto}
                          disabled={!currentUser}
                          className="py-2 px-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-[#131b2e] text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          <span className="material-symbols-outlined text-[15px] text-[#4285F4]">
                            account_circle
                          </span>
                          <span>Pakai Foto Akun Google</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleResetPhoto}
                          className="py-2 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#464555] text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[15px]">refresh</span>
                          <span>Reset Default</span>
                        </button>
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2.5 px-4 rounded-full bg-[#3525cd] text-white font-bold text-[12px] shadow-sm hover:bg-[#4f46e5] transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-[16px]">save</span>
                        <span>Simpan & Terapkan Foto Profil</span>
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* TAB 3: TAMBAH KARYA BARU KE SHEET */}
              {activeSubTab === 'add_portfolio' && (
                <form onSubmit={handleAppendPortfolio} className="space-y-3">
                  <p className="text-[11px] text-[#464555]">
                    Tambahkan karya desain baru langsung ke Google Sheet Anda.
                  </p>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-[#131b2e]">
                      Judul Karya *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Misal: Rebranding Coffee Shop"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="glass-input w-full rounded-xl px-3 py-2 text-[12px]"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1 col-span-1">
                      <label className="block text-[11px] font-bold text-[#131b2e]">
                        Kategori *
                      </label>
                      <select
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        className="glass-input w-full rounded-xl px-2 py-2 text-[12px]"
                      >
                        <option value="Logo">Logo</option>
                        <option value="IG Feed & Poster">IG Feed & Poster</option>
                        <option value="Banner">Banner</option>
                        <option value="Brosur">Brosur</option>
                        <option value="T-Shirt">T-Shirt</option>
                        <option value="Kaligrafi Digital">Kaligrafi Digital</option>
                        <option value="Digital Illustration">Digital Illustration</option>
                        <option value="Cover Buku">Cover Buku</option>
                        <option value="Sertifikat">Sertifikat</option>
                        <option value="Twibbon">Twibbon</option>
                        <option value="ID Card">ID Card</option>
                      </select>
                    </div>

                    <div className="space-y-1 col-span-1">
                      <label className="block text-[11px] font-bold text-[#131b2e]">
                        Nama Klien
                      </label>
                      <input
                        type="text"
                        placeholder="Nama Klien"
                        value={newClient}
                        onChange={(e) => setNewClient(e.target.value)}
                        className="glass-input w-full rounded-xl px-2.5 py-2 text-[12px]"
                      />
                    </div>

                    <div className="space-y-1 col-span-1">
                      <label className="block text-[11px] font-bold text-[#131b2e]">
                        Tahun
                      </label>
                      <input
                        type="text"
                        placeholder="2024"
                        value={newYear}
                        onChange={(e) => setNewYear(e.target.value)}
                        className="glass-input w-full rounded-xl px-2.5 py-2 text-[12px]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-[11px] font-bold text-[#131b2e]">
                        Gambar Portofolio *
                      </label>
                      {newImgUrl.trim() && (
                        <span className="text-[10px] text-[#3525cd] font-semibold">
                          {newImgUrl.startsWith('data:')
                            ? '✓ File Lokal'
                            : inspectImageUrl(newImgUrl).type === 'google-drive'
                            ? '✓ Google Drive'
                            : '✓ Direct URL'}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col gap-1.5">
                      {/* File upload option from gallery / device */}
                      <label className="flex items-center justify-center gap-1.5 py-3 px-3 rounded-xl border border-dashed border-[#3525cd]/40 bg-indigo-50/50 hover:bg-indigo-50 text-[#3525cd] text-[12px] font-bold cursor-pointer transition-colors shadow-sm">
                        <span className="material-symbols-outlined text-[18px]">cloud_upload</span>
                        <span>Unggah Foto ke Google Drive</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleUploadPortfolioFile}
                          className="hidden"
                        />
                      </label>
                    </div>

                    <p className="text-[10px] text-[#464555]">
                      Mendukung unggah langsung dari galeri atau perangkat Anda. Foto akan otomatis tersimpan di Google Drive dan terhubung ke tabel ini.
                    </p>

                    {/* Live Image Preview & Guidance */}
                    {newImgUrl.trim() && (
                      <div className="mt-2 p-3 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-[#131b2e] flex items-center gap-1">
                            <span className="material-symbols-outlined text-[15px] text-[#3525cd]">
                              image
                            </span>
                            Pratinjau Gambar Langsung:
                          </span>
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-white border border-indigo-200 text-[#3525cd]">
                            {newImgUrl.startsWith('data:')
                              ? 'File Lokal'
                              : inspectImageUrl(newImgUrl).type === 'google-drive'
                              ? 'Google Drive'
                              : 'Web Link'}
                          </span>
                        </div>

                        <div className="relative w-full h-44 rounded-xl overflow-hidden bg-white border border-slate-200 flex items-center justify-center p-1 shadow-inner">
                          <SmartImage
                            src={newImgUrl}
                            alt={newTitle || 'Pratinjau Gambar'}
                            eager={true}
                            className="w-full h-full object-contain rounded-lg"
                          />
                        </div>

                        {!newImgUrl.startsWith('data:') && (
                          <div className="flex items-center justify-between pt-0.5 text-[10px]">
                            <a
                              href={normalizeImageUrl(newImgUrl)}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[#3525cd] font-semibold flex items-center gap-1 hover:underline cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[13px]">open_in_new</span>
                              Buka link gambar asli di tab baru
                            </a>
                          </div>
                        )}

                        {inspectImageUrl(newImgUrl).advice && (
                          <div className="p-2 rounded-lg bg-amber-50 border border-amber-200/70 text-[10px] text-amber-900 flex items-start gap-1.5">
                            <span className="material-symbols-outlined text-amber-600 text-[15px] shrink-0 mt-0.5">
                              info
                            </span>
                            <span className="leading-snug">
                              {inspectImageUrl(newImgUrl).advice}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-[#131b2e]">
                      Keterangan Desain *
                    </label>
                    <textarea
                      required
                      rows={2}
                      placeholder="Deskripsi singkat karya..."
                      value={newDesc}
                      onChange={(e) => setNewDesc(e.target.value)}
                      className="glass-input w-full rounded-xl p-2.5 text-[12px] resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 px-4 rounded-full bg-[#3525cd] text-white font-bold text-[12px] shadow-sm hover:bg-[#4f46e5] transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[16px]">save</span>
                    <span>Simpan ke Google Sheet</span>
                  </button>
                </form>
              )}

              {/* TAB 4: TAMBAH LAYANAN BARU KE SHEET */}
              {activeSubTab === 'add_service' && (
                <form onSubmit={handleAppendService} className="space-y-3">
                  <p className="text-[11px] text-[#464555]">
                    Tambahkan paket atau jenis layanan baru ke Google Sheet.
                  </p>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-[#131b2e]">
                      Nama Paket / Layanan *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Misal: Paket Merchandise Distro"
                      value={newSvcName}
                      onChange={(e) => setNewSvcName(e.target.value)}
                      className="glass-input w-full rounded-xl px-3 py-2 text-[12px]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-[#131b2e]">
                        Kategori *
                      </label>
                      <select
                        value={newSvcCat}
                        onChange={(e) => setNewSvcCat(e.target.value)}
                        className="glass-input w-full rounded-xl px-3 py-2 text-[12px]"
                      >
                        <option value="Paket Logo">Paket Logo</option>
                        <option value="Branding & Cetak">Branding & Cetak</option>
                        <option value="Sosial Media">Sosial Media</option>
                        <option value="Ilustrasi">Ilustrasi</option>
                        <option value="Formal">Formal</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-[#131b2e]">
                        Harga *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Rp 150.000"
                        value={newSvcPrice}
                        onChange={(e) => setNewSvcPrice(e.target.value)}
                        className="glass-input w-full rounded-xl px-3 py-2 text-[12px]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-[#131b2e]">
                      Estimasi Waktu Pengerjaan
                    </label>
                    <input
                      type="text"
                      placeholder="1-2 Hari Kerja"
                      value={newSvcTimeline}
                      onChange={(e) => setNewSvcTimeline(e.target.value)}
                      className="glass-input w-full rounded-xl px-3 py-2 text-[12px]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-[#131b2e]">
                      Fitur / Keterangan
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Pisahkan dengan simbol '|' untuk fitur paket (contoh: Full Color | Mockup 3D | Master File)"
                      value={newSvcDesc}
                      onChange={(e) => setNewSvcDesc(e.target.value)}
                      className="glass-input w-full rounded-xl p-2.5 text-[12px] resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 px-4 rounded-full bg-[#3525cd] text-white font-bold text-[12px] shadow-sm hover:bg-[#4f46e5] transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[16px]">save</span>
                    <span>Simpan Layanan ke Google Sheet</span>
                  </button>
                </form>
              )}

              {/* TAB 5: PANDUAN FORMAT & KEAMANAN PIN */}
              {activeSubTab === 'guide' && (
                <div className="space-y-3.5 text-[11px] text-[#464555]">
                  {/* Security Status Box */}
                  <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-200/70 space-y-2">
                    <div className="flex items-center gap-1.5 text-[#3525cd] font-bold">
                      <span className="material-symbols-outlined text-[16px]">shield</span>
                      <span>Sistem Keamanan Akses Admin</span>
                    </div>
                    <p className="leading-relaxed">
                      Menu ini hanya dapat diakses melalui verifikasi akun Google terdaftar (
                      <strong>SyKholqi@gmail.com</strong>) atau dengan memasukkan <strong>PIN Admin</strong>. Pengunjung umum tidak dapat mengakses atau mengubah data Anda.
                    </p>

                    {/* Change PIN Form */}
                    <form onSubmit={handleChangeAdminPin} className="pt-2 border-t border-indigo-100 space-y-1.5">
                      <label className="block font-bold text-[#131b2e]">
                        Ganti PIN Rahasia Admin:
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="password"
                          maxLength={8}
                          placeholder="PIN baru (min 4 digit)"
                          value={customPinInput}
                          onChange={(e) => setCustomPinInput(e.target.value)}
                          className="glass-input flex-1 rounded-xl px-2.5 py-1.5 text-[11px]"
                        />
                        <button
                          type="submit"
                          className="px-3 py-1.5 rounded-xl bg-[#3525cd] text-white font-bold text-[11px] hover:bg-[#4f46e5] cursor-pointer shrink-0"
                        >
                          Simpan PIN
                        </button>
                      </div>
                      <span className="text-[10px] text-slate-400 block">
                        PIN saat ini: {localStorage.getItem('piulistrator_admin_pin') || DEFAULT_ADMIN_PIN}
                      </span>
                    </form>
                  </div>

                  {/* Google Drive Photo Guide */}
                  <div className="p-3.5 rounded-2xl bg-amber-50/90 border border-amber-200/80 text-amber-950 space-y-1.5 shadow-2xs">
                    <p className="font-bold flex items-center gap-1.5 text-[12px] text-amber-900">
                      <span className="material-symbols-outlined text-[18px] text-amber-600">
                        cloud_done
                      </span>
                      <span>Panduan Memasukkan Foto dari Google Drive:</span>
                    </p>
                    <ol className="list-decimal pl-4 text-[11px] space-y-1 text-amber-900/90 leading-relaxed">
                      <li>Upload foto desain Anda ke Google Drive.</li>
                      <li>
                        Klik kanan pada file foto &gt; pilih <strong>Bagikan (Share)</strong>.
                      </li>
                      <li>
                        Ubah Akses umum menjadi: <strong>"Siapa saja yang memiliki link"</strong> (<em>Anyone with the link - Viewer</em>). Hal ini wajib agar foto dapat diakses publik.
                      </li>
                      <li>
                        Klik <strong>Salin link</strong> (Copy link) dan tempel ke kolom <strong>Gambar_URL</strong> di Google Sheet atau formulir Tambah Karya.
                      </li>
                      <li>
                        Sistem aplikasi ini <strong>secara otomatis mendeteksi dan mengonversinya menjadi direct CDN image</strong> sehingga foto Anda pasti tampil sempurna!
                      </li>
                    </ol>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <p className="font-bold text-[#131b2e] mb-1">
                      1. Tab "Portofolio" (Kolom A – G):
                    </p>
                    <ul className="list-disc pl-4 space-y-0.5">
                      <li><strong>A (Judul)</strong>: Nama karya / project</li>
                      <li><strong>B (Kategori)</strong>: Logo, Cover Buku, Banner, dll</li>
                      <li><strong>C (Keterangan)</strong>: Penjelasan konsep karya</li>
                      <li><strong>D (Gambar_URL)</strong>: URL foto / mockup karya</li>
                      <li><strong>E (Klien)</strong>: Nama instansi atau klien</li>
                      <li><strong>F (Tahun)</strong>: 2024 / 2025</li>
                      <li><strong>G (Badge)</strong>: Award Winner / Opsional</li>
                    </ul>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <p className="font-bold text-[#131b2e] mb-1">
                      2. Tab "Services" (Kolom A – E):
                    </p>
                    <ul className="list-disc pl-4 space-y-0.5">
                      <li><strong>A (Paket)</strong>: Nama paket / layanan</li>
                      <li><strong>B (Kategori)</strong>: Paket Logo, Branding, dll</li>
                      <li><strong>C (Harga)</strong>: Rp 100.000 / Mulai Rp 50.000</li>
                      <li><strong>D (Estimasi_Waktu)</strong>: 1-2 Hari Kerja</li>
                      <li><strong>E (Fitur_Keterangan)</strong>: Fitur dipisah tanda |</li>
                    </ul>
                  </div>

                  <p className="text-[10px] text-slate-400">
                    💡 Anda bisa langsung mengedit spreadsheet melalui aplikasi Google Sheets di HP atau browser komputer, lalu klik "Sinkronkan Sekarang" di menu ini untuk langsung melihat perubahannya pada aplikasi!
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Confirmation Modal for Modifying Workspace Data */}
      {confirmModal && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4 animate-in fade-in"
          onClick={() => setConfirmModal(null)}
        >
          <div
            className="w-full max-w-[360px] bg-white rounded-2xl p-5 shadow-2xl border border-slate-200 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-10 rounded-full bg-indigo-50 text-[#3525cd] flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]">help</span>
            </div>
            <h3 className="text-[15px] font-bold text-[#131b2e] leading-snug">
              {confirmModal.title}
            </h3>
            <p className="text-[12px] text-[#464555] leading-relaxed">
              {confirmModal.description}
            </p>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="flex-1 py-2 px-3 rounded-xl border border-slate-200 text-[#464555] font-semibold text-[12px] hover:bg-slate-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmModal.onConfirm}
                className="flex-1 py-2 px-3 rounded-xl bg-[#3525cd] text-white font-bold text-[12px] hover:bg-[#4f46e5] cursor-pointer"
              >
                Lanjutkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
