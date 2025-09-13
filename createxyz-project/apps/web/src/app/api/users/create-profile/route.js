import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

export async function POST(request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const { authUserId, email, name, phone, role, vehicleMake, vehicleModel, vehicleYear, licensePlate } = body;

    // Validate required fields
    if (!email || !name || !phone || !role) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Validate role
    if (!['passenger', 'driver', 'admin'].includes(role)) {
      return Response.json({ error: "Invalid role" }, { status: 400 });
    }

    // Validate driver fields
    if (role === 'driver') {
      if (!vehicleMake || !vehicleModel || !vehicleYear || !licensePlate) {
        return Response.json({ error: "Driver profile requires vehicle information" }, { status: 400 });
      }
    }

    // Check if user already has a profile
    const existingUser = await sql`
      SELECT id FROM users WHERE email = ${email}
    `;
    
    if (existingUser.length > 0) {
      return Response.json({ error: "Profile already exists" }, { status: 400 });
    }

    // Create user profile
    const userResult = await sql`
      INSERT INTO users (email, name, phone, role)
      VALUES (${email}, ${name}, ${phone}, ${role})
      RETURNING id, email, name, phone, role, created_at
    `;

    const user = userResult[0];

    // If driver, create driver profile
    if (role === 'driver') {
      await sql`
        INSERT INTO driver_profiles (user_id, vehicle_make, vehicle_model, vehicle_year, license_plate, is_verified)
        VALUES (${user.id}, ${vehicleMake}, ${vehicleModel}, ${parseInt(vehicleYear)}, ${licensePlate}, false)
      `;
    }

    return Response.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        created_at: user.created_at
      }
    });

  } catch (error) {
    console.error('Create profile error:', error);
    return Response.json({ error: "Failed to create profile" }, { status: 500 });
  }
}