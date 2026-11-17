-- Issue #27: Public Players page
-- Profile visibility for /player/[username]. Every existing player starts
-- visible; owners can turn it off under Account > Accounts > Account Visibility.
ALTER TABLE profile ADD COLUMN is_public boolean NOT NULL DEFAULT true;
