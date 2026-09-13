-- AlterTable
ALTER TABLE `complaints` ADD COLUMN `evidenceMeta` JSON NULL,
    ADD COLUMN `imagePublicId` VARCHAR(255) NULL;
