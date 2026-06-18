import {
  AlertTriangle,
  CalendarDays,
  Factory,
  Gauge,
  ShieldAlert,
} from "lucide-react";

interface Props {
  scheduledOrders: number;
  workCenters: number;
  avgCapacity: number;
  urgentOrders: number;
  highRiskCenters: number;
}

export default function SchedulingKPIs({
  scheduledOrders,
  workCenters,
  avgCapacity,
  urgentOrders,
  highRiskCenters,
}: Props) {
  const cards = [
    {
      title: "Scheduled Orders",
      value: scheduledOrders,
      icon: CalendarDays,
    },
    {
      title: "Work Centers",
      value: workCenters,
      icon: Factory,
    },
    {
      title: "Avg Capacity",
      value: `${avgCapacity}%`,
      icon: Gauge,
    },
    {
      title: "Urgent Orders",
      value: urgentOrders,
      icon: AlertTriangle,
    },
    {
      title: "High Risk Centers",
      value: highRiskCenters,
      icon: ShieldAlert,
    },
  ];

  return (
    <section className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-5">
      {cards.map((card) => (
        <div
          key={card.title}
          className="rounded-xl border bg-white p-4 shadow-sm"
        >
          <card.icon className="text-blue-600" />
          <p className="mt-3 text-sm text-gray-500">
            {card.title}
          </p>
          <h2 className="text-2xl font-bold">
            {card.value}
          </h2>
        </div>
      ))}
    </section>
  );
}