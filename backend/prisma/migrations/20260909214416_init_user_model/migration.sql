-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `phone` VARCHAR(20) NULL,
    `role` ENUM('CITIZEN', 'WORKER', 'AUTHORITY', 'ADMIN') NOT NULL DEFAULT 'CITIZEN',
    `status` ENUM('ACTIVE', 'INACTIVE', 'AVAILABLE', 'BUSY') NOT NULL DEFAULT 'ACTIVE',
    `avatar` VARCHAR(255) NULL,
    `address` VARCHAR(255) NULL,
    `department` VARCHAR(100) NULL,
    `zone` VARCHAR(100) NULL,
    `designation` VARCHAR(100) NULL,
    `skills` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    INDEX `users_email_idx`(`email`),
    INDEX `users_role_idx`(`role`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
