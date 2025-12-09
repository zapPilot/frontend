import { redirect } from "next/navigation";

// Keep /layout-demo as a convenience entry point by redirecting to the only
// supported variation (v22).
export default function LayoutDemoIndexPage() {
  redirect("/layout-demo/v22");
}
