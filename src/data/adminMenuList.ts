import {
  Home,
  Users,
  ClipboardList,
  Truck,
  CalendarDays,
  FileText,
  CreditCard,
  RotateCcw,
  DollarSign,
  Receipt,
  ChefHat,
  Utensils,
  Layers3,
  Package,
  BellRing,
  MessageSquare,
  HelpCircle,
  BarChart2,
  PieChart,
  Settings,
  LogOut,
  ShieldCheck,
  Building2,
  ShoppingBag,
} from "@lucide/astro";

export const menu = [
  {
    label: "Dashboard",
    items: [
      { title: "Overview", href: "/dashboard", icon: Home },

      { title: "Repoerts", href: "/reports", icon: Receipt },
    ],
  },
  {
    label: "Subscription Management",
    items: [
      // { title: "Customers", href: "/customers", icon: Users },
      { title: "Plans", href: "/package-management", icon: FileText },
      { title: "Addons", href: "/addons", icon: FileText },
      { title: "Categories", href: "/management/categories", icon: Layers3 },
      // { title: "Payments", href: "/payments", icon: CreditCard },

      // { title: "Invoices", href: "/invoices", icon: Receipt },
    ],
  },

  {
    label: "Delivery",
    items: [
      { title: "Orders", href: "/orders", icon: ClipboardList },
      { title: "Drivers", href: "/drivers", icon: Truck },
      { title: "Delivery Dates", href: "/delivery-dates", icon: CalendarDays },
      { title: "Delivery Assign", href: "/delivery-assignment", icon: Truck },
      { title: "Cities", href: "/cities", icon: Building2 },
      {
        title: "Today's Deliveries",
        href: "/daily-delivery",
        icon: ShoppingBag,
      },
      {
        title: "Today's Addon Orders",
        href: "/todays-addons",
        icon: ShoppingBag,
      },
    ],
  },

  {
    label: "Route Management",
    items: [
      { title: "Optimized Routes ", href: "/optimized-routes", icon: Truck },
      { title: "Route Optimization", href: "/route-optimization", icon: Truck },
    ],
  },
  // {
  //   label: "Customer Engagement",
  //   items: [
  //     { title: "Notifications", href: "/notifications", icon: BellRing },
  //     { title: "Feedback", href: "/feedback", icon: MessageSquare },
  //     { title: "Support Tickets", href: "/support", icon: HelpCircle },
  //   ],
  // },
  // {
  //   label: "Reports & Analytics",
  //   items: [
  //     { title: "Sales Reports", href: "/reports/sales", icon: BarChart2 },
  //     // { title: "User Insights", href: "/reports/customers", icon: PieChart },
  //   ],
  // },
  // {
  //   label: "Account",
  //   items: [
  //     { title: "Settings", href: "/settings", icon: Settings },
  //     { title: "Security", href: "/security", icon: ShieldCheck },
  //     { title: "Logout", href: "#", onClick: "logoutAdmin()", icon: LogOut },
  //   ],
  // },
];
