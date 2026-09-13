-- AlterTable
ALTER TABLE `complaint_histories` MODIFY `fromStatus` ENUM('SUBMITTED', 'UNDER_REVIEW', 'ASSIGNED', 'IN_PROGRESS', 'RESOLUTION_SUBMITTED', 'RESOLVED', 'CLOSED', 'REOPENED', 'REJECTED', 'CANCELLED') NULL,
    MODIFY `toStatus` ENUM('SUBMITTED', 'UNDER_REVIEW', 'ASSIGNED', 'IN_PROGRESS', 'RESOLUTION_SUBMITTED', 'RESOLVED', 'CLOSED', 'REOPENED', 'REJECTED', 'CANCELLED') NULL;

-- AlterTable
ALTER TABLE `complaints` ADD COLUMN `feedback` JSON NULL,
    MODIFY `status` ENUM('SUBMITTED', 'UNDER_REVIEW', 'ASSIGNED', 'IN_PROGRESS', 'RESOLUTION_SUBMITTED', 'RESOLVED', 'CLOSED', 'REOPENED', 'REJECTED', 'CANCELLED') NOT NULL DEFAULT 'SUBMITTED';

-- CreateTable
CREATE TABLE `notifications` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `type` VARCHAR(100) NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `message` TEXT NOT NULL,
    `targetId` VARCHAR(100) NULL,
    `read` BOOLEAN NOT NULL DEFAULT false,
    `complaintId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `notifications_userId_idx`(`userId`),
    INDEX `notifications_read_idx`(`read`),
    INDEX `notifications_complaintId_idx`(`complaintId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_complaintId_fkey` FOREIGN KEY (`complaintId`) REFERENCES `complaints`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
