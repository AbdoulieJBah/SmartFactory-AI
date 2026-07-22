export type AnyRecord = Record<string, unknown>;

export interface ScheduleItem {
  id: number;
  order_id?: number | null;
  work_center_id?: number | null;
  schedule_date: string;
  shift: string;
  start_time: string;
  end_time: string;
  priority: string;
  status: string;
  capacity_load: number;
  assigned_operator?: string | null;
  material_status?: string | null;
  conflict_status?: string | null;
  schedule_type?: string | null;
  notes?: string | null;
}

export interface CapacityItem {
  work_center_id: number;
  work_center_name: string;
  status: string;
  scheduled_orders: number;
  average_capacity_load: number;
  risk: string;
}

export interface ScheduleFormState {
  order_id: string;
  work_center_id: string;
  schedule_date: string;
  shift: string;
  start_time: string;
  end_time: string;
  priority: string;
  status: string;
  capacity_load: number;
  assigned_operator: string;
  notes: string;
}

export const emptyScheduleForm: ScheduleFormState = {
  order_id: "",
  work_center_id: "",
  schedule_date: "",
  shift: "Morning",
  start_time: "08:00",
  end_time: "12:00",
  priority: "Normal",
  status: "Planned",
  capacity_load: 75,
  assigned_operator: "",
  notes: "",
};
