import { NextResponse } from "next/server";
import { z } from "zod";

import { authenticateUser } from "@/lib/portal";
import { withSessionCookie } from "@/lib/session";

const authSchema = z.object({
  role: z.enum(["admin", "author"]),
  email: z.string().trim().email(),
  password: z.string().min(6),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = authSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid login details.",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const user = authenticateUser(
      parsed.data.role,
      parsed.data.email,
      parsed.data.password
    );

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password for this role." },
        { status: 401 }
      );
    }

    const response = NextResponse.json({ user }, { status: 200 });
    return withSessionCookie(response, user);
  } catch (error) {
    console.error("Auth route error:", error);
    return NextResponse.json(
      { error: "Unable to authenticate the user." },
      { status: 500 }
    );
  }
}
