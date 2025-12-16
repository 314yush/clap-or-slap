import { NextRequest, NextResponse } from 'next/server';
import { trackEvent, trackEvents, AnalyticsEvent } from '@/lib/analytics';

/**
 * POST /api/analytics/track
 * 
 * Track analytics events from the client.
 * Accepts single event or batch of events.
 * 
 * Body: { event: AnalyticsEvent } or { events: AnalyticsEvent[] }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Handle batch events
    if (body.events && Array.isArray(body.events)) {
      await trackEvents(body.events as AnalyticsEvent[]);
      return NextResponse.json({ 
        success: true, 
        tracked: body.events.length 
      });
    }
    
    // Handle single event
    if (body.event) {
      await trackEvent(body.event as AnalyticsEvent);
      return NextResponse.json({ 
        success: true, 
        tracked: 1 
      });
    }
    
    return NextResponse.json(
      { success: false, error: 'No event or events provided' },
      { status: 400 }
    );
    
  } catch (error) {
    console.error('[Analytics API] Error:', error);
    
    // Don't fail the request - analytics should be non-blocking
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to track event' 
    });
  }
}

/**
 * GET /api/analytics/track
 * 
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({ 
    status: 'ok',
    enabled: process.env.ANALYTICS_ENABLED !== 'false',
  });
}

