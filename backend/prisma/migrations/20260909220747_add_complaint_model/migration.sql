-- CreateTable
CREATE TABLE `complaints` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `description` TEXT NOT NULL,
    `category` ENUM('ROADS_POTHOLES', 'STREET_LIGHTS', 'WATER_SUPPLY', 'SANITATION_WASTE', 'DRAINAGE_SEWAGE', 'PARKS_PUBLIC_SPACES', 'PUBLIC_TRANSPORT', 'OTHER') NOT NULL,
    `priority` ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') NOT NULL DEFAULT 'MEDIUM',
    `status` ENUM('SUBMITTED', 'UNDER_REVIEW', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REOPENED', 'REJECTED', 'CANCELLED') NOT NULL DEFAULT 'SUBMITTED',
    `location` VARCHAR(255) NOT NULL,
    `latitude` DOUBLE NULL,
    `longitude` DOUBLE NULL,
    `imageUrl` VARCHAR(500) NULL,
    `citizenId` VARCHAR(191) NOT NULL,
    `assignedWorkerId` VARCHAR(191) NULL,
    `assignedAuthorityId` VARCHAR(191) NULL,
    `resolvedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `complaints_citizenId_idx`(`citizenId`),
    INDEX `complaints_status_idx`(`status`),
    INDEX `complaints_category_idx`(`category`),
    INDEX `complaints_priority_idx`(`priority`),
    INDEX `complaints_assignedWorkerId_idx`(`assignedWorkerId`),
    INDEX `complaints_assignedAuthorityId_idx`(`assignedAuthorityId`),
    INDEX `complaints_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `complaints` ADD CONSTRAINT `complaints_citizenId_fkey` FOREIGN KEY (`citizenId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `complaints` ADD CONSTRAINT `complaints_assignedWorkerId_fkey` FOREIGN KEY (`assignedWorkerId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `complaints` ADD CONSTRAINT `complaints_assignedAuthorityId_fkey` FOREIGN KEY (`assignedAuthorityId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
