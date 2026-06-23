import { PayslipDetail } from "@/components/payslip-detail";

export default function MyPayslipDetailPage({ params }: { params: { id: string } }) {
  return <PayslipDetail id={params.id} />;
}
