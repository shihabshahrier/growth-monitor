-- AlterTable
ALTER TABLE "Campaign" ADD COLUMN     "clicks" INTEGER,
ADD COLUMN     "conversions" INTEGER,
ADD COLUMN     "impressions" INTEGER,
ADD COLUMN     "region" TEXT,
ADD COLUMN     "remarks" TEXT,
ADD COLUMN     "revenueGenerated" DOUBLE PRECISION,
ADD COLUMN     "salesRep" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'Active';

-- AlterTable
ALTER TABLE "Sale" ADD COLUMN     "category" TEXT,
ADD COLUMN     "orderId" TEXT,
ADD COLUMN     "paymentMethod" TEXT,
ADD COLUMN     "quantity" INTEGER,
ADD COLUMN     "region" TEXT,
ADD COLUMN     "remarks" TEXT,
ADD COLUMN     "salesRep" TEXT,
ADD COLUMN     "unitPrice" DOUBLE PRECISION;
