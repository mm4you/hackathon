-- Add indexes for dashboard, booking, rewards, and reporting read paths.
CREATE INDEX "User_companyId_idx" ON "User"("companyId");
CREATE INDEX "User_role_greenPoints_idx" ON "User"("role", "greenPoints");

CREATE INDEX "Vehicle_companyId_idx" ON "Vehicle"("companyId");
CREATE INDEX "Vehicle_driverId_createdAt_idx" ON "Vehicle"("driverId", "createdAt");

CREATE INDEX "Port_isActive_name_idx" ON "Port"("isActive", "name");

CREATE INDEX "TimeSlot_startTime_idx" ON "TimeSlot"("startTime");

CREATE INDEX "Appointment_createdAt_idx" ON "Appointment"("createdAt");
CREATE INDEX "Appointment_portId_createdAt_idx" ON "Appointment"("portId", "createdAt");
CREATE INDEX "Appointment_timeSlotId_idx" ON "Appointment"("timeSlotId");

CREATE INDEX "Reward_isActive_pointsRequired_idx" ON "Reward"("isActive", "pointsRequired");

CREATE INDEX "RewardRedemption_status_createdAt_idx" ON "RewardRedemption"("status", "createdAt");
CREATE INDEX "RewardRedemption_createdAt_idx" ON "RewardRedemption"("createdAt");
CREATE INDEX "RewardRedemption_rewardId_idx" ON "RewardRedemption"("rewardId");

CREATE INDEX "ActivityLog_createdAt_idx" ON "ActivityLog"("createdAt");
