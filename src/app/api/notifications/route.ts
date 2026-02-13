import { NextRequest, NextResponse } from 'next/server';

// Notifications feature has been deprecated/removed.
// Keep a no-op API surface so existing clients don't break.

export async function GET(_request: NextRequest) {
  return NextResponse.json({
    success: true,
    data: { notifications: [], unreadCount: 0 },
    message: 'Notifications feature has been disabled',
  });
}

export async function POST(_request: NextRequest) {
  return NextResponse.json(
    {
      success: false,
      error: 'Notifications feature has been disabled',
    },
    { status: 410 }
  );
}

export async function PATCH(_request: NextRequest) {
  return NextResponse.json(
    {
      success: false,
      error: 'Notifications feature has been disabled',
    },
    { status: 410 }
  );
}

