-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "whatsappToken" TEXT NOT NULL DEFAULT '',
    "phoneNumberId" TEXT NOT NULL DEFAULT '',
    "orderConfirmationMessage" TEXT NOT NULL DEFAULT '',
    "orderConfirmationEnabled" BOOLEAN NOT NULL DEFAULT true,
    "fulfillmentMessage" TEXT NOT NULL DEFAULT '',
    "fulfillmentEnabled" BOOLEAN NOT NULL DEFAULT true,
    "cancellationMessage" TEXT NOT NULL DEFAULT '',
    "cancellationEnabled" BOOLEAN NOT NULL DEFAULT true,
    "abandonedCartMessage" TEXT NOT NULL DEFAULT '',
    "abandonedCartEnabled" BOOLEAN NOT NULL DEFAULT false,
    "abandonedCartDelay" INTEGER NOT NULL DEFAULT 60,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Settings" ("cancellationEnabled", "cancellationMessage", "createdAt", "fulfillmentEnabled", "fulfillmentMessage", "id", "orderConfirmationEnabled", "orderConfirmationMessage", "phoneNumberId", "updatedAt", "whatsappToken") SELECT "cancellationEnabled", "cancellationMessage", "createdAt", "fulfillmentEnabled", "fulfillmentMessage", "id", "orderConfirmationEnabled", "orderConfirmationMessage", "phoneNumberId", "updatedAt", "whatsappToken" FROM "Settings";
DROP TABLE "Settings";
ALTER TABLE "new_Settings" RENAME TO "Settings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
