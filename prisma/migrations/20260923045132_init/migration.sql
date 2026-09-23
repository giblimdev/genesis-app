-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "expiresAt" DATETIME NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,
    "impersonatedBy" TEXT,
    CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" DATETIME,
    "refreshTokenExpiresAt" DATETIME,
    "scope" TEXT,
    "password" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "verification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME
);

-- CreateTable
CREATE TABLE "profil" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "name" TEXT NOT NULL,
    "bio" TEXT,
    "phone" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "profil_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "groups" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "parentId" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    CONSTRAINT "groups_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "groups" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "role" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "role_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "group_member" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "groupId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "group_member_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "group_member_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "permission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "tagline" TEXT,
    "description" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'planned',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME
);

-- CreateTable
CREATE TABLE "feature" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "icon" TEXT,
    "accent" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "feature_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "persona" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "value" TEXT,
    "keywords" TEXT,
    "icon" TEXT,
    "accent" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    CONSTRAINT "persona_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "user_story" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "parentId" TEXT,
    "slug" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "title" TEXT NOT NULL,
    "personaRef" TEXT,
    "asA" TEXT NOT NULL,
    "iWant" TEXT NOT NULL,
    "soThat" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'backlog',
    "priority" INTEGER NOT NULL DEFAULT 5,
    "storyPoints" INTEGER,
    "accent" TEXT,
    "projectId" TEXT NOT NULL,
    "sprintId" TEXT,
    "acceptanceCriteria" TEXT,
    "dodChecked" TEXT,
    "linkedFiles" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    CONSTRAINT "user_story_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "user_story" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "user_story_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "user_story_sprintId_fkey" FOREIGN KEY ("sprintId") REFERENCES "sprint" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sprint" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "goal" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "durationWeeks" INTEGER NOT NULL DEFAULT 2,
    "status" TEXT NOT NULL DEFAULT 'planned',
    "capacityPoints" INTEGER NOT NULL DEFAULT 0,
    "velocity" INTEGER,
    "notes" TEXT,
    "accent" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    CONSTRAINT "sprint_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "task" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userStoryId" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "assigneeId" TEXT,
    "estimateHours" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'todo',
    "blockedBy" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "task_userStoryId_fkey" FOREIGN KEY ("userStoryId") REFERENCES "user_story" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "task_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "taxonomy" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "parentId" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "taxonomy_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "taxonomy" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "article" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "subCategoryId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "allowComments" BOOLEAN NOT NULL DEFAULT true,
    "displayStyle" JSONB,
    "likesCount" INTEGER NOT NULL DEFAULT 0,
    "publishedAt" DATETIME,
    "deletedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "article_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "user" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "article_subCategoryId_fkey" FOREIGN KEY ("subCategoryId") REFERENCES "taxonomy" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "article_content" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "articleId" TEXT NOT NULL,
    "parentId" TEXT,
    "contentType" TEXT NOT NULL DEFAULT 'MARKDOWN',
    "body" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "article_content_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "article" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "article_content_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "article_content" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "media" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "articleId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "key" TEXT,
    "type" TEXT NOT NULL DEFAULT 'IMAGE',
    "altText" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "media_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "article" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "comment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "articleId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "parentId" TEXT,
    "content" TEXT NOT NULL,
    "likesCount" INTEGER NOT NULL DEFAULT 0,
    "deletedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "comment_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "article" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "comment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "user" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "comment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "comment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "likes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "articleId" TEXT,
    "commentId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "likes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "likes_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "article" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "likes_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "comment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "favorite" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "favorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "favorite_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "article" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_PermissionToRole" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_PermissionToRole_A_fkey" FOREIGN KEY ("A") REFERENCES "permission" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_PermissionToRole_B_fkey" FOREIGN KEY ("B") REFERENCES "role" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_OwnedProjects" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_OwnedProjects_A_fkey" FOREIGN KEY ("A") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_OwnedProjects_B_fkey" FOREIGN KEY ("B") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_ArticleToTag" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_ArticleToTag_A_fkey" FOREIGN KEY ("A") REFERENCES "article" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_ArticleToTag_B_fkey" FOREIGN KEY ("B") REFERENCES "tag" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE INDEX "user_deletedAt_idx" ON "user"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

-- CreateIndex
CREATE UNIQUE INDEX "profil_userId_key" ON "profil"("userId");

-- CreateIndex
CREATE INDEX "profil_displayOrder_idx" ON "profil"("displayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "groups_slug_key" ON "groups"("slug");

-- CreateIndex
CREATE INDEX "groups_parentId_idx" ON "groups"("parentId");

-- CreateIndex
CREATE INDEX "groups_type_idx" ON "groups"("type");

-- CreateIndex
CREATE INDEX "groups_displayOrder_idx" ON "groups"("displayOrder");

-- CreateIndex
CREATE INDEX "groups_deletedAt_idx" ON "groups"("deletedAt");

-- CreateIndex
CREATE INDEX "role_groupId_idx" ON "role"("groupId");

-- CreateIndex
CREATE INDEX "role_displayOrder_idx" ON "role"("displayOrder");

-- CreateIndex
CREATE INDEX "group_member_groupId_idx" ON "group_member"("groupId");

-- CreateIndex
CREATE INDEX "group_member_userId_idx" ON "group_member"("userId");

-- CreateIndex
CREATE INDEX "group_member_displayOrder_idx" ON "group_member"("displayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "group_member_groupId_userId_key" ON "group_member"("groupId", "userId");

-- CreateIndex
CREATE INDEX "permission_displayOrder_idx" ON "permission"("displayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "project_slug_key" ON "project"("slug");

-- CreateIndex
CREATE INDEX "project_ownerId_idx" ON "project"("ownerId");

-- CreateIndex
CREATE INDEX "project_displayOrder_idx" ON "project"("displayOrder");

-- CreateIndex
CREATE INDEX "project_status_idx" ON "project"("status");

-- CreateIndex
CREATE INDEX "project_deletedAt_idx" ON "project"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "feature_slug_key" ON "feature"("slug");

-- CreateIndex
CREATE INDEX "feature_projectId_idx" ON "feature"("projectId");

-- CreateIndex
CREATE INDEX "feature_displayOrder_idx" ON "feature"("displayOrder");

-- CreateIndex
CREATE INDEX "feature_module_idx" ON "feature"("module");

-- CreateIndex
CREATE UNIQUE INDEX "persona_slug_key" ON "persona"("slug");

-- CreateIndex
CREATE INDEX "persona_projectId_idx" ON "persona"("projectId");

-- CreateIndex
CREATE INDEX "persona_displayOrder_idx" ON "persona"("displayOrder");

-- CreateIndex
CREATE INDEX "persona_deletedAt_idx" ON "persona"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "user_story_slug_key" ON "user_story"("slug");

-- CreateIndex
CREATE INDEX "user_story_parentId_idx" ON "user_story"("parentId");

-- CreateIndex
CREATE INDEX "user_story_displayOrder_idx" ON "user_story"("displayOrder");

-- CreateIndex
CREATE INDEX "user_story_priority_idx" ON "user_story"("priority");

-- CreateIndex
CREATE INDEX "user_story_status_idx" ON "user_story"("status");

-- CreateIndex
CREATE INDEX "user_story_deletedAt_idx" ON "user_story"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "sprint_slug_key" ON "sprint"("slug");

-- CreateIndex
CREATE INDEX "sprint_displayOrder_idx" ON "sprint"("displayOrder");

-- CreateIndex
CREATE INDEX "sprint_status_idx" ON "sprint"("status");

-- CreateIndex
CREATE INDEX "sprint_startDate_idx" ON "sprint"("startDate");

-- CreateIndex
CREATE INDEX "sprint_deletedAt_idx" ON "sprint"("deletedAt");

-- CreateIndex
CREATE INDEX "task_userStoryId_idx" ON "task"("userStoryId");

-- CreateIndex
CREATE INDEX "task_assigneeId_idx" ON "task"("assigneeId");

-- CreateIndex
CREATE INDEX "task_displayOrder_idx" ON "task"("displayOrder");

-- CreateIndex
CREATE INDEX "task_status_idx" ON "task"("status");

-- CreateIndex
CREATE UNIQUE INDEX "taxonomy_slug_key" ON "taxonomy"("slug");

-- CreateIndex
CREATE INDEX "taxonomy_parentId_displayOrder_idx" ON "taxonomy"("parentId", "displayOrder");

-- CreateIndex
CREATE INDEX "taxonomy_type_idx" ON "taxonomy"("type");

-- CreateIndex
CREATE UNIQUE INDEX "tag_name_key" ON "tag"("name");

-- CreateIndex
CREATE UNIQUE INDEX "tag_slug_key" ON "tag"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "article_slug_key" ON "article"("slug");

-- CreateIndex
CREATE INDEX "article_status_publishedAt_idx" ON "article"("status", "publishedAt");

-- CreateIndex
CREATE INDEX "article_authorId_idx" ON "article"("authorId");

-- CreateIndex
CREATE INDEX "article_subCategoryId_idx" ON "article"("subCategoryId");

-- CreateIndex
CREATE INDEX "article_deletedAt_idx" ON "article"("deletedAt");

-- CreateIndex
CREATE INDEX "article_content_articleId_parentId_displayOrder_idx" ON "article_content"("articleId", "parentId", "displayOrder");

-- CreateIndex
CREATE INDEX "media_articleId_displayOrder_idx" ON "media"("articleId", "displayOrder");

-- CreateIndex
CREATE INDEX "comment_articleId_parentId_createdAt_idx" ON "comment"("articleId", "parentId", "createdAt");

-- CreateIndex
CREATE INDEX "comment_authorId_idx" ON "comment"("authorId");

-- CreateIndex
CREATE INDEX "likes_articleId_idx" ON "likes"("articleId");

-- CreateIndex
CREATE INDEX "likes_commentId_idx" ON "likes"("commentId");

-- CreateIndex
CREATE UNIQUE INDEX "likes_userId_articleId_key" ON "likes"("userId", "articleId");

-- CreateIndex
CREATE UNIQUE INDEX "likes_userId_commentId_key" ON "likes"("userId", "commentId");

-- CreateIndex
CREATE INDEX "favorite_articleId_idx" ON "favorite"("articleId");

-- CreateIndex
CREATE UNIQUE INDEX "favorite_userId_articleId_key" ON "favorite"("userId", "articleId");

-- CreateIndex
CREATE UNIQUE INDEX "_PermissionToRole_AB_unique" ON "_PermissionToRole"("A", "B");

-- CreateIndex
CREATE INDEX "_PermissionToRole_B_index" ON "_PermissionToRole"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_OwnedProjects_AB_unique" ON "_OwnedProjects"("A", "B");

-- CreateIndex
CREATE INDEX "_OwnedProjects_B_index" ON "_OwnedProjects"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ArticleToTag_AB_unique" ON "_ArticleToTag"("A", "B");

-- CreateIndex
CREATE INDEX "_ArticleToTag_B_index" ON "_ArticleToTag"("B");
