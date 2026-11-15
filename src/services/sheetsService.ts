import { PortfolioItem, LogoTier, SingleService } from '../types';
import { PORTFOLIO_ITEMS } from '../data/portfolioData';
import { LOGO_TIERS, SINGLE_SERVICES } from '../data/servicesData';
import { normalizeImageUrl, FALLBACK_PORTFOLIO_IMAGE } from '../utils/imageUrlHelper';

export const DEFAULT_SPREADSHEET_KEY = 'piulistrator_spreadsheet_id';

export async function uploadImageToGoogleDrive(file: File, accessToken: string): Promise<string> {
  const folderName = 'PIULISTRATOR';
  let folderId = '';

  // 1. Check if PIULISTRATOR folder exists
  const searchRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false&fields=files(id)`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (searchRes.ok) {
    const searchData = await searchRes.json();
    if (searchData.files && searchData.files.length > 0) {
      folderId = searchData.files[0].id;
    }
  }

  // 2. If it doesn't exist, create it
  if (!folderId) {
    const createFolderRes = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
      }),
    });

    if (!createFolderRes.ok) {
      const errorData = await createFolderRes.json().catch(() => ({}));
      throw new Error(errorData.error?.message || 'Gagal membuat folder PIULISTRATOR di Google Drive');
    }

    const newFolderData = await createFolderRes.json();
    folderId = newFolderData.id;
  }

  // 3. Upload the file inside the folder
  const metadata = {
    name: file.name,
    mimeType: file.type,
    parents: [folderId],
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', file);

  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: form,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || 'Gagal mengunggah file ke Google Drive');
  }

  const data = await res.json();
  const fileId = data.id;

  // 4. Make the file publicly accessible
  await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      role: 'reader',
      type: 'anyone',
    }),
  });

  return `https://drive.google.com/file/d/${fileId}/view`;
}

export function extractSpreadsheetId(input: string): string {
  if (!input) return '';
  const trimmed = input.trim();
  const match = trimmed.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  return trimmed;
}

export async function fetchSpreadsheetMetadata(
  spreadsheetId: string,
  accessToken: string
) {
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=properties.title,sheets.properties`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(
      errorData.error?.message || `Gagal membaca spreadsheet (Status: ${res.status})`
    );
  }

  return await res.json();
}

export async function readSheetRange(
  spreadsheetId: string,
  range: string,
  accessToken?: string | null
): Promise<any[][]> {
  const cleanId = extractSpreadsheetId(spreadsheetId);
  const sheetName = range.includes('!') ? range.split('!')[0] : range;

  // 1. If accessToken is provided, try official Google Sheets API v4
  if (accessToken) {
    try {
      const res = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}/values/${encodeURIComponent(
          range
        )}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (res.ok) {
        const data = await res.json();
        if (data.values && data.values.length > 0) {
          return data.values;
        }
      }
    } catch (err) {
      console.warn('Google Sheets API v4 failed, trying public reader...', err);
    }
  }

  // 2. Fallback to Google Visualization API (publicly accessible on mobile/desktop without OAuth)
  try {
    const gvizUrl = `https://docs.google.com/spreadsheets/d/${cleanId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(
      sheetName
    )}&_t=${Date.now()}`;
    const res = await fetch(gvizUrl, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store',
      },
    });
    if (res.ok) {
      const text = await res.text();
      const firstBrace = text.indexOf('{');
      const lastBrace = text.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1) {
        const jsonStr = text.substring(firstBrace, lastBrace + 1);
        const data = JSON.parse(jsonStr);
        if (data.table && data.table.rows) {
          const headerRow: string[] = (data.table.cols || []).map(
            (col: any) => col.label || col.id || ''
          );
          const dataRows: string[][] = data.table.rows.map((r: any) => {
            if (!r || !r.c) return [];
            return r.c.map((cell: any) => {
              if (!cell) return '';
              if (cell.f !== undefined && cell.f !== null) return String(cell.f);
              if (cell.v !== undefined && cell.v !== null) return String(cell.v);
              return '';
            });
          });

          const hasLabels = headerRow.some((h) => h && h.length > 0);
          return hasLabels ? [headerRow, ...dataRows] : dataRows;
        }
      }
    }
  } catch (err) {
    console.warn('Public gviz fetch failed, trying server proxy...', err);
  }

  // 3. Fallback to server proxy with cache-busting
  try {
    const proxyRes = await fetch(
      `/api/cms/sheets-proxy?id=${encodeURIComponent(cleanId)}&sheet=${encodeURIComponent(sheetName)}&_t=${Date.now()}`,
      {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store',
        },
      }
    );
    if (proxyRes.ok) {
      const proxyData = await proxyRes.json();
      if (proxyData.rows && proxyData.rows.length > 0) {
        return proxyData.rows;
      }
    }
  } catch {
    // Ignore proxy error
  }

  return [];
}

/**
 * Fetch full portfolio and services data from Google Sheets
 * Works on any device (HP, desktop, tablet) with or without login
 */
export async function fetchPublicOrAuthSheetData(
  spreadsheetId: string,
  accessToken?: string | null
): Promise<{
  portfolio: PortfolioItem[];
  services: { tiers: LogoTier[]; singles: SingleService[] } | null;
  settings?: {
    headingLogo?: string;
    profilePhoto?: string;
  };
}> {
  const cleanId = extractSpreadsheetId(spreadsheetId);
  if (!cleanId) {
    return { portfolio: [], services: null };
  }

  // Sheet name candidates
  let portfolioSheetName = 'Portofolio';
  let servicesSheetName = 'Services';
  let settingsSheetName = 'Pengaturan';

  if (accessToken) {
    try {
      const meta = await fetchSpreadsheetMetadata(cleanId, accessToken);
      if (meta?.sheets?.length) {
        const titles: string[] = meta.sheets
          .map((s: any) => s.properties?.title || '')
          .filter(Boolean);

        const foundPort = titles.find((t) =>
          /portofolio|portfolio|karya|project|projek/i.test(t)
        );
        if (foundPort) portfolioSheetName = foundPort;
        else if (titles[0]) portfolioSheetName = titles[0];

        const foundSvc = titles.find((t) =>
          /service|layanan|paket|daftar harga/i.test(t)
        );
        if (foundSvc) servicesSheetName = foundSvc;

        const foundSet = titles.find((t) =>
          /pengaturan|setting|brand|profil/i.test(t)
        );
        if (foundSet) settingsSheetName = foundSet;
      }
    } catch {
      // Continue with standard names
    }
  }

  // Try reading Portfolio tab with multiple fallbacks
  let portfolioRows: any[][] = [];
  const portfolioCandidates = [
    `${portfolioSheetName}!A1:G100`,
    'Portofolio!A1:G100',
    'Portfolio!A1:G100',
    'Karya!A1:G100',
    'Sheet1!A1:G100',
    'Sheet 1!A1:G100',
  ];

  for (const candidate of [...new Set(portfolioCandidates)]) {
    try {
      portfolioRows = await readSheetRange(cleanId, candidate, accessToken);
      if (portfolioRows && portfolioRows.length > 0) break;
    } catch {
      // try next candidate
    }
  }

  // Try reading Services tab with multiple fallbacks
  let servicesRows: any[][] = [];
  const servicesCandidates = [
    `${servicesSheetName}!A1:E100`,
    'Services!A1:E100',
    'Layanan!A1:E100',
    'Paket!A1:E100',
    'Sheet2!A1:E100',
    'Sheet 2!A1:E100',
  ];

  for (const candidate of [...new Set(servicesCandidates)]) {
    try {
      servicesRows = await readSheetRange(cleanId, candidate, accessToken);
      if (servicesRows && servicesRows.length > 0) break;
    } catch {
      // try next candidate
    }
  }

  // Try reading Pengaturan (Settings / Branding) tab for Heading Logo & Profile Photo
  let settingsRows: any[][] = [];
  const settingsCandidates = [
    `${settingsSheetName}!A1:C20`,
    'Pengaturan!A1:C20',
    'Settings!A1:C20',
    'Branding!A1:C20',
    'Sheet3!A1:C20',
  ];

  for (const candidate of [...new Set(settingsCandidates)]) {
    try {
      settingsRows = await readSheetRange(cleanId, candidate, accessToken);
      if (settingsRows && settingsRows.length > 0) break;
    } catch {
      // try next candidate
    }
  }

  let headingLogo: string | undefined = undefined;
  let profilePhoto: string | undefined = undefined;

  if (settingsRows && settingsRows.length > 0) {
    settingsRows.forEach((row) => {
      const key = String(row[0] || '').toLowerCase().trim();
      const val = String(row[1] || '').trim();
      
      const isValidImgUrl = (url: string) => {
        const lower = url.toLowerCase();
        return lower.startsWith('http://') || lower.startsWith('https://') || lower.startsWith('data:image/') || lower.startsWith('/');
      };

      if (val && !val.toLowerCase().startsWith('nilai') && !val.toLowerCase().startsWith('url') && isValidImgUrl(val)) {
        if (key.includes('logo') || key.includes('heading')) {
          headingLogo = normalizeImageUrl(val);
        } else if (key.includes('profil') || key.includes('profile') || key.includes('foto')) {
          profilePhoto = normalizeImageUrl(val);
        }
      }
    });
  }

  const portfolio = portfolioRows.length > 0 ? parsePortfolioRows(portfolioRows) : [];
  const services = servicesRows.length > 0 ? parseServicesRows(servicesRows) : null;

  return {
    portfolio,
    services,
    settings: {
      headingLogo,
      profilePhoto,
    },
  };
}

/**
 * Fetch CMS persistent configuration from backend server
 * Allows HP and all devices to automatically know the connected spreadsheet
 */
export async function getCmsServerConfig(): Promise<{
  spreadsheetId?: string;
  lastSynced?: string | null;
  headingLogo?: string;
  profilePhoto?: string;
  portfolioList?: PortfolioItem[];
  servicesData?: { tiers: LogoTier[]; singles: SingleService[] } | null;
} | null> {
  try {
    const res = await fetch(`/api/cms/config?_t=${Date.now()}`, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store',
      },
    });
    if (res.ok) {
      const result = await res.json();
      if (result.success && result.data) {
        return result.data;
      }
    }
  } catch (err) {
    console.warn('Could not fetch /api/cms/config:', err);
  }
  return null;
}

/**
 * Save CMS persistent configuration to backend server
 */
export async function saveCmsServerConfig(data: {
  spreadsheetId?: string;
  headingLogo?: string;
  profilePhoto?: string;
  portfolioList?: PortfolioItem[];
  servicesData?: { tiers: LogoTier[]; singles: SingleService[] } | null;
}): Promise<boolean> {
  try {
    const res = await fetch('/api/cms/config', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store',
      },
      body: JSON.stringify(data),
    });
    return res.ok;
  } catch (err) {
    console.warn('Could not save to /api/cms/config:', err);
    return false;
  }
}

/**
 * Creates a complete template Google Spreadsheet in the user's Google Drive
 * with pre-formatted sheets: "Portofolio" and "Services".
 */
export async function createTemplateSpreadsheet(accessToken: string): Promise<{
  id: string;
  url: string;
  title: string;
}> {
  const payload = {
    properties: {
      title: 'Piulistrator - Data Portofolio & Services (CMS)',
    },
    sheets: [
      {
        properties: {
          title: 'Portofolio',
          gridProperties: { rowCount: 100, columnCount: 10 },
        },
      },
      {
        properties: {
          title: 'Services',
          gridProperties: { rowCount: 100, columnCount: 10 },
        },
      },
      {
        properties: {
          title: 'Pengaturan',
          gridProperties: { rowCount: 20, columnCount: 5 },
        },
      },
    ],
  };

  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!createRes.ok) {
    const err = await createRes.json().catch(() => ({}));
    throw new Error(
      err.error?.message || 'Gagal membuat Google Spreadsheet baru'
    );
  }

  const created = await createRes.json();
  const spreadsheetId = created.spreadsheetId;

  // Populate initial rows for Portofolio
  const portfolioValues = [
    ['Judul', 'Kategori', 'Keterangan', 'Gambar_URL', 'Klien', 'Tahun', 'Badge'],
    ...PORTFOLIO_ITEMS.map((item) => [
      item.title,
      item.category,
      item.description,
      item.imageUrl,
      item.client,
      item.year,
      item.badge || '',
    ]),
  ];

  // Populate initial rows for Services
  const servicesValues = [
    ['Paket', 'Kategori', 'Harga', 'Estimasi_Waktu', 'Fitur_Keterangan'],
    ...LOGO_TIERS.map((tier) => [
      tier.name,
      'Paket Logo',
      tier.price,
      tier.timeline,
      tier.features.map((f) => (f.boldPrefix || '') + f.text).join(' | '),
    ]),
    ...SINGLE_SERVICES.map((svc) => [
      svc.title,
      svc.category,
      svc.price,
      svc.turnaround,
      svc.description,
    ]),
  ];

  // Populate initial rows for Pengaturan (Branding & Logo)
  const settingsValues = [
    ['Kunci_Pengaturan', 'Nilai_URL', 'Keterangan_Panduan'],
    [
      'Logo_Studio_Heading',
      '',
      'URL gambar logo Piulistrator untuk ditampilkan pada heading atas website (Google Drive, Imgur, direct URL)',
    ],
    [
      'Foto_Profil_Desainer',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCxqQ-ucN89fxi5enfUfAbocuKUJ3zy0SVofUCngWraRtGgi8zEDPqy3okNfJMzrtclj7EV9gCyH4adTUVDa2Rpi1BuaPyKeTbNWC3O2mEwZvP1eAMy0BVuCsyXsqIZYq4hYrQYtWc74x9i_MY_l8hkiPMDNZNGC29OoKmmwB0d-SXz65x-ERv_VYlrCO8GRWaO_bqphw5ijBjA6cQ0XkhALO6YWwtJFiHz0Qj4s4EeKd1uYCLBII0f',
      'URL foto profil Syafi\'ul Kholqi pada kartu hero atas',
    ],
    ['Nama_Studio', 'Piulistrator Studio', 'Nama brand / studio'],
    ['Lokasi', 'Kudus, Jawa Tengah, ID', 'Lokasi domisili studio'],
  ];

  // Append initial values
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Portofolio!A1:G:append?valueInputOption=USER_ENTERED`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: portfolioValues }),
    }
  );

  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Services!A1:E:append?valueInputOption=USER_ENTERED`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: servicesValues }),
    }
  );

  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Pengaturan!A1:C:append?valueInputOption=USER_ENTERED`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: settingsValues }),
    }
  );

  return {
    id: spreadsheetId,
    url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
    title: 'Piulistrator - Data Portofolio & Services (CMS)',
  };
}

/**
 * Append a single portfolio row to Google Sheets
 */
export async function appendPortfolioRow(
  spreadsheetId: string,
  item: {
    title: string;
    category: string;
    description: string;
    imageUrl: string;
    client?: string;
    year?: string;
    badge?: string;
  },
  accessToken: string
) {
  const cleanImageUrl = normalizeImageUrl(item.imageUrl);
  const row = [
    item.title,
    item.category,
    item.description,
    cleanImageUrl,
    item.client || 'Klien Komersial',
    item.year || new Date().getFullYear().toString(),
    item.badge || '',
  ];

  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Portofolio!A1:G:append?valueInputOption=USER_ENTERED`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: [row] }),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Gagal menambahkan data ke Google Sheet');
  }

  return await res.json();
}

/**
 * Append a single service row to Google Sheets
 */
export async function appendServiceRow(
  spreadsheetId: string,
  service: {
    packageName: string;
    category: string;
    price: string;
    timeline?: string;
    description?: string;
  },
  accessToken: string
) {
  const row = [
    service.packageName,
    service.category,
    service.price,
    service.timeline || '1-2 Hari',
    service.description || '',
  ];

  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Services!A1:E:append?valueInputOption=USER_ENTERED`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: [row] }),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Gagal menambahkan layanan ke Google Sheet');
  }

  return await res.json();
}

/**
 * Parse portfolio rows from Google Sheets
 */
export function parsePortfolioRows(rows: any[][]): PortfolioItem[] {
  if (!rows || rows.length === 0) return [];

  const firstRowStr = (rows[0] || []).map((c) => String(c || '').toLowerCase()).join(' ');
  const hasHeader =
    firstRowStr.includes('judul') ||
    firstRowStr.includes('title') ||
    firstRowStr.includes('kategori') ||
    firstRowStr.includes('keterangan');
  const dataRows = hasHeader ? rows.slice(1) : rows;

  return dataRows
    .filter(
      (r) =>
        r[0] &&
        r[0].toString().trim() !== '' &&
        !['judul', 'title', 'nama karya'].includes(r[0].toString().trim().toLowerCase())
    )
    .map((row, index) => {
      const title = row[0]?.toString() || `Karya #${index + 1}`;
      const category = row[1]?.toString() || 'Desain Grafis';
      const description = row[2]?.toString() || 'Karya desain portofolio Piulistrator.';
      const rawImageUrl = row[3]?.toString().trim();
      const imageUrl = rawImageUrl ? normalizeImageUrl(rawImageUrl) : FALLBACK_PORTFOLIO_IMAGE;
      const client = row[4]?.toString() || 'Klien Komersial';
      const year = row[5]?.toString() || '2025';
      const badge = row[6]?.toString() || '';

      const categorySlug = category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const slugId = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');

      return {
        id: `sheet-item-${index}-${slugId || 'art'}`,
        title,
        category,
        categorySlug,
        client,
        year,
        date: `${year}`,
        description,
        tools: ['Adobe Illustrator', 'Photoshop'],
        deliverables: 'Format Cetak HD & Vektor Siap Pakai',
        imageUrl,
        hiResImageUrl: imageUrl,
        badge: badge ? badge : undefined,
        badgeType: 'primary',
        orderCategoryValue: `${category} - ${title}`,
      };
    });
}

/**
 * Parse services rows from Google Sheets
 */
export function parseServicesRows(rows: any[][]): {
  tiers: LogoTier[];
  singles: SingleService[];
} {
  if (!rows || rows.length === 0) {
    return { tiers: LOGO_TIERS, singles: SINGLE_SERVICES };
  }

  const firstRowStr = (rows[0] || []).map((c) => String(c || '').toLowerCase()).join(' ');
  const hasHeader =
    firstRowStr.includes('paket') ||
    firstRowStr.includes('harga') ||
    firstRowStr.includes('kategori');
  const dataRows = hasHeader ? rows.slice(1) : rows;

  const tiers: LogoTier[] = [];
  const singles: SingleService[] = [];

  dataRows
    .filter(
      (r) =>
        r[0] &&
        r[0].toString().trim() !== '' &&
        !['paket', 'layanan', 'service'].includes(r[0].toString().trim().toLowerCase())
    )
    .forEach((r, idx) => {
      const name = r[0]?.toString() || `Paket ${idx + 1}`;
      const category = r[1]?.toString() || 'Paket Logo';
      const price = r[2]?.toString() || 'Rp 100.000';
      const timeline = r[3]?.toString() || '1-2 Hari Kerja';
      const desc = r[4]?.toString() || '';

      const priceNum = parseInt(price.replace(/[^0-9]/g, ''), 10) || 100000;

      if (
        category.toLowerCase().includes('logo') ||
        ['silver', 'gold', 'platinum'].includes(name.toLowerCase())
      ) {
        const featuresList = desc
          ? desc.split('|').map((f) => ({ text: f.trim() }))
          : [{ text: 'File Format Resolusi Tinggi' }, { text: 'Revisi Terbimbing' }];

        tiers.push({
          id: `sheet-tier-${idx}`,
          name,
          tierLabel: name.toLowerCase().includes('gold') ? 'Rekomendasi Utama' : 'Pilihan Paket',
          price,
          priceNum,
          timeline,
          revisions: 'Revisi Fleksibel',
          features: featuresList,
          isPopular: name.toLowerCase().includes('gold'),
          orderValue: `Paket ${name} (${price})`,
        });
      } else {
        singles.push({
          id: `sheet-single-${idx}`,
          title: name,
          badge: category.slice(0, 10),
          category: (category as any) || 'Branding & Cetak',
          price: price.startsWith('Rp') ? price : `Mulai ${price}`,
          priceNum,
          turnaround: timeline,
          description: desc || 'Layanan desain profesional sesuai brief Anda.',
          orderValue: name,
          icon: 'design_services',
        });
      }
    });

  return {
    tiers: tiers.length > 0 ? tiers : LOGO_TIERS,
    singles: singles.length > 0 ? singles : SINGLE_SERVICES,
  };
}
