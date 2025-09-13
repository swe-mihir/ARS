import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

export async function GET(request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Not authenticated" }, { status: 401 });
    }

    const userEmail = session.user.email;
    
    // Get user profile from our users table
    const userResult = await sql`
      SELECT u.id, u.email, u.name, u.phone, u.role, u.profile_picture, u.created_at,
             dp.vehicle_make, dp.vehicle_model, dp.vehicle_year, dp.license_plate, 
             dp.is_verified, dp.is_available, dp.rating, dp.total_rides,
             ST_X(dp.current_location::geometry) as longitude,
             ST_Y(dp.current_location::geometry) as latitude
      FROM users u
      LEFT JOIN driver_profiles dp ON u.id = dp.user_id
      WHERE u.email = ${userEmail}
    `;

    if (userResult.length === 0) {
      // User exists in auth but not in our app - needs to complete onboarding
      return Response.json({ 
        hasProfile: false,
        authUser: {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name
        }
      });
    }

    const user = userResult[0];
    
    // Format the response
    const profile = {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
      profile_picture: user.profile_picture,
      created_at: user.created_at,
      hasProfile: true
    };

    // Add driver-specific data if user is a driver
    if (user.role === 'driver') {
      profile.driver = {
        vehicle_make: user.vehicle_make,
        vehicle_model: user.vehicle_model,
        vehicle_year: user.vehicle_year,
        license_plate: user.license_plate,
        is_verified: user.is_verified,
        is_available: user.is_available,
        rating: parseFloat(user.rating),
        total_rides: user.total_rides,
        current_location: user.longitude && user.latitude ? {
          longitude: parseFloat(user.longitude),
          latitude: parseFloat(user.latitude)
        } : null
      };
    }

    return Response.json({ profile });

  } catch (error) {
    console.error('Get profile error:', error);
    return Response.json({ error: "Failed to get profile" }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const { name, phone, profile_picture, is_available, current_location } = body;
    
    const userEmail = session.user.email;

    // Get current user
    const userResult = await sql`
      SELECT u.id, u.role 
      FROM users u 
      WHERE u.email = ${userEmail}
    `;

    if (userResult.length === 0) {
      return Response.json({ error: "User profile not found" }, { status: 404 });
    }

    const user = userResult[0];

    // Update user profile
    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updateFields.push(`name = $${paramIndex++}`);
      updateValues.push(name);
    }
    if (phone !== undefined) {
      updateFields.push(`phone = $${paramIndex++}`);
      updateValues.push(phone);
    }
    if (profile_picture !== undefined) {
      updateFields.push(`profile_picture = $${paramIndex++}`);
      updateValues.push(profile_picture);
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

    if (updateFields.length > 1) { // More than just updated_at
      const updateQuery = `
        UPDATE users 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex}
      `;
      updateValues.push(user.id);
      
      await sql(updateQuery, updateValues);
    }

    // Update driver-specific fields if user is a driver
    if (user.role === 'driver') {
      const driverUpdateFields = [];
      const driverUpdateValues = [];
      let driverParamIndex = 1;

      if (is_available !== undefined) {
        driverUpdateFields.push(`is_available = $${driverParamIndex++}`);
        driverUpdateValues.push(is_available);
      }
      
      if (current_location && current_location.latitude && current_location.longitude) {
        driverUpdateFields.push(`current_location = ST_GeogFromText($${driverParamIndex++})`);
        driverUpdateValues.push(`POINT(${current_location.longitude} ${current_location.latitude})`);
      }

      driverUpdateFields.push(`updated_at = CURRENT_TIMESTAMP`);

      if (driverUpdateFields.length > 1) { // More than just updated_at
        const driverUpdateQuery = `
          UPDATE driver_profiles 
          SET ${driverUpdateFields.join(', ')}
          WHERE user_id = $${driverParamIndex}
        `;
        driverUpdateValues.push(user.id);
        
        await sql(driverUpdateQuery, driverUpdateValues);
      }
    }

    return Response.json({ success: true, message: "Profile updated successfully" });

  } catch (error) {
    console.error('Update profile error:', error);
    return Response.json({ error: "Failed to update profile" }, { status: 500 });
  }
}