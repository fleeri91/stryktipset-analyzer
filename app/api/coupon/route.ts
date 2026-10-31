import { getCoupon } from "@/lib/stryktips/coupon";

export async function GET() {
  return Response.json(await getCoupon());
}
