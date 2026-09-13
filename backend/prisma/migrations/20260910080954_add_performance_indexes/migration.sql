-- CreateIndex
CREATE INDEX `assignments_workerId_status_idx` ON `assignments`(`workerId`, `status`);

-- CreateIndex
CREATE INDEX `assignments_complaintId_status_idx` ON `assignments`(`complaintId`, `status`);

-- CreateIndex
CREATE INDEX `audit_logs_targetType_targetId_idx` ON `audit_logs`(`targetType`, `targetId`);

-- CreateIndex
CREATE INDEX `complaints_status_category_idx` ON `complaints`(`status`, `category`);

-- CreateIndex
CREATE INDEX `complaints_status_priority_idx` ON `complaints`(`status`, `priority`);

-- CreateIndex
CREATE INDEX `complaints_citizenId_status_idx` ON `complaints`(`citizenId`, `status`);

-- CreateIndex
CREATE INDEX `complaints_assignedWorkerId_status_idx` ON `complaints`(`assignedWorkerId`, `status`);

-- CreateIndex
CREATE INDEX `complaints_resolvedAt_idx` ON `complaints`(`resolvedAt`);

-- CreateIndex
CREATE INDEX `complaints_createdAt_status_idx` ON `complaints`(`createdAt`, `status`);

-- CreateIndex
CREATE INDEX `notifications_userId_read_idx` ON `notifications`(`userId`, `read`);

-- CreateIndex
CREATE INDEX `notifications_createdAt_idx` ON `notifications`(`createdAt`);

-- CreateIndex
CREATE INDEX `users_status_idx` ON `users`(`status`);

-- CreateIndex
CREATE INDEX `users_department_idx` ON `users`(`department`);

-- CreateIndex
CREATE INDEX `users_role_status_idx` ON `users`(`role`, `status`);

-- CreateIndex
CREATE INDEX `users_createdAt_idx` ON `users`(`createdAt`);
