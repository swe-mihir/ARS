import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

export async function POST(request) {
  try {
    const body = await request.json();
    const { ride_id } = body;

    if (!ride_id) {
      return Response.json({ error: "Missing ride_id" }, { status: 400 });
    }

    // Get ride details
    const rideResult = await sql`
      SELECT r.id, r.passenger_id, r.pickup_address, r.dropoff_address, r.status,
             ST_X(r.pickup_location::geometry) as pickup_longitude,
             ST_Y(r.pickup_location::geometry) as pickup_latitude,
             ST_X(r.dropoff_location::geometry) as dropoff_longitude,
             ST_Y(r.dropoff_location::geometry) as dropoff_latitude
      FROM rides r
      WHERE r.id = ${ride_id} AND r.status = 'requested'
    `;

    if (rideResult.length === 0) {
      return Response.json({ error: "Ride not found or not available for matching" }, { status: 404 });
    }

    const ride = rideResult[0];

    // Find available drivers within a reasonable radius (10km)
    const availableDrivers = await sql`
      SELECT u.id, u.name, u.phone,
             dp.vehicle_make, dp.vehicle_model, dp.license_plate, dp.rating, dp.total_rides,
             ST_X(dp.current_location::geometry) as longitude,
             ST_Y(dp.current_location::geometry) as latitude,
             ST_Distance(
               dp.current_location::geography,
               ST_GeogFromText(${`POINT(${ride.pickup_longitude} ${ride.pickup_latitude})`})
             ) / 1000 as distance_to_pickup_km
      FROM users u
      JOIN driver_profiles dp ON u.id = dp.user_id
      WHERE u.role = 'driver'
        AND dp.is_available = true
        AND dp.is_verified = true
        AND dp.current_location IS NOT NULL
        AND ST_Distance(
          dp.current_location::geography,
          ST_GeogFromText(${`POINT(${ride.pickup_longitude} ${ride.pickup_latitude})`})
        ) <= 10000  -- 10km radius
      ORDER BY distance_to_pickup_km ASC
      LIMIT 20
    `;

    if (availableDrivers.length === 0) {
      // No drivers available, keep ride in 'requested' status
      return Response.json({ 
        success: false, 
        message: "No available drivers found",
        matches: 0 
      });
    }

    // Calculate matching scores and create ride matches
    const matches = [];
    
    for (const driver of availableDrivers) {
      // Calculate match score based on multiple factors:
      // 1. Distance to pickup (closer is better)
      // 2. Driver rating (higher is better)
      // 3. Driver experience (more rides is better)
      
      const distanceScore = Math.max(0, (10 - driver.distance_to_pickup_km) / 10 * 40); // 40 points max
      const ratingScore = (parseFloat(driver.rating) / 5) * 35; // 35 points max
      const experienceScore = Math.min(driver.total_rides / 100, 1) * 25; // 25 points max
      
      const totalScore = distanceScore + ratingScore + experienceScore;
      const estimatedArrivalTime = Math.ceil(driver.distance_to_pickup_km / 30 * 60); // assuming 30 km/h average speed

      // Create ride match entry
      const matchResult = await sql`
        INSERT INTO ride_matches (
          ride_id, 
          driver_id, 
          distance_to_pickup, 
          estimated_arrival_time, 
          match_score, 
          status
        ) VALUES (
          ${ride_id},
          ${driver.id},
          ${driver.distance_to_pickup_km.toFixed(2)},
          ${estimatedArrivalTime},
          ${totalScore.toFixed(2)},
          'pending'
        )
        RETURNING id, driver_id, distance_to_pickup, estimated_arrival_time, match_score
      `;

      matches.push({
        match_id: matchResult[0].id,
        driver: {
          id: driver.id,
          name: driver.name,
          phone: driver.phone,
          vehicle: {
            make: driver.vehicle_make,
            model: driver.vehicle_model,
            license_plate: driver.license_plate
          },
          rating: parseFloat(driver.rating),
          total_rides: driver.total_rides,
          location: {
            latitude: parseFloat(driver.latitude),
            longitude: parseFloat(driver.longitude)
          }
        },
        distance_to_pickup: parseFloat(matchResult[0].distance_to_pickup),
        estimated_arrival_time: matchResult[0].estimated_arrival_time,
        match_score: parseFloat(matchResult[0].match_score)
      });

      // Create notification for the driver
      await sql`
        INSERT INTO notifications (user_id, title, message, type, data)
        VALUES (
          ${driver.id},
          'New Ride Request',
          ${`Ride request from ${ride.pickup_address} to ${ride.dropoff_address}`},
          'ride_request',
          ${JSON.stringify({ ride_id: ride_id, match_id: matchResult[0].id })}
        )
      `;
    }

    // Sort matches by score (highest first)
    matches.sort((a, b) => b.match_score - a.match_score);

    // Auto-assign to the best driver if the score is high enough (>= 70)
    const bestMatch = matches[0];
    if (bestMatch && bestMatch.match_score >= 70) {
      // Auto-accept the best match
      await sql`
        UPDATE rides 
        SET driver_id = ${bestMatch.driver.id}, 
            status = 'matched',
            matched_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${ride_id}
      `;

      await sql`
        UPDATE ride_matches 
        SET status = 'accepted', responded_at = CURRENT_TIMESTAMP
        WHERE ride_id = ${ride_id} AND driver_id = ${bestMatch.driver.id}
      `;

      // Mark other matches as expired
      await sql`
        UPDATE ride_matches 
        SET status = 'expired', responded_at = CURRENT_TIMESTAMP
        WHERE ride_id = ${ride_id} AND driver_id != ${bestMatch.driver.id}
      `;

      // Notify passenger about match
      await sql`
        INSERT INTO notifications (user_id, title, message, type, data)
        VALUES (
          ${ride.passenger_id},
          'Driver Found!',
          ${`${bestMatch.driver.name} will pick you up in ${bestMatch.estimated_arrival_time} minutes`},
          'ride_matched',
          ${JSON.stringify({ ride_id: ride_id, driver_id: bestMatch.driver.id })}
        )
      `;

      // Notify driver about assignment
      await sql`
        INSERT INTO notifications (user_id, title, message, type, data)
        VALUES (
          ${bestMatch.driver.id},
          'Ride Assigned',
          ${`Pick up passenger at ${ride.pickup_address}`},
          'ride_assigned',
          ${JSON.stringify({ ride_id: ride_id })}
        )
      `;
    }

    return Response.json({
      success: true,
      message: `Found ${matches.length} available drivers`,
      matches: matches.length,
      best_match: bestMatch ? {
        driver_name: bestMatch.driver.name,
        distance: bestMatch.distance_to_pickup,
        estimated_arrival: bestMatch.estimated_arrival_time,
        score: bestMatch.match_score,
        auto_assigned: bestMatch.match_score >= 70
      } : null,
      all_matches: matches.slice(0, 5) // Return top 5 matches
    });

  } catch (error) {
    console.error('Ride matching error:', error);
    return Response.json({ error: "Failed to match ride with drivers" }, { status: 500 });
  }
}

// Get pending matches for a driver
export async function GET(request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Not authenticated" }, { status: 401 });
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
      return Response.json({ error: "Only drivers can view ride matches" }, { status: 403 });
    }

    // Get pending matches for this driver
    const matches = await sql`
      SELECT rm.id as match_id, rm.distance_to_pickup, rm.estimated_arrival_time, 
             rm.match_score, rm.created_at,
             r.id as ride_id, r.pickup_address, r.dropoff_address, 
             r.estimated_distance, r.estimated_duration,
             p.name as passenger_name, p.phone as passenger_phone,
             ST_X(r.pickup_location::geometry) as pickup_longitude,
             ST_Y(r.pickup_location::geometry) as pickup_latitude,
             ST_X(r.dropoff_location::geometry) as dropoff_longitude,
             ST_Y(r.dropoff_location::geometry) as dropoff_latitude
      FROM ride_matches rm
      JOIN rides r ON rm.ride_id = r.id
      JOIN users p ON r.passenger_id = p.id
      WHERE rm.driver_id = ${user.id} 
        AND rm.status = 'pending'
        AND r.status IN ('requested', 'matched')
      ORDER BY rm.created_at ASC
    `;

    const formattedMatches = matches.map(match => ({
      match_id: match.match_id,
      ride_id: match.ride_id,
      passenger: {
        name: match.passenger_name,
        phone: match.passenger_phone
      },
      pickup: {
        address: match.pickup_address,
        location: {
          latitude: parseFloat(match.pickup_latitude),
          longitude: parseFloat(match.pickup_longitude)
        }
      },
      dropoff: {
        address: match.dropoff_address,
        location: {
          latitude: parseFloat(match.dropoff_latitude),
          longitude: parseFloat(match.dropoff_longitude)
        }
      },
      distance_to_pickup: parseFloat(match.distance_to_pickup),
      estimated_arrival_time: match.estimated_arrival_time,
      estimated_distance: parseFloat(match.estimated_distance),
      estimated_duration: match.estimated_duration,
      match_score: parseFloat(match.match_score),
      created_at: match.created_at
    }));

    return Response.json({ matches: formattedMatches });

  } catch (error) {
    console.error('Get ride matches error:', error);
    return Response.json({ error: "Failed to get ride matches" }, { status: 500 });
  }
}