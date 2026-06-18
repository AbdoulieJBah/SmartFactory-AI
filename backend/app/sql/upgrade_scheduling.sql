ALTER TABLE production_schedules
ADD COLUMN assigned_operator VARCHAR;

ALTER TABLE production_schedules
ADD COLUMN material_status VARCHAR DEFAULT 'Unchecked';

ALTER TABLE production_schedules
ADD COLUMN conflict_status VARCHAR DEFAULT 'Clear';

ALTER TABLE production_schedules
ADD COLUMN schedule_type VARCHAR DEFAULT 'Manual';