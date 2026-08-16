import { NextRequest, NextResponse } from "next/server";
import { getAppUserFromRequest } from "../../../auth";

export async function GET(request: NextRequest) {
  const user = await getAppUserFromRequest(request);
  return NextResponse.json({ user }, { status: user ? 200 : 401 });
}
