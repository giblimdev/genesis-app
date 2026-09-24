/*
  Warnings:

  - Added the required column `blockType` to the `article_content` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_article_content" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "articleId" TEXT NOT NULL,
    "parentId" TEXT,
    "contentType" TEXT NOT NULL DEFAULT 'MARKDOWN',
    "blockType" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "article_content_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "article" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "article_content_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "article_content" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_article_content" ("articleId", "body", "contentType", "createdAt", "displayOrder", "id", "parentId", "updatedAt") SELECT "articleId", "body", "contentType", "createdAt", "displayOrder", "id", "parentId", "updatedAt" FROM "article_content";
DROP TABLE "article_content";
ALTER TABLE "new_article_content" RENAME TO "article_content";
CREATE INDEX "article_content_articleId_parentId_displayOrder_idx" ON "article_content"("articleId", "parentId", "displayOrder");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
