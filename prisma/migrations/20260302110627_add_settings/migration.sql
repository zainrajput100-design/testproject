-- CreateTable
CREATE TABLE "Settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "whatsappToken" TEXT NOT NULL DEFAULT '',
    "phoneNumberId" TEXT NOT NULL DEFAULT '',
    "orderConfirmationMessage" TEXT NOT NULL DEFAULT '',
    "orderConfirmationEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
