import {
  LayoutDashboard, Building2, Network, Users, GitBranch, History,
  Wallet, Calculator, CalendarCheck, CalendarDays, PlayCircle, Receipt,
  HandCoins, ReceiptText, TrendingUp, Star, LogOut, Gift, ShieldCheck,
  HeartPulse, CreditCard, BarChart3, FolderOpen, LifeBuoy, Workflow,
  CalendarRange, FileSliders, Percent, FileBarChart, Settings
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: any;
}
export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Overview",
    items: [{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard }]
  },
  {
    label: "Organization",
    items: [
      { href: "/companies", label: "Companies", icon: Building2 },
      { href: "/organization", label: "Org setup", icon: Network },
      { href: "/employees", label: "Employees", icon: Users },
      { href: "/org-chart", label: "Org chart", icon: GitBranch },
      { href: "/salary-history", label: "Salary history", icon: History }
    ]
  },
  {
    label: "Pay structure",
    items: [
      { href: "/salary-components", label: "Components", icon: Wallet },
      { href: "/salary-structure", label: "Structures", icon: Calculator }
    ]
  },
  {
    label: "Time & leave",
    items: [
      { href: "/attendance", label: "Attendance", icon: CalendarCheck },
      { href: "/leave", label: "Leave", icon: CalendarDays },
      { href: "/holidays", label: "Holidays", icon: CalendarRange }
    ]
  },
  {
    label: "Payroll",
    items: [
      { href: "/payroll", label: "Process payroll", icon: PlayCircle },
      { href: "/payslips", label: "Payslips", icon: Receipt },
      { href: "/tax-declarations", label: "Tax declarations", icon: FileSliders },
      { href: "/pt-slabs", label: "PT slabs", icon: Percent }
    ]
  },
  {
    label: "Pay extras",
    items: [
      { href: "/loans", label: "Loans", icon: HandCoins },
      { href: "/reimbursements", label: "Reimbursements", icon: ReceiptText },
      { href: "/variable-pay", label: "Variable pay", icon: TrendingUp },
      { href: "/performance", label: "Performance", icon: Star },
      { href: "/full-and-final", label: "Full & Final", icon: LogOut },
      { href: "/bonus", label: "Bonus", icon: Gift },
      { href: "/insurance", label: "Insurance", icon: HeartPulse }
    ]
  },
  {
    label: "Compliance",
    items: [
      { href: "/compliance-dashboard", label: "Dashboard", icon: ShieldCheck },
      { href: "/compliance-calendar", label: "Calendar", icon: CalendarRange },
      { href: "/reports", label: "Reports", icon: FileBarChart }
    ]
  },
  {
    label: "Workplace",
    items: [
      { href: "/documents", label: "Documents", icon: FolderOpen },
      { href: "/helpdesk", label: "Helpdesk", icon: LifeBuoy },
      { href: "/workflows", label: "Workflows", icon: Workflow }
    ]
  },
  {
    label: "Admin",
    items: [
      { href: "/analytics", label: "Analytics", icon: BarChart3 },
      { href: "/billing", label: "Billing", icon: CreditCard },
      { href: "/settings", label: "Settings", icon: Settings }
    ]
  }
];
