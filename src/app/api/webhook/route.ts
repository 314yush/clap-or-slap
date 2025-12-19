/**
 * Webhook endpoint for Base Mini-App notifications
 * Handles events from Farcaster/Base when users interact with the mini-app
 * 
 * Events:
 * - miniapp_added: User added the mini-app
 * - miniapp_removed: User removed the mini-app
 * - notifications_enabled: User enabled notifications
 * - notifications_disabled: User disabled notifications
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Log webhook event for debugging
    console.log('[Webhook] Received event:', {
      timestamp: new Date().toISOString(),
      event: body.event?.event,
      fid: body.fid,
      appFid: body.appFid,
    });
    
    // TODO: Verify webhook signature using @farcaster/miniapp-node
    // For now, we'll just log and acknowledge
    
    const { fid, appFid, event } = body;
    
    if (!event || !event.event) {
      return NextResponse.json(
        { success: false, error: 'Invalid event format' },
        { status: 400 }
      );
    }
    
    // Handle different event types
    switch (event.event) {
      case 'miniapp_added':
        // User added the mini-app to their profile
        console.log('[Webhook] Mini-app added by user:', fid);
        // Could send welcome notification here
        break;
        
      case 'miniapp_removed':
        // User removed the mini-app
        console.log('[Webhook] Mini-app removed by user:', fid);
        break;
        
      case 'notifications_enabled':
        // User enabled notifications - save notification details
        if (event.notificationDetails) {
          const { url, token } = event.notificationDetails;
          console.log('[Webhook] Notifications enabled for user:', fid, {
            url,
            token: token?.slice(0, 10) + '...', // Log partial token for security
          });
          // TODO: Store notification token in database for later use
          // You can use this to send push notifications to the user
        }
        break;
        
      case 'notifications_disabled':
        // User disabled notifications
        console.log('[Webhook] Notifications disabled for user:', fid);
        // TODO: Remove notification token from database
        break;
        
      default:
        console.log('[Webhook] Unknown event type:', event.event);
    }
    
    // Always return 200 to acknowledge receipt
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('[Webhook] Error processing webhook:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle GET requests (for webhook verification/testing)
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Webhook endpoint is active',
    timestamp: new Date().toISOString(),
  });
}
