-- AlterTable
ALTER TABLE `complaints` ADD COLUMN `acceptedAt` DATETIME(3) NULL,
    ADD COLUMN `materialsUsed` VARCHAR(255) NULL,
    ADD COLUMN `resolutionNotes` TEXT NULL,
    ADD COLUMN `resolutionPhotos` JSON NULL,
    ADD COLUMN `startedAt` DATETIME(3) NULL,
    ADD COLUMN `taskStatus` VARCHAR(50) NULL;

-- CreateTable
CREATE TABLE `worker_profiles` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `department` VARCHAR(100) NULL,
    `skills` JSON NULL,
    `vehicleNumber` VARCHAR(50) NULL,
    `currentZone` VARCHAR(100) NULL,
    `isAvailable` BOOLEAN NOT NULL DEFAULT true,
    `totalAssigned` INTEGER NOT NULL DEFAULT 0,
    `totalResolved` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `worker_profiles_userId_key`(`userId`),
    INDEX `worker_profiles_userId_idx`(`userId`),
    INDEX `worker_profiles_department_idx`(`department`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `assignments` (
    `id` VARCHAR(191) NOT NULL,
    `complaintId` VARCHAR(191) NOT NULL,
    `workerId` VARCHAR(191) NOT NULL,
    `assignedById` VARCHAR(191) NOT NULL,
    `status` ENUM('ASSIGNED', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'REASSIGNED', 'CANCELLED') NOT NULL DEFAULT 'ASSIGNED',
    `instructions` TEXT NULL,
    `assignedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `acceptedAt` DATETIME(3) NULL,
    `startedAt` DATETIME(3) NULL,
    `completedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `assignments_complaintId_idx`(`complaintId`),
    INDEX `assignments_workerId_idx`(`workerId`),
    INDEX `assignments_assignedById_idx`(`assignedById`),
    INDEX `assignments_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `work_updates` (
    `id` VARCHAR(191) NOT NULL,
    `complaintId` VARCHAR(191) NOT NULL,
    `assignmentId` VARCHAR(191) NULL,
    `workerId` VARCHAR(191) NOT NULL,
    `updateType` ENUM('NOTE', 'PROGRESS', 'STATUS_CHANGE', 'EVIDENCE', 'COMPLETION') NOT NULL DEFAULT 'NOTE',
    `notes` TEXT NOT NULL,
    `materialsUsed` VARCHAR(255) NULL,
    `imageUrl` VARCHAR(500) NULL,
    `imagePublicId` VARCHAR(255) NULL,
    `evidenceMeta` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `work_updates_complaintId_idx`(`complaintId`),
    INDEX `work_updates_assignmentId_idx`(`assignmentId`),
    INDEX `work_updates_workerId_idx`(`workerId`),
    INDEX `work_updates_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `worker_profiles` ADD CONSTRAINT `worker_profiles_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `assignments` ADD CONSTRAINT `assignments_complaintId_fkey` FOREIGN KEY (`complaintId`) REFERENCES `complaints`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `assignments` ADD CONSTRAINT `assignments_workerId_fkey` FOREIGN KEY (`workerId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `assignments` ADD CONSTRAINT `assignments_assignedById_fkey` FOREIGN KEY (`assignedById`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `work_updates` ADD CONSTRAINT `work_updates_complaintId_fkey` FOREIGN KEY (`complaintId`) REFERENCES `complaints`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `work_updates` ADD CONSTRAINT `work_updates_assignmentId_fkey` FOREIGN KEY (`assignmentId`) REFERENCES `assignments`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `work_updates` ADD CONSTRAINT `work_updates_workerId_fkey` FOREIGN KEY (`workerId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
