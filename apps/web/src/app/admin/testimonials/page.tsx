import { DashboardPageContent } from "@/app/_components/dashboard/dashboard-page-content";
import { TestimonialFunnel } from "./_features/testimonial-funnel.client";
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
      <div className="space-y-4">
        <TestimonialFunnel />
        <TestimonialsList />
      </div>
    </DashboardPageContent>
  );
}
