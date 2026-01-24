-- CreateTable
CREATE TABLE "BusinessDetails" (
    "id" SERIAL NOT NULL,
    "storeName" TEXT NOT NULL DEFAULT 'Biz HQ',
    "taxRate" DOUBLE PRECISION NOT NULL DEFAULT 13,
    "lowStockValue" INTEGER NOT NULL DEFAULT 10,
    "cloverAppId" TEXT,
    "cloverMerchantId" TEXT,
    "starPrinterIP" TEXT,

    CONSTRAINT "BusinessDetails_pkey" PRIMARY KEY ("id")
);
