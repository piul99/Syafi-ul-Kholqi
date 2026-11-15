/**
 * Utility helper to normalize and convert various image hosting URLs
 * into direct, embeddable web image URLs (especially Google Drive, Dropbox, Imgur).
 */

export const FALLBACK_PORTFOLIO_IMAGE =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDbxplKDekzVHCtmHkiWFkYX8EcCctFsdayrOfddPdV_CCnXLE6kkMc1ezcTJqn6LzTTsTxFXgOtPI-hoicfyHQ5XZwsP5gCH_tRjZChblSjkpwC8CDlOQtDGgAtXMokspV-nS2Cms1__pqPtKC0avfChjLM4nnQhjeSjzpE3VHIM5DR8085PJiMa80nlHpvP5RK5A_8wRumOgzV95FZs_aBvGulVvQMqQsgNqJRXWL4j_3WOwKZ8mp';

/**
 * Extract Google Drive File ID from various link formats:
 * - https://drive.google.com/file/d/1AbC.../view?usp=sharing
 * - https://drive.google.com/open?id=1AbC...
 * - https://drive.google.com/uc?id=1AbC...
 * - https://docs.google.com/file/d/1AbC...
 */
export function extractGoogleDriveId(url: string): string | null {
  if (!url) return null;
  const str = url.trim();

  // If already data or blob URL, skip
  if (str.startsWith('data:') || str.startsWith('blob:')) return null;

  // Pattern 1: /file/d/{id} or /d/{id}
  const matchD = str.match(/\/(?:file\/)?d\/([a-zA-Z0-9_-]{20,})/);
  if (matchD && matchD[1]) {
    return matchD[1];
  }

  // Pattern 2: ?id={id} or &id={id}
  const matchId = str.match(/[?&]id=([a-zA-Z0-9_-]{20,})/);
  if (matchId && matchId[1]) {
    return matchId[1];
  }

  // Pattern 3: thumbnail?id={id}
  const matchThumb = str.match(/thumbnail\?id=([a-zA-Z0-9_-]{20,})/);
  if (matchThumb && matchThumb[1]) {
    return matchThumb[1];
  }

  // Pattern 4: raw Drive ID directly pasted (typically 25-45 chars alphanumeric with _ -)
  if (/^[a-zA-Z0-9_-]{25,45}$/.test(str)) {
    return str;
  }

  return null;
}

/**
 * Convert any image URL (Google Drive, Dropbox, Imgur, direct link)
 * into a directly displayable image link.
 */
export function normalizeImageUrl(rawUrl: string): string {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return FALLBACK_PORTFOLIO_IMAGE;
  }

  let url = rawUrl.trim();

  // Data URLs (e.g. from local file uploads) and Blob URLs
  if (url.startsWith('data:image/') || url.startsWith('blob:')) {
    return url;
  }

  // Remove potential quotes or markdown wrapper: ![alt](url)
  url = url.replace(/^['"]|['"]$/g, '');
  const mdMatch = url.match(/!\[.*?\]\((.*?)\)/);
  if (mdMatch && mdMatch[1]) {
    url = mdMatch[1].trim();
  }

  // 1. Google Drive conversion
  // drive.google.com/thumbnail?id=ID&sz=w1200 is the most robust cross-origin embeddable link
  const driveId = extractGoogleDriveId(url);
  if (driveId) {
    return `https://drive.google.com/thumbnail?id=${driveId}&sz=w1200`;
  }

  // 2. Dropbox conversion (dl=0 -> raw=1)
  if (url.includes('dropbox.com')) {
    if (url.includes('dl=0')) {
      return url.replace('dl=0', 'raw=1');
    }
    if (!url.includes('raw=1')) {
      const separator = url.includes('?') ? '&' : '?';
      return `${url}${separator}raw=1`;
    }
    return url;
  }

  // 3. Imgur web page conversion (imgur.com/xyz -> i.imgur.com/xyz.jpg)
  if (url.includes('imgur.com') && !url.includes('i.imgur.com')) {
    const imgurMatch = url.match(/imgur\.com\/([a-zA-Z0-9]+)$/);
    if (imgurMatch && imgurMatch[1]) {
      return `https://i.imgur.com/${imgurMatch[1]}.jpg`;
    }
  }

  // 4. Postimages / ImgBB direct link cleanup
  return url;
}

/**
 * Get an alternative Google Drive URL in case primary thumbnail fails
 */
export function getDriveThumbnailUrl(rawUrl: string): string | null {
  const driveId = extractGoogleDriveId(rawUrl);
  if (driveId) {
    return `https://lh3.googleusercontent.com/d/${driveId}`;
  }
  return null;
}

/**
 * Get multiple alternative candidate URLs to maximize display reliability
 */
export function getAlternativeImageUrls(rawUrl: string): string[] {
  if (!rawUrl || typeof rawUrl !== 'string') return [FALLBACK_PORTFOLIO_IMAGE];
  const trimmed = rawUrl.trim();
  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) return [trimmed];

  const driveId = extractGoogleDriveId(trimmed);
  if (driveId) {
    return [
      `https://drive.google.com/thumbnail?id=${driveId}&sz=w1200`,
      `https://lh3.googleusercontent.com/d/${driveId}`,
      `https://drive.google.com/uc?export=view&id=${driveId}`,
      FALLBACK_PORTFOLIO_IMAGE,
    ];
  }

  const normalized = normalizeImageUrl(trimmed);
  if (normalized !== FALLBACK_PORTFOLIO_IMAGE) {
    return [normalized, trimmed, FALLBACK_PORTFOLIO_IMAGE];
  }
  return [FALLBACK_PORTFOLIO_IMAGE];
}

/**
 * Identify URL type for user feedback in modal forms
 */
export function inspectImageUrl(rawUrl: string): {
  type: 'google-drive' | 'dropbox' | 'imgur' | 'direct' | 'empty';
  normalizedUrl: string;
  driveId?: string | null;
  advice?: string;
} {
  if (!rawUrl || !rawUrl.trim()) {
    return { type: 'empty', normalizedUrl: '' };
  }

  const driveId = extractGoogleDriveId(rawUrl);
  if (driveId) {
    return {
      type: 'google-drive',
      normalizedUrl: `https://lh3.googleusercontent.com/d/${driveId}`,
      driveId,
      advice:
        'Tautan Google Drive terdeteksi! Pastikan izin file disetel ke: "Siapa saja yang memiliki link" (Anyone with the link - Viewer) agar gambar dapat diakses publik.',
    };
  }

  if (rawUrl.includes('dropbox.com')) {
    return {
      type: 'dropbox',
      normalizedUrl: normalizeImageUrl(rawUrl),
      advice: 'Tautan Dropbox terdeteksi dan telah diubah ke format raw direct image.',
    };
  }

  if (rawUrl.includes('imgur.com')) {
    return {
      type: 'imgur',
      normalizedUrl: normalizeImageUrl(rawUrl),
      advice: 'Tautan Imgur terdeteksi dan telah diubah ke format direct image.',
    };
  }

  return {
    type: 'direct',
    normalizedUrl: rawUrl.trim(),
  };
}
