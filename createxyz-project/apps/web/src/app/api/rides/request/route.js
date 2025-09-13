import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

export async function POST(request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const { 
      pickup_latitude, 
      pickup_longitude, 
      pickup_address,
      dropoff_latitude, 
      dropoff_longitude, 
      dropoff_address 
    } = body;

    // Validate required fields
    if (!pickup_latitude || !pickup_longitude || !pickup_address ||
        !dropoff_latitude || !dropoff_longitude || !dropoff_address) {
      return Response.json({ error: "Missing required location information" }, { status: 400 });
    }

    // Get user profile to ensure they are a passenger
    const userResult = await sql`
      SELECT id, role FROM users WHERE email = ${session.user.email}
    `;

    if (userResult.length === 0) {
      return Response.json({ error: "User profile not found" }, { status: 404 });
    }

    const user = userResult[0];
    if (user.role !== 'passenger') {
      return Response.json({ error: "Only passengers can request rides" }, { status: 403 });
    }

    // Check if user has any active ride requests
    const activeRides = await sql`
      SELECT id FROM rides 
      WHERE passenger_id = ${user.id} 
      AND status IN ('requested', 'matched', 'in_progress')
    `;

    if (activeRides.length > 0) {
      return Response.json({ error: "You already have an active ride request" }, { status: 400 });
    }

    // Calculate estimated distance (simple Haversine formula approximation)
    const calculateDistance = (lat1, lon1, lat2, lon2) => {
      const R = 6371; // Earth's radius in kilometers
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c;
    };

    const estimatedDistance = calculateDistance(
      parseFloat(pickup_latitude),
      parseFloat(pickup_longitude),
      parseFloat(dropoff_latitude),
      parseFloat(dropoff_longitude)
    );

    // Estimated duration (assuming average speed of 30 km/h in city)
    const estimatedDuration = Math.ceil(estimatedDistance / 30 * 60); // in minutes

    // Create ride request
    const rideResult = await sql`
      INSERT INTO rides (
        passenger_id,
        pickup_location,
        pickup_address,
        dropoff_location,
        dropoff_address,
        status,
        estimated_distance,
        estimated_duration,
        requested_at
      ) VALUES (
        ${user.id},
        ST_GeogFromText(${`POINT(${pickup_longitude} ${pickup_latitude})`}),
        ${pickup_address},
        ST_GeogFromText(${`POINT(${dropoff_longitude} ${dropoff_latitude})`}),
        ${dropoff_address},
        'requested',
        ${estimatedDistance.toFixed(2)},
        ${estimatedDuration},
        CURRENT_TIMESTAMP
      )
      RETURNING id, passenger_id, pickup_address, dropoff_address, status, 
                estimated_distance, estimated_duration, requested_at
    `;

    const ride = rideResult[0];

    // Trigger ride matching process (find available drivers)
    try {
      const matchResponse = await fetch(new URL('/api/rides/match', request.url), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ride_id: ride.id })
      });

      if (!matchResponse.ok) {
        console.error('Ride matching failed:', await matchResponse.text());
      }
    } catch (matchError) {
      console.error('Error triggering ride matching:', matchError);
      // Don't fail the ride request if matching fails - it can be retried
    }

    return Response.json({
      success: true,
      ride: {
        id: ride.id,
        passenger_id: ride.passenger_id,
        pickup_address: ride.pickup_address,
        dropoff_address: ride.dropoff_address,
        status: ride.status,
        estimated_distance: parseFloat(ride.estimated_distance),
        estimated_duration: ride.estimated_duration,
        requested_at: ride.requested_at
      }
    });

  } catch (error) {
    console.error('Ride request error:', error);
    return Response.json({ error: "Failed to create ride request" }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get user profile
    const userResult = await sql`
      SELECT id, role FROM users WHERE email = ${session.user.email}
    `;

    if (userResult.length === 0) {
      return Response.json({ error: "User profile not found" }, { status: 404 });
    }

    const user = userResult[0];

    let rides;
    
    if (user.role === 'passenger') {
      // Get passenger's ride requests
      rides = await sql`
        SELECT r.id, r.pickup_address, r.dropoff_address, r.status, 
               r.estimated_distance, r.estimated_duration, r.requested_at,
               r.matched_at, r.started_at, r.completed_at,
               d.name as driver_name, d.phone as driver_phone,
               dp.vehicle_make, dp.vehicle_model, dp.license_plate,
               ST_X(r.pickup_location::geometry) as pickup_longitude,
               ST_Y(r.pickup_location::geometry) as pickup_latitude,
               ST_X(r.dropoff_location::geometry) as dropoff_longitude,
               ST_Y(r.dropoff_location::geometry) as dropoff_latitude
        FROM rides r
        LEFT JOIN users d ON r.driver_id = d.id
        LEFT JOIN driver_profiles dp ON d.id = dp.user_id
        WHERE r.passenger_id = ${user.id}
        ORDER BY r.requested_at DESC
      `;
    } else if (user.role === 'driver') {
      // Get driver's assigned rides
      rides = await sql`
        SELECT r.id, r.pickup_address, r.dropoff_address, r.status, 
               r.estimated_distance, r.estimated_duration, r.requested_at,
               r.matched_at, r.started_at, r.completed_at,
               p.name as passenger_name, p.phone as passenger_phone,
               ST_X(r.pickup_location::geometry) as pickup_longitude,
               ST_Y(r.pickup_location::geometry) as pickup_latitude,
               ST_X(r.dropoff_location::geometry) as dropoff_longitude,
               ST_Y(r.dropoff_location::geometry) as dropoff_latitude
        FROM rides r
        JOIN users p ON r.passenger_id = p.id
        WHERE r.driver_id = ${user.id}
        ORDER BY r.requested_at DESC
      `;
    } else {
      // Admin can see all rides
      rides = await sql`
        SELECT r.id, r.pickup_address, r.dropoff_address, r.status, 
               r.estimated_distance, r.estimated_duration, r.requested_at,
               r.matched_at, r.started_at, r.completed_at,
               p.name as passenger_name, p.phone as passenger_phone,
               d.name as driver_name, d.phone as driver_phone,
               dp.vehicle_make, dp.vehicle_model, dp.license_plate,
               ST_X(r.pickup_location::geometry) as pickup_longitude,
               ST_Y(r.pickup_location::geometry) as pickup_latitude,
               ST_X(r.dropoff_location::geometry) as dropoff_longitude,
               ST_Y(r.dropoff_location::geometry) as dropoff_latitude
        FROM rides r
        JOIN users p ON r.passenger_id = p.id
        LEFT JOIN users d ON r.driver_id = d.id
        LEFT JOIN driver_profiles dp ON d.id = dp.user_id
        ORDER BY r.requested_at DESC
        LIMIT 50
      `;
    }

    // Format the response
    const formattedRides = rides.map(ride => ({
      id: ride.id,
      pickup_address: ride.pickup_address,
      dropoff_address: ride.dropoff_address,
      status: ride.status,
      estimated_distance: parseFloat(ride.estimated_distance || 0),
      estimated_duration: ride.estimated_duration,
      requested_at: ride.requested_at,
      matched_at: ride.matched_at,
      started_at: ride.started_at,
      completed_at: ride.completed_at,
      pickup_location: {
        latitude: parseFloat(ride.pickup_latitude),
        longitude: parseFloat(ride.pickup_longitude)
      },
      dropoff_location: {
        latitude: parseFloat(ride.dropoff_latitude),
        longitude: parseFloat(ride.dropoff_longitude)
      },
      passenger: ride.passenger_name ? {
        name: ride.passenger_name,
        phone: ride.passenger_phone
      } : null,
      driver: ride.driver_name ? {
        name: ride.driver_name,
        phone: ride.driver_phone,
        vehicle: ride.vehicle_make ? {
          make: ride.vehicle_make,
          model: ride.vehicle_model,
          license_plate: ride.license_plate
        } : null
      } : null
    }));

    return Response.json({ rides: formattedRides });

  } catch (error) {
    console.error('Get rides error:', error);
    return Response.json({ error: "Failed to get rides" }, { status: 500 });
  }
}