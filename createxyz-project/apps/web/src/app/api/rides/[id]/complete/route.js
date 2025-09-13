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
    const { actual_distance, actual_duration, completed_by } = body;

    // Get user profile
    const userResult = await sql`
      SELECT id, role FROM users WHERE email = ${session.user.email}
    `;

    if (userResult.length === 0) {
      return Response.json({ error: "User profile not found" }, { status: 404 });
    }

    const user = userResult[0];

    // Get ride details and verify user can complete this ride
    let rideResult;
    if (user.role === 'driver') {
      rideResult = await sql`
        SELECT r.id, r.passenger_id, r.driver_id, r.status, r.pickup_address, r.dropoff_address,
               r.started_at, p.name as passenger_name
        FROM rides r
        JOIN users p ON r.passenger_id = p.id
        WHERE r.id = ${rideId} 
          AND r.driver_id = ${user.id} 
          AND r.status IN ('matched', 'in_progress')
      `;
    } else if (user.role === 'passenger') {
      rideResult = await sql`
        SELECT r.id, r.passenger_id, r.driver_id, r.status, r.pickup_address, r.dropoff_address,
               r.started_at, d.name as driver_name
        FROM rides r
        JOIN users d ON r.driver_id = d.id
        WHERE r.id = ${rideId} 
          AND r.passenger_id = ${user.id} 
          AND r.status IN ('matched', 'in_progress')
      `;
    } else {
      return Response.json({ error: "Only passengers and drivers can complete rides" }, { status: 403 });
    }

    if (rideResult.length === 0) {
      return Response.json({ error: "Ride not found or cannot be completed" }, { status: 404 });
    }

    const ride = rideResult[0];

    // If ride hasn't been started yet, mark it as started first
    let startedAt = ride.started_at;
    if (!startedAt) {
      await sql`
        UPDATE rides 
        SET status = 'in_progress', 
            started_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${rideId}
      `;
      startedAt = new Date();
    }

    // Calculate actual duration if not provided
    let calculatedDuration = actual_duration;
    if (!calculatedDuration && startedAt) {
      const durationMs = Date.now() - new Date(startedAt).getTime();
      calculatedDuration = Math.ceil(durationMs / (1000 * 60)); // Convert to minutes
    }

    // Use transaction to complete the ride
    const results = await sql.transaction([
      // Update ride to completed
      sql`
        UPDATE rides 
        SET status = 'completed',
            completed_at = CURRENT_TIMESTAMP,
            actual_distance = ${actual_distance || null},
            actual_duration = ${calculatedDuration || null},
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${rideId}
      `,

      // Update driver stats and make them available again
      sql`
        UPDATE driver_profiles 
        SET total_rides = total_rides + 1,
            is_available = true,
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ${ride.driver_id}
      `,

      // Create notification for passenger (if completed by driver)
      user.role === 'driver' ? sql`
        INSERT INTO notifications (user_id, title, message, type, data)
        VALUES (
          ${ride.passenger_id},
          'Ride Completed',
          'Your ride has been completed. Please rate your driver!',
          'ride_completed',
          ${JSON.stringify({ ride_id: rideId, driver_id: ride.driver_id, action: 'rate_driver' })}
        )
      ` : sql`SELECT 1`, // No-op if passenger completed

      // Create notification for driver (if completed by passenger)
      user.role === 'passenger' ? sql`
        INSERT INTO notifications (user_id, title, message, type, data)
        VALUES (
          ${ride.driver_id},
          'Ride Completed',
          'The ride has been completed. Please rate your passenger!',
          'ride_completed',
          ${JSON.stringify({ ride_id: rideId, passenger_id: ride.passenger_id, action: 'rate_passenger' })}
        )
      ` : sql`SELECT 1`, // No-op if driver completed

      // Get updated ride details
      sql`
        SELECT r.id, r.status, r.completed_at, r.actual_distance, r.actual_duration,
               r.pickup_address, r.dropoff_address,
               p.name as passenger_name, d.name as driver_name
        FROM rides r
        JOIN users p ON r.passenger_id = p.id
        JOIN users d ON r.driver_id = d.id
        WHERE r.id = ${rideId}
      `
    ]);

    const completedRide = results[4][0]; // Last query result

    return Response.json({
      success: true,
      message: "Ride completed successfully",
      ride: {
        id: completedRide.id,
        status: completedRide.status,
        pickup_address: completedRide.pickup_address,
        dropoff_address: completedRide.dropoff_address,
        completed_at: completedRide.completed_at,
        actual_distance: parseFloat(completedRide.actual_distance || 0),
        actual_duration: completedRide.actual_duration,
        passenger_name: completedRide.passenger_name,
        driver_name: completedRide.driver_name,
        completed_by: user.role
      }
    });

  } catch (error) {
    console.error('Complete ride error:', error);
    return Response.json({ error: "Failed to complete ride" }, { status: 500 });
  }
}

// Start a ride (when driver arrives at pickup)
export async function PUT(request, { params }) {
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
      return Response.json({ error: "Only drivers can start rides" }, { status: 403 });
    }

    // Get ride details and verify driver can start this ride
    const rideResult = await sql`
      SELECT r.id, r.passenger_id, r.status, r.pickup_address, r.dropoff_address,
             p.name as passenger_name
      FROM rides r
      JOIN users p ON r.passenger_id = p.id
      WHERE r.id = ${rideId} 
        AND r.driver_id = ${user.id} 
        AND r.status = 'matched'
    `;

    if (rideResult.length === 0) {
      return Response.json({ error: "Ride not found or cannot be started" }, { status: 404 });
    }

    const ride = rideResult[0];

    // Start the ride
    await sql`
      UPDATE rides 
      SET status = 'in_progress',
          started_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${rideId}
    `;

    // Notify passenger that ride has started
    await sql`
      INSERT INTO notifications (user_id, title, message, type, data)
      VALUES (
        ${ride.passenger_id},
        'Ride Started',
        'Your driver has started the trip. Enjoy your ride!',
        'ride_started',
        ${JSON.stringify({ ride_id: rideId })}
      )
    `;

    return Response.json({
      success: true,
      message: "Ride started successfully",
      ride: {
        id: ride.id,
        status: 'in_progress',
        pickup_address: ride.pickup_address,
        dropoff_address: ride.dropoff_address,
        passenger_name: ride.passenger_name
      }
    });

  } catch (error) {
    console.error('Start ride error:', error);
    return Response.json({ error: "Failed to start ride" }, { status: 500 });
  }
}