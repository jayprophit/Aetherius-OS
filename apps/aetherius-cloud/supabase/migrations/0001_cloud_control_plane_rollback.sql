-- Rollback for 0001_cloud_control_plane.sql
-- Destructive: drops the Aetherius cloud control-plane tables.
-- Apply only with explicit owner approval, and only after confirming a backup.

drop table if exists cloud_deployment;
drop table if exists cloud_usage;
drop table if exists cloud_task;
drop table if exists provider_health;
drop table if exists cloud_resource;
drop table if exists cloud_provider;
