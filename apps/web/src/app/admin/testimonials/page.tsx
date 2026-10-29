import { DashboardPageContent } from "@/app/_components/dashboard/dashboard-page-content";
import { TestimonialsList } from "./_features/testimonials-list/testimonials-list.client";

export default function AdminTestimonialsPage() {
  return (
    <DashboardPageContent
      title="Testimonials"
      breadcrumbs={[
        { label: "Dashboard", link: "/admin" },
        { label: "Testimonials", link: "/admin/testimonials" },
      ]}
    >
      <TestimonialsList />
    </DashboardPageContent>
  );
}
