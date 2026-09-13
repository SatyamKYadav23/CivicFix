-- CreateTable
CREATE TABLE `complaint_histories` (
    `id` VARCHAR(191) NOT NULL,
    `complaintId` VARCHAR(191) NOT NULL,
    `fromStatus` ENUM('SUBMITTED', 'UNDER_REVIEW', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REOPENED', 'REJECTED', 'CANCELLED') NULL,
    `toStatus` ENUM('SUBMITTED', 'UNDER_REVIEW', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REOPENED', 'REJECTED', 'CANCELLED') NULL,
    `action` VARCHAR(100) NOT NULL,
    `notes` TEXT NULL,
    `actorId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `complaint_histories_complaintId_idx`(`complaintId`),
    INDEX `complaint_histories_actorId_idx`(`actorId`),
    INDEX `complaint_histories_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `complaint_histories` ADD CONSTRAINT `complaint_histories_complaintId_fkey` FOREIGN KEY (`complaintId`) REFERENCES `complaints`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `complaint_histories` ADD CONSTRAINT `complaint_histories_actorId_fkey` FOREIGN KEY (`actorId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
