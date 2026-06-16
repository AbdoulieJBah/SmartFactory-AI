import { AlertTriangle, CalendarDays, Factory, Gauge, Zap } from "lucide-react";

export default function SchedulingKPIs({
  scheduledOrders,
  workCenters,
  avgCapacity,
  urgentOrders,
  highRiskCenters,
}: {
  scheduledOrders: number;
  workCenters: number;
  avgCapacity: number;
  urgentOrders: number;
  highRiskCenters: number;
}) {
  const cards = [
    {
      title: "Scheduled Orders",
      value: scheduledOrders,
      subtitle: "Production jobs planned",
      icon: <CalendarDays className="text-blue-700" />,
    },
    {
      title: "Work Centers",
      value: workCenters,
      subtitle: "Machines / lines",
      icon: <Factory className="text-emerald-700" />,
    },
    {
      title: "Avg Capacity",
      value: `${avgCapacity}%`,
      subtitle: "Average machine load",
      icon: <Gauge className="text-purple-700" />,
    },
    {
      title: "Urgent Orders",
      value: urgentOrders,
      subtitle: "Priority jobs",
      icon: <AlertTriangle className="text-red-700" />,
    },
    {
      title: "High Risk Centers",
      value: highRiskCenters,
      subtitle: "Overloaded / down",
      icon: <Zap className="text-orange-700" />,
    },
  ];

  return (
    <section className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-5">
      {cards.map((card) => (
        <div key={card.title} className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500">{card.title}</p>
              <h2 className="mt-1 text-2xl font-bold text-gray-950">
                {card.value}
              </h2>
            </div>
            {card.icon}
          </div>
          <p className="mt-3 text-sm text-gray-500">{card.subtitle}</p>
        </div>
      ))}
    </section>
  );
}