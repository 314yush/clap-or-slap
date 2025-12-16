import { NextRequest, NextResponse } from 'next/server';
import { getDailyMetrics, getStreakDistribution } from '@/lib/analytics';

/**
 * GET /api/analytics/metrics
 * 
 * Get analytics metrics for admin dashboard.
 * Query params:
 *   - date: YYYY-MM-DD (optional, defaults to today)
 *   - include: comma-separated list of metrics to include
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || undefined;
    const include = searchParams.get('include')?.split(',') || ['all'];
    
    const response: Record<string, unknown> = {};
    
    // Get daily metrics
    if (include.includes('all') || include.includes('daily')) {
      response.daily = await getDailyMetrics(date);
    }
    
    // Get streak distribution
    if (include.includes('all') || include.includes('streaks')) {
      response.streakDistribution = await getStreakDistribution(30);
    }
    
    return NextResponse.json({
      success: true,
      date: date || new Date().toISOString().split('T')[0],
      metrics: response,
    });
    
  } catch (error) {
    console.error('[Analytics Metrics API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch metrics' },
      { status: 500 }
    );
  }
}

