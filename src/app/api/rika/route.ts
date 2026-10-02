import { NextResponse } from 'next/server';

// Fallback in-memory cache for dev server fast-refresh deduplication
let memoryCache: any = null;
let lastFetchTime = 0;
const CACHE_TTL = 60000;

export async function GET() {
  const now = Date.now();
  if (memoryCache && (now - lastFetchTime < CACHE_TTL)) {
    return NextResponse.json(memoryCache);
  }

  try {
    const url = 'https://cloud-en.rikacloud.com/service/user/api/getDeviceData/r20230704';
    // Use Next.js Data Cache to deduplicate concurrent requests across all clients
    const response = await fetch(url, { 
      next: { revalidate: 60 },
      headers: {
        'Accept': 'application/json'
      },
      signal: AbortSignal.timeout(8000)
    });
    
    if (!response.ok) {
      console.warn(`[RIKA API] Endpoint returned status ${response.status}. Falling back gracefully.`);
      return NextResponse.json({ fallback: true });
    }
    
    const data = await response.json();
    
    memoryCache = data;
    lastFetchTime = now;
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('[RIKA API] Connection Error:', error);
    // Graceful fallback instead of crashing with 500
    return NextResponse.json({ fallback: true });
  }
}
