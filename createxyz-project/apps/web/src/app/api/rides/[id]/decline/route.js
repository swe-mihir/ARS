import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

export async function POST(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id: rideId } = params;
    if (!rideId) {
      return Response.json({ error: "Missing ride ID" }, { status: 400 });
    }

    const body = await request.json();
    const { reason } = body;

    // Get user profile to ensure they are a driver
    const userResult = await sql`
      SELECT id, role FROM users WHERE email = ${session.user.email}
    `;

    if (userResult.length === 0) {
      return Response.json({ error: "User profile not found" }, { status: 404 });
    }

    const user = userResult[0];
    if (user.role !== 'driver') {
      return Response.json({ error: "Only drivers can decline rides" }, { status: 403 });
    }

    // Get ride match details
    const matchResult = await sql`
      SELECT rm.id as match_id, rm.status as match_status,
             r.id as ride_id, r.status as ride_status, r.passenger_id
      FROM ride_matches rm
      JOIN rides r ON rm.ride_id = r.id
      WHERE rm.ride_id = ${rideId} 
        AND rm.driver_id = ${user.id}
        AND rm.status = 'pending'
    `;

    if (matchResult.length === 0) {
      return Response.json({ error: "No pending match found for this ride" }, { status: 404 });
    }

    const match = matchResult[0];

    // Update match status to declined
    await sql`
      UPDATE ride_matches 
      SET status = 'declined', 
          responded_at = CURRENT_TIMESTAMP
      WHERE id = ${match.match_id}
    `;

    // Check if there are any other pending matches for this ride
    const remainingMatches = await sql`
      SELECT COUNT(*) as count FROM ride_matches 
      WHERE ride_id = ${rideId} AND status = 'pending'
    `;

    const hasRemainingMatches = parseInt(remainingMatches[0].count) > 0;

    // If no more pending matches, try to find new drivers
    if (!hasRemainingMatches && match.ride_status === 'requested') {
      try {
        // Trigger another round of matching
        const matchResponse = await fetch(new URL('/api/rides/match', request.url), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ride_id: rideId })
        });

        if (!matchResponse.ok) {
          console.error('Re-matching failed:', await matchResponse.text());
        }
      } catch (matchError) {
        console.error('Error triggering re-matching:', matchError);
      }
    }

    // Optional: Create notification about decline
    if (reason) {
      await sql`
        INSERT INTO notifications (user_id, title, message, type, data)
        VALUES (
          ${user.id},
          'Ride Declined',
          ${`You declined a ride request. Reason: ${reason}`},
          'ride_declined_by_driver',
          ${JSON.stringify({ ride_id: rideId, reason })}
        )
      `;
    }

    return Response.json({
      success: true,
      message: "Ride declined successfully",
      remaining_matches: hasRemainingMatches,
      re_matching_triggered: !hasRemainingMatches
    });

  } catch (error) {
    console.error('Decline ride error:', error);
    return Response.json({ error: "Failed to decline ride" }, { status: 500 });
  }
}