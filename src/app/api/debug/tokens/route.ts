import { NextResponse } from 'next/server';
import { 
  getTokenPool, 
  refreshTokenPool, 
  getDataSourceStatus, 
  testDataSources,
  getCachedTokens 
} from '@/lib/data/token-pool';

/**
 * GET /api/debug/tokens
 * Debug endpoint to check token pool status
 */
export async function GET() {
  try {
    const status = getDataSourceStatus();
    const cachedTokens = getCachedTokens();
    
    // Get a sample of tokens
    const tokenSample = cachedTokens.slice(0, 10).map(t => ({
      symbol: t.symbol,
      name: t.name,
      marketCap: t.marketCap,
      chain: t.chain,
    }));

    return NextResponse.json({
      success: true,
      status,
      tokenCount: cachedTokens.length,
      tokenSample,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to get token status' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/debug/tokens
 * Force refresh the token pool and test data sources
 */
export async function POST() {
  try {
    // Test data source connections
    const testResults = await testDataSources();
    
    // Force refresh the pool
    const tokens = await refreshTokenPool();
    
    // Get status after refresh
    const status = getDataSourceStatus();
    
    // Get a sample of tokens
    const tokenSample = tokens.slice(0, 15).map(t => ({
      symbol: t.symbol,
      name: t.name,
      marketCap: t.marketCap,
      chain: t.chain,
      logoUrl: t.logoUrl,
    }));

    return NextResponse.json({
      success: true,
      testResults,
      status,
      tokenCount: tokens.length,
      tokenSample,
    });
  } catch (error) {
    console.error('Debug tokens error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

