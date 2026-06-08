-- Prevent duplicate generated slots for the same port and start time.
CREATE UNIQUE INDEX "TimeSlot_portId_startTime_key" ON "TimeSlot"("portId", "startTime");
