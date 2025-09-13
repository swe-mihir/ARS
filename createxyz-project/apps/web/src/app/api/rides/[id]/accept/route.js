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

    // Get user profile to ensure they are a driver
    const userResult = await sql`
      SELECT id, role FROM users WHERE email = ${session.user.email}
    `;

    if (userResult.length === 0) {
      return Response.json({ error: "User profile not found" }, { status: 404 });
    }

    const user = userResult[0];
    if (user.role !== 'driver') {
      return Response.json({ error: "Only drivers can accept rides" }, { status: 403 });
    }

    // Check if driver is available
    const driverProfile = await sql`
      SELECT is_available, is_verified FROM driver_profiles 
      WHERE user_id = ${user.id}
    `;

    if (driverProfile.length === 0 || !driverProfile[0].is_available || !driverProfile[0].is_verified) {
      return Response.json({ error: "Driver not available or not verified" }, { status: 403 });
    }

    // Get ride details and check if there's a pending match for this driver
    const matchResult = await sql`
      SELECT rm.id as match_id, rm.status as match_status,
             r.id as ride_id, r.status as ride_status, r.passenger_id, 
             r.pickup_address, r.dropoff_address
      FROM ride_matches rm
      JOIN rides r ON rm.ride_id = r.id
      WHERE rm.ride_id = ${rideId} 
        AND rm.driver_id = ${user.id}
        AND rm.status = 'pending'
        AND r.status IN ('requested')
    `;

    if (matchResult.length === 0) {
      return Response.json({ error: "No pending match found for this ride" }, { status: 404 });
    }

    const match = matchResult[0];

    // Use transaction to ensure atomicity
    const results = await sql.transaction([
      // Update ride status and assign driver
      sql`
        UPDATE rides 
        SET driver_id = ${user.id}, 
            status = 'matched',
            matched_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${rideId} AND status = 'requested'
      `,
      
      // Update this match to accepted
      sql`
        UPDATE ride_matches 
        SET status = 'accepted', responded_at = CURRENT_TIMESTAMP
        WHERE id = ${match.match_id}
      `,
      
      // Mark other matches for this ride as expired
      sql`
        UPDATE ride_matches 
        SET status = 'expired', responded_at = CURRENT_TIMESTAMP
        WHERE ride_id = ${rideId} AND driver_id != ${user.id} AND status = 'pending'
      `,

      // Set driver as temporarily unavailable (they now have an active ride)
      sql`
        UPDATE driver_profiles 
        SET is_available = false, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ${user.id}
      `,

      // Notify passenger about the match
      sql`
        INSERT INTO notifications (user_id, title, message, type, data)
        VALUES (
          ${match.passenger_id},
          'Driver Accepted Your Ride!',
          'Your driver is on the way to pick you up',
          'ride_accepted',
          ${JSON.stringify({ ride_id: rideId, driver_id: user.id })}
        )
      `,

      // Create notification for driver with next steps
      sql`
        INSERT INTO notifications (user_id, title, message, type, data)
        VALUES (
          ${user.id},
          'Ride Accepted',
          ${`Navigate to pickup: ${match.pickup_address}`},
          'ride_navigation',
          ${JSON.stringify({ ride_id: rideId, action: 'navigate_to_pickup' })}
        )
      `,

      // Get updated ride details for response
      sql`
        SELECT r.id, r.passenger_id, r.pickup_address, r.dropoff_address, r.status,
               r.matched_at, p.name as passenger_name, p.phone as passenger_phone
        FROM rides r
        JOIN users p ON r.passenger_id = p.id
        WHERE r.id = ${rideId}
      `
    ]);

    const updatedRide = results[6][0]; // Last query result

    return Response.json({
      success: true,
      message: "Ride accepted successfully",
      ride: {
        id: updatedRide.id,
        passenger: {
          name: updatedRide.passenger_name,
          phone: updatedRide.passenger_phone
        },
        pickup_address: updatedRide.pickup_address,
        dropoff_address: updatedRide.dropoff_address,
        status: updatedRide.status,
        matched_at: updatedRide.matched_at
      }
    });

  } catch (error) {
    console.error('Accept ride error:', error);
    return Response.json({ error: "Failed to accept ride" }, { status: 500 });
  }
}